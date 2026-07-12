import { apiClient } from './apiClient';
import type { AssetCategory, CategoryCustomField } from '../types/models';
import type { EntityStatus } from '../types/enums';

export interface CategoryPayload {
  name?: string; // required on create (enforced by the form); optional for partial updates
  customFields?: CategoryCustomField[];
  status?: EntityStatus;
}

export const categoriesService = {
  list: () =>
    apiClient.get<{ categories: AssetCategory[] }>('/categories').then((r) => r.data.categories),

  create: (data: CategoryPayload) =>
    apiClient.post<{ category: AssetCategory }>('/categories', data).then((r) => r.data.category),

  update: (id: string, data: CategoryPayload) =>
    apiClient.patch<{ category: AssetCategory }>(`/categories/${id}`, data).then((r) => r.data.category),

  deactivate: (id: string) =>
    apiClient.delete<{ category: AssetCategory }>(`/categories/${id}`).then((r) => r.data.category),
};
