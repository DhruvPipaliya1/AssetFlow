import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export const notificationsRepo = {
  list: (where: Prisma.NotificationWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]),

  unreadCount: (userId: string) =>
    prisma.notification.count({ where: { userId, isRead: false } }),

  findById: (id: string) => prisma.notification.findUnique({ where: { id } }),

  markRead: (id: string) =>
    prisma.notification.update({ where: { id }, data: { isRead: true } }),

  markAllRead: (userId: string) =>
    prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }),
};
