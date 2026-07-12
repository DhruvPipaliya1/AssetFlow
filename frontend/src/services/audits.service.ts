import { apiClient } from './apiClient';
import type { AuditCycle, AuditItem, Paginated } from '../types/models';
import type { AuditCycleStatus, AuditItemStatus } from '../types/enums';

export interface CreateCyclePayload {
  name: string;
  scopeType: 'DEPARTMENT' | 'LOCATION';
  scopeValue: string;
  startDate: string;
  endDate: string;
}

export interface CloseCycleResult {
  cycle: AuditCycle;
  discrepancies: AuditItem[];
  lostAssetTags: string[];
}

export const auditsService = {
  listCycles: (status?: AuditCycleStatus) =>
    apiClient.get<Paginated<AuditCycle>>('/audit-cycles', { params: { status } }).then((r) => r.data),

  getCycle: (id: string) =>
    apiClient.get<{ cycle: AuditCycle }>(`/audit-cycles/${id}`).then((r) => r.data.cycle),

  createCycle: (data: CreateCyclePayload) =>
    apiClient.post<{ cycle: AuditCycle }>('/audit-cycles', data).then((r) => r.data.cycle),

  assignAuditors: (id: string, auditorUserIds: string[]) =>
    apiClient.post<{ cycle: AuditCycle }>(`/audit-cycles/${id}/auditors`, { auditorUserIds }).then((r) => r.data.cycle),

  start: (id: string) =>
    apiClient.post<{ cycle: AuditCycle }>(`/audit-cycles/${id}/start`).then((r) => r.data.cycle),

  items: (id: string) =>
    apiClient.get<{ items: AuditItem[] }>(`/audit-cycles/${id}/items`).then((r) => r.data.items),

  discrepancies: (id: string) =>
    apiClient.get<{ discrepancies: AuditItem[] }>(`/audit-cycles/${id}/discrepancies`).then((r) => r.data.discrepancies),

  close: (id: string) => apiClient.post<CloseCycleResult>(`/audit-cycles/${id}/close`).then((r) => r.data),

  markItem: (itemId: string, status: AuditItemStatus, notes?: string) =>
    apiClient.patch<{ item: AuditItem }>(`/audit-items/${itemId}`, { status, notes }).then((r) => r.data.item),
};
