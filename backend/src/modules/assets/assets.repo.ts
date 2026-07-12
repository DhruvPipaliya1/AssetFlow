import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// Light projection for the directory list — names, not full nested rows.
const listInclude = {
  category: { select: { id: true, name: true } },
  currentHolderUser: { select: { id: true, name: true, email: true } },
  ownerDepartment: { select: { id: true, name: true } },
} satisfies Prisma.AssetInclude;

// Heavy include for the detail view — pulls the relations the derived history
// timeline is built from (allocations + transfers + maintenance).
const detailInclude = {
  category: { select: { id: true, name: true } },
  currentHolderUser: { select: { id: true, name: true, email: true } },
  ownerDepartment: { select: { id: true, name: true } },
  allocations: {
    orderBy: { allocatedAt: 'desc' },
    include: {
      allocatedToUser: { select: { id: true, name: true } },
      allocatedToDepartment: { select: { id: true, name: true } },
      allocatedByUser: { select: { id: true, name: true } },
    },
  },
  transfers: {
    orderBy: { createdAt: 'desc' },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
      requestedByUser: { select: { id: true, name: true } },
      approvedByUser: { select: { id: true, name: true } },
    },
  },
  maintenance: {
    orderBy: { createdAt: 'desc' },
    include: {
      raisedByUser: { select: { id: true, name: true } },
      technicianUser: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.AssetInclude;

export type AssetDetail = Prisma.AssetGetPayload<{ include: typeof detailInclude }>;

export const assetsRepo = {
  list: (where: Prisma.AssetWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.asset.findMany({ where, include: listInclude, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.asset.count({ where }),
    ]),

  findById: (id: string) => prisma.asset.findUnique({ where: { id }, include: detailInclude }),

  // Bare row — used by the QR endpoint (only needs the tag) and existence checks.
  findBare: (id: string) => prisma.asset.findUnique({ where: { id } }),

  create: (data: Prisma.AssetUncheckedCreateInput) =>
    prisma.asset.create({ data, include: listInclude }),

  update: (id: string, data: Prisma.AssetUncheckedUpdateInput) =>
    prisma.asset.update({ where: { id }, data, include: listInclude }),

  categoryExists: (id: string) =>
    prisma.assetCategory.count({ where: { id } }).then((n) => n > 0),

  departmentExists: (id: string) =>
    prisma.department.count({ where: { id } }).then((n) => n > 0),
};
