import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const include = {
  actorUser: { select: { id: true, name: true, role: true } },
} satisfies Prisma.ActivityLogInclude;

export const activityLogRepo = {
  list: (where: Prisma.ActivityLogWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.activityLog.findMany({ where, include, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.activityLog.count({ where }),
    ]),
};
