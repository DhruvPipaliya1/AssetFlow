import { Prisma } from '@prisma/client';
import { categoriesRepo } from './categories.repo.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
} from './categories.schema.js';
import { notFound } from '../../../lib/errors.js';
import { emit } from '../../../lib/events.js';

export const categoriesService = {
  list: (query: ListCategoriesQuery) =>
    categoriesRepo.list(query.status ? { status: query.status } : {}),

  async get(id: string) {
    const category = await categoriesRepo.findById(id);
    if (!category) throw notFound('Category not found');
    return category;
  },

  async create(input: CreateCategoryInput, actorUserId: string) {
    const data: Prisma.AssetCategoryUncheckedCreateInput = {
      name: input.name,
      status: input.status ?? 'ACTIVE',
    };
    if (input.customFields !== undefined) {
      data.customFields = input.customFields as Prisma.InputJsonValue;
    }
    const category = await categoriesRepo.create(data);
    emit({ type: 'CategoryCreated', actorUserId, entityType: 'AssetCategory', entityId: category.id, meta: { name: category.name } });
    return category;
  },

  async update(id: string, input: UpdateCategoryInput, actorUserId: string) {
    await this.get(id);
    const data: Prisma.AssetCategoryUncheckedUpdateInput = {
      name: input.name,
      status: input.status,
    };
    if (input.customFields !== undefined) {
      data.customFields = input.customFields as Prisma.InputJsonValue;
    }
    const category = await categoriesRepo.update(id, data);
    emit({ type: 'CategoryUpdated', actorUserId, entityType: 'AssetCategory', entityId: id });
    return category;
  },

  async deactivate(id: string, actorUserId: string) {
    await this.get(id);
    const category = await categoriesRepo.update(id, { status: 'INACTIVE' });
    emit({ type: 'CategoryDeactivated', actorUserId, entityType: 'AssetCategory', entityId: id });
    return category;
  },
};
