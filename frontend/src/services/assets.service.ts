import { apiClient } from './apiClient';
import type { Asset, AssetDetail, AssetDocument, CustomFieldValue, Paginated } from '../types/models';
import type { AssetStatus } from '../types/enums';

export interface AssetFilters {
  q?: string;
  assetTag?: string;
  serialNumber?: string;
  categoryId?: string;
  status?: AssetStatus;
  ownerDepartmentId?: string;
  location?: string;
  isBookable?: 'true' | 'false';
  page?: number;
  take?: number;
}

export interface AssetPayload {
  name?: string;
  categoryId?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  condition?: string;
  location?: string;
  isBookable?: boolean;
  photoUrl?: string;
  documents?: AssetDocument[];
  customFieldValues?: Record<string, CustomFieldValue>;
  ownerDepartmentId?: string;
}

export const assetsService = {
  list: (filters: AssetFilters = {}) =>
    apiClient.get<Paginated<Asset>>('/assets', { params: filters }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<{ asset: AssetDetail }>(`/assets/${id}`).then((r) => r.data.asset),

  create: (data: AssetPayload) =>
    apiClient.post<{ asset: AssetDetail }>('/assets', data).then((r) => r.data.asset),

  update: (id: string, data: AssetPayload) =>
    apiClient.patch<{ asset: Asset }>(`/assets/${id}`, data).then((r) => r.data.asset),

  // QR endpoint is auth-guarded, so fetch it as a blob (bearer header attached)
  // and hand back an object URL for an <img src>.
  qrObjectUrl: (id: string) =>
    apiClient.get(`/assets/${id}/qr`, { responseType: 'blob' }).then((r) => URL.createObjectURL(r.data as Blob)),
};
