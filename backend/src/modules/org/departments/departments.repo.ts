import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';

// Shared shape returned to clients: head + parent names + member/asset counts.
const include = {
  headUser: { select: { id: true, name: true } },
  parentDepartment: { select: { id: true, name: true } },
  _count: { select: { members: true, ownedAssets: true } },
} satisfies Prisma.DepartmentInclude;

export const departmentsRepo = {
  list: (where: Prisma.DepartmentWhereInput) =>
    prisma.department.findMany({ where, include, orderBy: { name: 'asc' } }),

  findById: (id: string) => prisma.department.findUnique({ where: { id }, include }),

  create: (data: Prisma.DepartmentUncheckedCreateInput) =>
    prisma.department.create({ data, include }),

  update: (id: string, data: Prisma.DepartmentUncheckedUpdateInput) =>
    prisma.department.update({ where: { id }, data, include }),
};
