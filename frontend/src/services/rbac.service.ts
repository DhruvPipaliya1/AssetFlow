import { apiClient } from './apiClient';

export interface PermissionMeta {
  key: string;
  label: string;
  description: string;
  category: string;
  locked: boolean;
}

export interface RbacMatrix {
  roles: string[];
  permissions: PermissionMeta[];
  grants: Record<string, string[]>;
}

export const rbacService = {
  matrix: () => apiClient.get<RbacMatrix>('/rbac/matrix').then((r) => r.data),

  setRole: (role: string, permissions: string[]) =>
    apiClient.put<RbacMatrix>(`/rbac/roles/${role}`, { permissions }).then((r) => r.data),
};
