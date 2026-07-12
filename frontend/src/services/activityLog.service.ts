import { apiClient } from './apiClient';
import type { ActivityLogEntry, Paginated } from '../types/models';

export interface ActivityFilters {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: string;
  page?: number;
  take?: number;
}

export const activityLogService = {
  list: (filters: ActivityFilters = {}) =>
    apiClient.get<Paginated<ActivityLogEntry>>('/activity-log', { params: filters }).then((r) => r.data),
};
