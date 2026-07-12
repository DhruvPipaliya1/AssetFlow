import { Prisma, type Role } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { auditsRepo } from './audits.repo.js';
import type {
  CreateCycleInput,
  AssignAuditorsInput,
  AuditItemInput,
  ListCyclesQuery,
} from './audits.schema.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { parsePagination, paginated } from '../../lib/search.js';
import { assertTransition } from '../../lib/stateMachine.js';
import { emit } from '../../lib/events.js';

export interface Actor {
  id: string;
  role: Role;
  departmentId: string | null;
}

export const auditsService = {
  async listCycles(query: ListCyclesQuery) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.AuditCycleWhereInput = {};
    if (query.status) where.status = query.status;
    const [items, total] = await auditsRepo.listCycles(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },

  async getCycle(id: string) {
    const cycle = await auditsRepo.findCycle(id);
    if (!cycle) throw notFound('Audit cycle not found');
    return cycle;
  },

  async createCycle(input: CreateCycleInput, actor: Actor) {
    const cycle = await auditsRepo.createCycle({
      name: input.name,
      scopeType: input.scopeType,
      scopeValue: input.scopeValue,
      startDate: input.startDate,
      endDate: input.endDate,
      createdByUserId: actor.id,
      status: 'PLANNED',
    });
    emit({ type: 'AuditCycleCreated', actorUserId: actor.id, entityType: 'AuditCycle', entityId: cycle.id });
    return cycle;
  },

  async assignAuditors(id: string, input: AssignAuditorsInput, actor: Actor) {
    const cycle = await this.getCycle(id);
    if (cycle.status === 'CLOSED') throw conflict('Cycle is closed');
    const found = await auditsRepo.userCount(input.auditorUserIds);
    if (found !== input.auditorUserIds.length) throw badRequest('One or more auditors not found');

    await auditsRepo.addAuditors(id, input.auditorUserIds);
    emit({
      type: 'AuditorsAssigned',
      actorUserId: actor.id,
      entityType: 'AuditCycle',
      entityId: id,
      meta: { auditorUserIds: input.auditorUserIds },
    });
    return this.getCycle(id);
  },

  // PLANNED → IN_PROGRESS. Materialise a PENDING AuditItem per in-scope asset.
  async start(id: string, actor: Actor) {
    const cycle = await this.getCycle(id);
    assertTransition('auditCycle', cycle.status, 'IN_PROGRESS');
    const assetIds = await auditsRepo.inScopeAssetIds(cycle.scopeType, cycle.scopeValue);
    if (assetIds.length === 0) throw badRequest('No assets fall in this cycle scope');

    await prisma.$transaction(async (tx) => {
      await tx.auditItem.createMany({
        data: assetIds.map((assetId) => ({ auditCycleId: id, assetId, status: 'PENDING' as const })),
        skipDuplicates: true, // @@unique(auditCycleId, assetId) — re-start is idempotent
      });
      await tx.auditCycle.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
    });
    emit({
      type: 'AuditCycleStarted',
      actorUserId: actor.id,
      entityType: 'AuditCycle',
      entityId: id,
      meta: { itemCount: assetIds.length },
    });
    return this.getCycle(id);
  },

  items: (cycleId: string) => auditsRepo.items(cycleId),

  discrepancies: (cycleId: string) =>
    auditsRepo.items(cycleId, { status: { in: ['MISSING', 'DAMAGED'] } }),

  // Mark an item — assigned auditors only (Admin bypasses). The cycle must be
  // IN_PROGRESS (a closed cycle is locked).
  async markItem(itemId: string, input: AuditItemInput, actor: Actor) {
    const item = await auditsRepo.findItem(itemId);
    if (!item) throw notFound('Audit item not found');
    if (item.auditCycle.status !== 'IN_PROGRESS') {
      throw conflict('Audit cycle is not in progress');
    }
    if (actor.role !== 'ADMIN') {
      const auditors = await auditsRepo.auditorIds(item.auditCycleId);
      if (!auditors.includes(actor.id)) throw forbidden('You are not an assigned auditor for this cycle');
    }

    const updated = await prisma.auditItem.update({
      where: { id: itemId },
      data: { status: input.status, notes: input.notes, auditedByUserId: actor.id, auditedAt: new Date() },
      include: { asset: { select: { id: true, name: true, assetTag: true } } },
    });
    emit({
      type: 'AuditItemMarked',
      actorUserId: actor.id,
      entityType: 'AuditItem',
      entityId: itemId,
      meta: { status: input.status, assetId: item.assetId },
    });
    return updated;
  },

  // Close (lock) the cycle. MISSING items → their asset becomes LOST. One txn.
  async close(id: string, actor: Actor) {
    const cycle = await this.getCycle(id);
    assertTransition('auditCycle', cycle.status, 'CLOSED');
    const flagged = await auditsRepo.items(id, { status: { in: ['MISSING', 'DAMAGED'] } });
    const missing = flagged.filter((i) => i.status === 'MISSING');

    await prisma.$transaction(async (tx) => {
      for (const item of missing) {
        const rows = await tx.$queryRaw<{ id: string; status: string }[]>`
          SELECT id, status::text AS status FROM "Asset" WHERE id = ${item.assetId} FOR UPDATE`;
        const asset = rows[0];
        if (!asset) continue;
        if (asset.status !== 'LOST') {
          assertTransition('asset', asset.status, 'LOST');
          await tx.asset.update({
            where: { id: asset.id },
            data: { status: 'LOST', currentHolderUserId: null },
          });
        }
      }
      await tx.auditCycle.update({ where: { id }, data: { status: 'CLOSED' } });
    });

    if (flagged.length > 0) {
      emit({
        type: 'AuditDiscrepancyFlagged',
        actorUserId: actor.id,
        entityType: 'AuditCycle',
        entityId: id,
        meta: {
          missing: missing.map((i) => i.asset.assetTag),
          damaged: flagged.filter((i) => i.status === 'DAMAGED').map((i) => i.asset.assetTag),
        },
      });
    }
    return {
      cycle: await this.getCycle(id),
      discrepancies: flagged,
      lostAssetTags: missing.map((i) => i.asset.assetTag),
    };
  },
};
