import { prisma } from '../../lib/prisma.js';

const contains = (q: string) => ({ contains: q, mode: 'insensitive' as const });

export const searchRepo = {
  assets: (q: string) =>
    prisma.asset.findMany({
      where: { OR: [{ name: contains(q) }, { assetTag: contains(q) }, { serialNumber: contains(q) }] },
      take: 6,
      orderBy: { assetTag: 'asc' },
      select: { id: true, name: true, assetTag: true, status: true },
    }),

  employees: (q: string) =>
    prisma.user.findMany({
      where: { OR: [{ name: contains(q) }, { email: contains(q) }] },
      take: 6,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true },
    }),

  departments: (q: string) =>
    prisma.department.findMany({
      where: { name: contains(q) },
      take: 6,
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
};
