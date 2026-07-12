import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { allocationsRepo } from './allocations.repo.js';
import { assertDeptScope, type Actor } from './scope.js';
import type {
  CreateAllocationInput,
  ReturnAllocationInput,
  ListAllocationsQuery,
} from './allocations.schema.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { parsePagination, paginated } from '../../lib/search.js';
import { assertTransition } from '../../lib/stateMachine.js';
import { emit } from '../../lib/events.js';

// Minimal shape of the FOR UPDATE-locked asset row.
interface LockedAsset {
  id: string;
  name: string;
  assetTag: string;
  status: string;
  ownerDepartmentId: string | null;
}

export const allocationsService = {
  async list(query: ListAllocationsQuery) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.AllocationWhereInput = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.allocatedToUserId) where.allocatedToUserId = query.allocatedToUserId;
    if (query.status) where.status = query.status;
    const [items, total] = await allocationsRepo.list(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },

  async get(id: string) {
    const allocation = await allocationsRepo.findById(id);
    if (!allocation) throw notFound('Allocation not found');
    return allocation;
  },

  // Golden Invariant #2 — no double-allocation. Lock the asset row, refuse if
  // it isn't AVAILABLE (409 + heldBy + transfer hint). The partial unique index
  // one_active_alloc is the race backstop.
  async allocate(input: CreateAllocationInput, actor: Actor) {
    if (!(await allocationsRepo.userExists(input.allocatedToUserId))) {
      throw badRequest('Recipient user not found');
    }
    if (input.allocatedToDepartmentId && !(await allocationsRepo.departmentExists(input.allocatedToDepartmentId))) {
      throw badRequest('Department not found');
    }

    const allocationId = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LockedAsset[]>`
        SELECT id, name, "assetTag", status::text AS status, "ownerDepartmentId"
        FROM "Asset" WHERE id = ${input.assetId} FOR UPDATE`;
      const asset = rows[0];
      if (!asset) throw notFound('Asset not found');

      // Dept Heads can only allocate assets owned by their own department.
      assertDeptScope(actor, asset.ownerDepartmentId);

      if (asset.status !== 'AVAILABLE') {
        const active = await tx.allocation.findFirst({
          where: { assetId: asset.id, status: 'ACTIVE' },
          include: { allocatedToUser: { select: { id: true, name: true } } },
        });
        throw conflict('Asset is not available for allocation', {
          assetStatus: asset.status,
          heldBy: active?.allocatedToUser ?? null,
          action: 'TRANSFER_REQUEST',
        });
      }

      assertTransition('asset', asset.status, 'ALLOCATED');

      const allocation = await tx.allocation.create({
        data: {
          assetId: asset.id,
          allocatedToUserId: input.allocatedToUserId,
          allocatedToDepartmentId: input.allocatedToDepartmentId,
          allocatedByUserId: actor.id,
          expectedReturnDate: input.expectedReturnDate,
          status: 'ACTIVE',
        },
      });
      await tx.asset.update({
        where: { id: asset.id },
        data: { status: 'ALLOCATED', currentHolderUserId: input.allocatedToUserId },
      });
      return allocation.id;
    });

    emit({
      type: 'AssetAllocated',
      actorUserId: actor.id,
      targetUserId: input.allocatedToUserId,
      entityType: 'Asset',
      entityId: input.assetId,
      message: 'An asset has been allocated to you',
      meta: { allocationId },
    });
    return this.get(allocationId);
  },

  // Return / check-in — close the allocation, flip the asset back to AVAILABLE.
  async return(id: string, input: ReturnAllocationInput, actor: Actor) {
    const existing = await allocationsRepo.findById(id);
    if (!existing) throw notFound('Allocation not found');
    if (existing.status === 'RETURNED') throw conflict('Allocation is already returned');

    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LockedAsset[]>`
        SELECT id, name, "assetTag", status::text AS status, "ownerDepartmentId"
        FROM "Asset" WHERE id = ${existing.assetId} FOR UPDATE`;
      const asset = rows[0];
      if (!asset) throw notFound('Asset not found');
      assertTransition('asset', asset.status, 'AVAILABLE');

      await tx.allocation.update({
        where: { id },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          returnCondition: input.returnCondition,
          checkInNotes: input.checkInNotes,
        },
      });
      await tx.asset.update({
        where: { id: asset.id },
        data: { status: 'AVAILABLE', currentHolderUserId: null },
      });
    });

    emit({
      type: 'AssetReturned',
      actorUserId: actor.id,
      entityType: 'Asset',
      entityId: existing.assetId,
      meta: { allocationId: id, returnCondition: input.returnCondition },
    });
    return this.get(id);
  },
};
