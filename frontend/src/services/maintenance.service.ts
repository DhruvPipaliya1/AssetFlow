import { apiClient } from './apiClient';
import type { MaintenanceRequest, Paginated } from '../types/models';
import type { MaintenanceStatus, Priority } from '../types/enums';

export interface MaintenanceFilters {
  assetId?: string;
  status?: MaintenanceStatus;
  priority?: Priority;
  mine?: 'true' | 'false';
  page?: number;
  take?: number;
}

export interface RaiseMaintenancePayload {
  assetId: string;
  description: string;
  priority?: Priority;
  photoUrl?: string;
}

export const maintenanceService = {
  list: (filters: MaintenanceFilters = {}) =>
    apiClient.get<Paginated<MaintenanceRequest>>('/maintenance', { params: filters }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<{ maintenance: MaintenanceRequest }>(`/maintenance/${id}`).then((r) => r.data.maintenance),

  raise: (data: RaiseMaintenancePayload) =>
    apiClient.post<{ maintenance: MaintenanceRequest }>('/maintenance', data).then((r) => r.data.maintenance),

  decide: (id: string, decision: 'APPROVE' | 'REJECT', technicianUserId?: string) =>
    apiClient
      .patch<{ maintenance: MaintenanceRequest }>(`/maintenance/${id}/decision`, { decision, technicianUserId })
      .then((r) => r.data.maintenance),

  setStatus: (id: string, status: 'TECH_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED', technicianUserId?: string) =>
    apiClient
      .patch<{ maintenance: MaintenanceRequest }>(`/maintenance/${id}/status`, { status, technicianUserId })
      .then((r) => r.data.maintenance),
};
