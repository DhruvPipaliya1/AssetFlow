import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';

// Safe projection — NEVER expose passwordHash.
const select = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  departmentId: true,
  createdAt: true,
  department: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export const employeesRepo = {
  list: (where: Prisma.UserWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.user.findMany({ where, select, skip, take, orderBy: { name: 'asc' } }),
      prisma.user.count({ where }),
    ]),

  findById: (id: string) => prisma.user.findUnique({ where: { id }, select }),

  update: (id: string, data: Prisma.UserUncheckedUpdateInput) =>
    prisma.user.update({ where: { id }, data, select }),
};
