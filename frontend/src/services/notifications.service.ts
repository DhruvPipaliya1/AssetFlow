import { apiClient } from './apiClient';
import type { Notification, Paginated } from '../types/models';

export interface NotificationsResponse extends Paginated<Notification> {
  unreadCount: number;
}

export interface NotificationFilters {
  isRead?: 'true' | 'false';
  page?: number;
  take?: number;
}

export const notificationsService = {
  list: (filters: NotificationFilters = {}) =>
    apiClient.get<NotificationsResponse>('/notifications', { params: filters }).then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch<{ notification: Notification }>(`/notifications/${id}/read`).then((r) => r.data.notification),

  markAllRead: () =>
    apiClient.patch<{ updated: number }>('/notifications/read-all').then((r) => r.data),
};
