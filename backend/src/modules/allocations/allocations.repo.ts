import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const include = {
  asset: { select: { id: true, name: true, assetTag: true, status: true } },
  allocatedToUser: { select: { id: true, name: true, email: true } },
  allocatedToDepartment: { select: { id: true, name: true } },
  allocatedByUser: { select: { id: true, name: true } },
} satisfies Prisma.AllocationInclude;

export const allocationsRepo = {
  list: (where: Prisma.AllocationWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.allocation.findMany({ where, include, skip, take, orderBy: { allocatedAt: 'desc' } }),
      prisma.allocation.count({ where }),
    ]),

  findById: (id: string) => prisma.allocation.findUnique({ where: { id }, include }),

  // The current holder record for an asset (the one ACTIVE allocation, if any).
  findActiveByAsset: (assetId: string) =>
    prisma.allocation.findFirst({
      where: { assetId, status: 'ACTIVE' },
      include: { allocatedToUser: { select: { id: true, name: true, email: true } } },
    }),

  userExists: (id: string) => prisma.user.count({ where: { id } }).then((n) => n > 0),
  departmentExists: (id: string) => prisma.department.count({ where: { id } }).then((n) => n > 0),
};
