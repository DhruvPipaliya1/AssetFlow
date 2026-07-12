import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const include = {
  asset: { select: { id: true, name: true, assetTag: true, status: true, ownerDepartmentId: true } },
  fromUser: { select: { id: true, name: true } },
  toUser: { select: { id: true, name: true } },
  requestedByUser: { select: { id: true, name: true } },
  approvedByUser: { select: { id: true, name: true } },
} satisfies Prisma.TransferRequestInclude;

export const transfersRepo = {
  list: (where: Prisma.TransferRequestWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.transferRequest.findMany({ where, include, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.transferRequest.count({ where }),
    ]),

  findById: (id: string) => prisma.transferRequest.findUnique({ where: { id }, include }),

  create: (data: Prisma.TransferRequestUncheckedCreateInput) =>
    prisma.transferRequest.create({ data, include }),

  userExists: (id: string) => prisma.user.count({ where: { id } }).then((n) => n > 0),
};
