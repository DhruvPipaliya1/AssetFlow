import { apiClient } from './apiClient';
import type { ReportRow } from '../types/models';

export type ReportName =
  | 'utilization'
  | 'maintenance-frequency'
  | 'maintenance-by-category'
  | 'department-summary'
  | 'booking-heatmap'
  | 'lifecycle-alerts';

export const reportsService = {
  rows: (name: ReportName) =>
    apiClient.get<{ report: string; rows: ReportRow[] }>(`/reports/${name}`).then((r) => r.data.rows),

  // Fetch the CSV as a blob and trigger a browser download.
  async downloadCsv(name: ReportName) {
    const res = await apiClient.get(`/reports/${name}`, { params: { format: 'csv' }, responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
