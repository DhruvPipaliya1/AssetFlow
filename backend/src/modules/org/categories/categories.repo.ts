import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';

const include = {
  _count: { select: { assets: true } },
} satisfies Prisma.AssetCategoryInclude;

export const categoriesRepo = {
  list: (where: Prisma.AssetCategoryWhereInput) =>
    prisma.assetCategory.findMany({ where, include, orderBy: { name: 'asc' } }),

  findById: (id: string) => prisma.assetCategory.findUnique({ where: { id }, include }),

  create: (data: Prisma.AssetCategoryUncheckedCreateInput) =>
    prisma.assetCategory.create({ data, include }),

  update: (id: string, data: Prisma.AssetCategoryUncheckedUpdateInput) =>
    prisma.assetCategory.update({ where: { id }, data, include }),
};
