import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const include = {
  asset: { select: { id: true, name: true, assetTag: true, status: true } },
  raisedByUser: { select: { id: true, name: true } },
  approvedByUser: { select: { id: true, name: true } },
  technicianUser: { select: { id: true, name: true } },
} satisfies Prisma.MaintenanceRequestInclude;

export const maintenanceRepo = {
  list: (where: Prisma.MaintenanceRequestWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.maintenanceRequest.findMany({ where, include, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.maintenanceRequest.count({ where }),
    ]),

  findById: (id: string) => prisma.maintenanceRequest.findUnique({ where: { id }, include }),

  create: (data: Prisma.MaintenanceRequestUncheckedCreateInput) =>
    prisma.maintenanceRequest.create({ data, include }),

  userExists: (id: string) => prisma.user.count({ where: { id } }).then((n) => n > 0),
};
