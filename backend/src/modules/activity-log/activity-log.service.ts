import { Prisma } from '@prisma/client';
import { activityLogRepo } from './activity-log.repo.js';
import type { ListActivityQuery } from './activity-log.schema.js';
import { parsePagination, paginated } from '../../lib/search.js';

export const activityLogService = {
  async list(query: ListActivityQuery) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.ActivityLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.action) where.action = query.action;
    const [items, total] = await activityLogRepo.list(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },
};
