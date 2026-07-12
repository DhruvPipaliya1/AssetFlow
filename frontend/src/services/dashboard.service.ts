import { apiClient } from './apiClient';
import type { DashboardResponse, DashboardActivityItem } from '../types/models';

export const dashboardService = {
  kpis: () => apiClient.get<DashboardResponse>('/dashboard/kpis').then((r) => r.data),

  recentActivity: () =>
    apiClient.get<{ items: DashboardActivityItem[] }>('/dashboard/activity').then((r) => r.data.items),
};
