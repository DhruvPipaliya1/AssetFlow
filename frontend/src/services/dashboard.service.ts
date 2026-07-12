import { apiClient } from './apiClient';
import type { DashboardResponse } from '../types/models';

export const dashboardService = {
  kpis: () => apiClient.get<DashboardResponse>('/dashboard/kpis').then((r) => r.data),
};
