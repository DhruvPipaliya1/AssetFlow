import { Prisma } from '@prisma/client';
import { notificationsRepo } from './notifications.repo.js';
import type { ListNotificationsQuery } from './notifications.schema.js';
import { forbidden, notFound } from '../../lib/errors.js';
import { parsePagination, paginated } from '../../lib/search.js';

export const notificationsService = {
  // Always scoped to the caller — a user only ever sees their own bell feed.
  async list(userId: string, query: ListNotificationsQuery) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.isRead) where.isRead = query.isRead === 'true';
    const [items, total] = await notificationsRepo.list(where, skip, take);
    const unreadCount = await notificationsRepo.unreadCount(userId);
    return { ...paginated(items, total, { skip, take, page }), unreadCount };
  },

  async markRead(id: string, userId: string) {
    const notification = await notificationsRepo.findById(id);
    if (!notification) throw notFound('Notification not found');
    if (notification.userId !== userId) throw forbidden('Not your notification');
    return notificationsRepo.markRead(id);
  },

  async markAllRead(userId: string) {
    const result = await notificationsRepo.markAllRead(userId);
    return { updated: result.count };
  },
};
