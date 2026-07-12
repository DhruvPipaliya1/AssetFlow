import { apiClient } from './apiClient';
import type { Department } from '../types/models';
import type { EntityStatus } from '../types/enums';

export interface DepartmentPayload {
  name?: string; // required on create (enforced by the form); optional for partial updates
  headUserId?: string | null;
  parentDepartmentId?: string | null;
  status?: EntityStatus;
}

export const departmentsService = {
  list: () =>
    apiClient.get<{ departments: Department[] }>('/departments').then((r) => r.data.departments),

  create: (data: DepartmentPayload) =>
    apiClient.post<{ department: Department }>('/departments', data).then((r) => r.data.department),

  update: (id: string, data: DepartmentPayload) =>
    apiClient.patch<{ department: Department }>(`/departments/${id}`, data).then((r) => r.data.department),

  deactivate: (id: string) =>
    apiClient.delete<{ department: Department }>(`/departments/${id}`).then((r) => r.data.department),
};
