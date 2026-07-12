import { apiClient } from './apiClient';
import type { Transfer, Paginated } from '../types/models';
import type { TransferStatus } from '../types/enums';

export interface TransferFilters {
  assetId?: string;
  status?: TransferStatus;
  page?: number;
  take?: number;
}

export interface CreateTransferPayload {
  assetId: string;
  toUserId: string;
}

export const transfersService = {
  list: (filters: TransferFilters = {}) =>
    apiClient.get<Paginated<Transfer>>('/transfers', { params: filters }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<{ transfer: Transfer }>(`/transfers/${id}`).then((r) => r.data.transfer),

  create: (data: CreateTransferPayload) =>
    apiClient.post<{ transfer: Transfer }>('/transfers', data).then((r) => r.data.transfer),

  decide: (id: string, decision: 'APPROVE' | 'REJECT') =>
    apiClient.patch<{ transfer: Transfer }>(`/transfers/${id}/decision`, { decision }).then((r) => r.data.transfer),
};
