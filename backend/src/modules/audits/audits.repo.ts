import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const cycleInclude = {
  createdByUser: { select: { id: true, name: true } },
  auditors: { include: { auditorUser: { select: { id: true, name: true } } } },
  _count: { select: { items: true } },
} satisfies Prisma.AuditCycleInclude;

const itemInclude = {
  asset: { select: { id: true, name: true, assetTag: true, status: true } },
  auditedByUser: { select: { id: true, name: true } },
} satisfies Prisma.AuditItemInclude;

export const auditsRepo = {
  listCycles: (where: Prisma.AuditCycleWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.auditCycle.findMany({ where, include: cycleInclude, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.auditCycle.count({ where }),
    ]),

  findCycle: (id: string) => prisma.auditCycle.findUnique({ where: { id }, include: cycleInclude }),

  createCycle: (data: Prisma.AuditCycleUncheckedCreateInput) =>
    prisma.auditCycle.create({ data, include: cycleInclude }),

  auditorIds: (auditCycleId: string) =>
    prisma.auditAssignment
      .findMany({ where: { auditCycleId }, select: { auditorUserId: true } })
      .then((rows) => rows.map((r) => r.auditorUserId)),

  addAuditors: (auditCycleId: string, auditorUserIds: string[]) =>
    prisma.auditAssignment.createMany({
      data: auditorUserIds.map((auditorUserId) => ({ auditCycleId, auditorUserId })),
      skipDuplicates: true,
    }),

  // In-scope assets for a cycle: by owning department or by location.
  inScopeAssetIds: (scopeType: string, scopeValue: string) =>
    prisma.asset
      .findMany({
        where: scopeType === 'DEPARTMENT' ? { ownerDepartmentId: scopeValue } : { location: scopeValue },
        select: { id: true },
      })
      .then((rows) => rows.map((r) => r.id)),

  items: (auditCycleId: string, where: Prisma.AuditItemWhereInput = {}) =>
    prisma.auditItem.findMany({
      where: { auditCycleId, ...where },
      include: itemInclude,
      orderBy: { asset: { assetTag: 'asc' } },
    }),

  findItem: (id: string) =>
    prisma.auditItem.findUnique({
      where: { id },
      include: { ...itemInclude, auditCycle: { select: { id: true, status: true } } },
    }),

  userCount: (ids: string[]) => prisma.user.count({ where: { id: { in: ids } } }),
};
