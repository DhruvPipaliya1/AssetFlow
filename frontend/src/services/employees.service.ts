import { apiClient } from './apiClient';
import type { Employee, Paginated } from '../types/models';
import type { Role, EntityStatus } from '../types/enums';

export interface EmployeeQuery {
  role?: Role;
  status?: EntityStatus;
  departmentId?: string;
  q?: string;
  page?: string;
  take?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  departmentId?: string | null;
  status?: EntityStatus;
}

export const employeesService = {
  list: (params?: EmployeeQuery) =>
    apiClient.get<Paginated<Employee>>('/employees', { params }).then((r) => r.data),

  update: (id: string, data: UpdateEmployeePayload) =>
    apiClient.patch<{ employee: Employee }>(`/employees/${id}`, data).then((r) => r.data.employee),

  changeRole: (id: string, role: Role) =>
    apiClient.patch<{ employee: Employee }>(`/employees/${id}/role`, { role }).then((r) => r.data.employee),
};
