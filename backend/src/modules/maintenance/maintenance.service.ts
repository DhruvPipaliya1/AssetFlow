import { Prisma, type Role } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { maintenanceRepo } from './maintenance.repo.js';
import type {
  CreateMaintenanceInput,
  DecideMaintenanceInput,
  StatusMaintenanceInput,
  ListMaintenanceQuery,
} from './maintenance.schema.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { parsePagination, paginated } from '../../lib/search.js';
import { assertTransition } from '../../lib/stateMachine.js';
import { emit } from '../../lib/events.js';

export interface Actor {
  id: string;
  role: Role;
  departmentId: string | null;
}

interface LockedAsset {
  id: string;
  status: string;
}

const lockAsset = (tx: Prisma.TransactionClient, assetId: string) =>
  tx.$queryRaw<LockedAsset[]>`
    SELECT id, status::text AS status FROM "Asset" WHERE id = ${assetId} FOR UPDATE`;

export const maintenanceService = {
  async list(query: ListMaintenanceQuery, actor: Actor) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.MaintenanceRequestWhereInput = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.mine === 'true') where.raisedByUserId = actor.id;
    const [items, total] = await maintenanceRepo.list(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },

  async get(id: string) {
    const request = await maintenanceRepo.findById(id);
    if (!request) throw notFound('Maintenance request not found');
    return request;
  },

  // Raise → PENDING. The asset is deliberately left untouched (Invariant #4).
  async raise(input: CreateMaintenanceInput, actor: Actor) {
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId }, select: { id: true } });
    if (!asset) throw notFound('Asset not found');

    const request = await maintenanceRepo.create({
      assetId: input.assetId,
      raisedByUserId: actor.id,
      description: input.description,
      priority: input.priority ?? 'MEDIUM',
      photoUrl: input.photoUrl,
      status: 'PENDING',
    });
    emit({
      type: 'MaintenanceRaised',
      actorUserId: actor.id,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      meta: { assetId: input.assetId, priority: request.priority },
    });
    return request;
  },

  // Approve → asset AVAILABLE/ALLOCATED → UNDER_MAINTENANCE (one txn). Reject →
  // asset untouched. Either way the request must still be PENDING.
  async decide(id: string, input: DecideMaintenanceInput, actor: Actor) {
    const request = await maintenanceRepo.findById(id);
    if (!request) throw notFound('Maintenance request not found');
    if (request.status !== 'PENDING') {
      throw conflict(`Maintenance request is already ${request.status.toLowerCase()}`);
    }
    if (input.technicianUserId && !(await maintenanceRepo.userExists(input.technicianUserId))) {
      throw badRequest('Technician user not found');
    }

    if (input.decision === 'REJECT') {
      assertTransition('maintenance', request.status, 'REJECTED');
      await prisma.maintenanceRequest.update({
        where: { id },
        data: { status: 'REJECTED', approvedByUserId: actor.id },
      });
      emit({
        type: 'MaintenanceRejected',
        actorUserId: actor.id,
        targetUserId: request.raisedByUserId,
        entityType: 'MaintenanceRequest',
        entityId: id,
        message: 'Your maintenance request was rejected',
      });
      return this.get(id);
    }

    assertTransition('maintenance', request.status, 'APPROVED');
    await prisma.$transaction(async (tx) => {
      const rows = await lockAsset(tx, request.assetId);
      const asset = rows[0];
      if (!asset) throw notFound('Asset not found');
      assertTransition('asset', asset.status, 'UNDER_MAINTENANCE');
      await tx.asset.update({ where: { id: asset.id }, data: { status: 'UNDER_MAINTENANCE' } });
      await tx.maintenanceRequest.update({
        where: { id },
        data: { status: 'APPROVED', approvedByUserId: actor.id, technicianUserId: input.technicianUserId },
      });
    });
    emit({
      type: 'MaintenanceApproved',
      actorUserId: actor.id,
      targetUserId: request.raisedByUserId,
      entityType: 'MaintenanceRequest',
      entityId: id,
      message: 'Your maintenance request was approved',
      meta: { assetId: request.assetId },
    });
    return this.get(id);
  },

  // Advance work: TECH_ASSIGNED → IN_PROGRESS → RESOLVED. On RESOLVED the asset
  // returns to AVAILABLE (one txn).
  async setStatus(id: string, input: StatusMaintenanceInput, actor: Actor) {
    const request = await maintenanceRepo.findById(id);
    if (!request) throw notFound('Maintenance request not found');
    assertTransition('maintenance', request.status, input.status);
    if (input.technicianUserId && !(await maintenanceRepo.userExists(input.technicianUserId))) {
      throw badRequest('Technician user not found');
    }

    if (input.status === 'RESOLVED') {
      await prisma.$transaction(async (tx) => {
        const rows = await lockAsset(tx, request.assetId);
        const asset = rows[0];
        if (!asset) throw notFound('Asset not found');
        assertTransition('asset', asset.status, 'AVAILABLE');
        await tx.asset.update({ where: { id: asset.id }, data: { status: 'AVAILABLE' } });
        await tx.maintenanceRequest.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            technicianUserId: input.technicianUserId ?? request.technicianUserId,
          },
        });
      });
      emit({
        type: 'MaintenanceResolved',
        actorUserId: actor.id,
        targetUserId: request.raisedByUserId,
        entityType: 'MaintenanceRequest',
        entityId: id,
        message: 'Your maintenance request was resolved',
        meta: { assetId: request.assetId },
      });
      return this.get(id);
    }

    await prisma.maintenanceRequest.update({
      where: { id },
      data: { status: input.status, technicianUserId: input.technicianUserId ?? request.technicianUserId },
    });
    emit({
      type: 'MaintenanceStatusChanged',
      actorUserId: actor.id,
      entityType: 'MaintenanceRequest',
      entityId: id,
      meta: { status: input.status },
    });
    return this.get(id);
  },
};
