import { apiClient } from './apiClient';
import type { Allocation, Paginated } from '../types/models';
import type { AllocationStatus } from '../types/enums';

export interface AllocationFilters {
  assetId?: string;
  allocatedToUserId?: string;
  status?: AllocationStatus;
  page?: number;
  take?: number;
}

export interface AllocatePayload {
  assetId: string;
  allocatedToUserId: string;
  allocatedToDepartmentId?: string;
  expectedReturnDate?: string;
}

export interface ReturnPayload {
  returnCondition?: string;
  checkInNotes?: string;
}

export const allocationsService = {
  list: (filters: AllocationFilters = {}) =>
    apiClient.get<Paginated<Allocation>>('/allocations', { params: filters }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<{ allocation: Allocation }>(`/allocations/${id}`).then((r) => r.data.allocation),

  allocate: (data: AllocatePayload) =>
    apiClient.post<{ allocation: Allocation }>('/allocations', data).then((r) => r.data.allocation),

  return: (id: string, data: ReturnPayload) =>
    apiClient.post<{ allocation: Allocation }>(`/allocations/${id}/return`, data).then((r) => r.data.allocation),
};
