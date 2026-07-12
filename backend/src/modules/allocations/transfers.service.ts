import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { transfersRepo } from './transfers.repo.js';
import { assertDeptScope, type Actor } from './scope.js';
import type {
  CreateTransferInput,
  DecideTransferInput,
  ListTransfersQuery,
} from './transfers.schema.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { parsePagination, paginated } from '../../lib/search.js';
import { assertTransition } from '../../lib/stateMachine.js';
import { emit } from '../../lib/events.js';

interface LockedAsset {
  id: string;
  status: string;
  ownerDepartmentId: string | null;
}

export const transfersService = {
  async list(query: ListTransfersQuery) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.TransferRequestWhereInput = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status;
    const [items, total] = await transfersRepo.list(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },

  async get(id: string) {
    const transfer = await transfersRepo.findById(id);
    if (!transfer) throw notFound('Transfer request not found');
    return transfer;
  },

  // Raise a transfer for an asset that's currently held. fromUser is the current
  // holder (from the active allocation) — never taken from the request body.
  async create(input: CreateTransferInput, actor: Actor) {
    if (!(await transfersRepo.userExists(input.toUserId))) {
      throw badRequest('Recipient user not found');
    }
    const asset = await prisma.asset.findUnique({
      where: { id: input.assetId },
      select: { id: true, status: true, currentHolderUserId: true },
    });
    if (!asset) throw notFound('Asset not found');
    if (asset.status !== 'ALLOCATED') {
      throw badRequest('Asset is not currently held — allocate it directly instead');
    }
    if (asset.currentHolderUserId === input.toUserId) {
      throw badRequest('Asset is already held by that user');
    }

    const transfer = await transfersRepo.create({
      assetId: input.assetId,
      fromUserId: asset.currentHolderUserId,
      toUserId: input.toUserId,
      requestedByUserId: actor.id,
      status: 'REQUESTED',
    });
    emit({
      type: 'TransferRequested',
      actorUserId: actor.id,
      entityType: 'TransferRequest',
      entityId: transfer.id,
      meta: { assetId: input.assetId, toUserId: input.toUserId },
    });
    return transfer;
  },

  // Approve/reject. On APPROVE: close the old allocation, open the new one, and
  // move the holder — all in ONE transaction (§7.2).
  async decide(id: string, input: DecideTransferInput, actor: Actor, expectedReturnDate?: Date) {
    const transfer = await transfersRepo.findById(id);
    if (!transfer) throw notFound('Transfer request not found');
    if (transfer.status !== 'REQUESTED') {
      throw conflict(`Transfer is already ${transfer.status.toLowerCase()}`);
    }
    // Dept Heads may only decide transfers for assets in their own department.
    assertDeptScope(actor, transfer.asset.ownerDepartmentId);

    if (input.decision === 'REJECT') {
      assertTransition('transfer', transfer.status, 'REJECTED');
      await prisma.transferRequest.update({
        where: { id },
        data: { status: 'REJECTED', approvedByUserId: actor.id, decidedAt: new Date() },
      });
      emit({
        type: 'TransferRejected',
        actorUserId: actor.id,
        targetUserId: transfer.requestedByUserId,
        entityType: 'TransferRequest',
        entityId: id,
        message: 'Your transfer request was rejected',
      });
      return this.get(id);
    }

    // APPROVE — REQUESTED → APPROVED → COMPLETED, all effects in one txn.
    assertTransition('transfer', transfer.status, 'APPROVED');
    assertTransition('transfer', 'APPROVED', 'COMPLETED');

    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LockedAsset[]>`
        SELECT id, status::text AS status, "ownerDepartmentId"
        FROM "Asset" WHERE id = ${transfer.assetId} FOR UPDATE`;
      const asset = rows[0];
      if (!asset) throw notFound('Asset not found');
      // Asset must be allocatable (blocks approving a transfer on a
      // maintenance/lost asset). AVAILABLE→ALLOCATED or ALLOCATED no-op.
      assertTransition('asset', asset.status, 'ALLOCATED');

      // Close whoever currently holds it.
      await tx.allocation.updateMany({
        where: { assetId: asset.id, status: 'ACTIVE' },
        data: { status: 'RETURNED', returnedAt: new Date() },
      });
      // Open the new holder's allocation.
      await tx.allocation.create({
        data: {
          assetId: asset.id,
          allocatedToUserId: transfer.toUserId,
          allocatedByUserId: actor.id,
          expectedReturnDate,
          status: 'ACTIVE',
        },
      });
      await tx.asset.update({
        where: { id: asset.id },
        data: { status: 'ALLOCATED', currentHolderUserId: transfer.toUserId },
      });
      await tx.transferRequest.update({
        where: { id },
        data: { status: 'COMPLETED', approvedByUserId: actor.id, decidedAt: new Date() },
      });
    });

    emit({
      type: 'AssetTransferred',
      actorUserId: actor.id,
      targetUserId: transfer.toUserId,
      entityType: 'Asset',
      entityId: transfer.assetId,
      message: 'An asset has been transferred to you',
      meta: { transferId: id, fromUserId: transfer.fromUserId },
    });
    if (transfer.fromUserId) {
      emit({
        type: 'AssetTransferred',
        actorUserId: actor.id,
        targetUserId: transfer.fromUserId,
        entityType: 'Asset',
        entityId: transfer.assetId,
        message: 'An asset was transferred away from you',
        meta: { transferId: id, toUserId: transfer.toUserId },
      });
    }
    return this.get(id);
  },
};
