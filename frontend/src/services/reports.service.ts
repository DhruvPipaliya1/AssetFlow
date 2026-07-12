import { apiClient } from '../services/apiClient';
import type { ReportsFilters } from '../types/reports';

const BASE = '/reports';

export const reportsApi = {
  /** GET /api/reports/utilization?format=json|csv */
  utilization: (filters: ReportsFilters = {}) =>
    apiClient.get(`${BASE}/utilization`, { params: filters }),

  /** GET /api/reports/maintenance-frequency?format=json|csv */
  maintenanceFrequency: (filters: ReportsFilters = {}) =>
    apiClient.get(`${BASE}/maintenance-frequency`, { params: filters }),

  /** GET /api/reports/department-summary?format=json|csv */
  departmentSummary: (filters: ReportsFilters = {}) =>
    apiClient.get(`${BASE}/department-summary`, { params: filters }),

  /** GET /api/reports/booking-heatmap?format=json|csv */
  bookingHeatmap: (filters: ReportsFilters = {}) =>
    apiClient.get(`${BASE}/booking-heatmap`, { params: filters }),

  /** Download CSV exports */
  downloadUtilizationCsv: (filters: Omit<ReportsFilters, 'format'> = {}) =>
    apiClient.get(`${BASE}/utilization`, {
      params: { ...filters, format: 'csv' },
      responseType: 'blob',
    }),

  downloadMaintenanceFrequencyCsv: (filters: Omit<ReportsFilters, 'format'> = {}) =>
    apiClient.get(`${BASE}/maintenance-frequency`, {
      params: { ...filters, format: 'csv' },
      responseType: 'blob',
    }),

  downloadDepartmentSummaryCsv: (filters: Omit<ReportsFilters, 'format'> = {}) =>
    apiClient.get(`${BASE}/department-summary`, {
      params: { ...filters, format: 'csv' },
      responseType: 'blob',
    }),

  downloadBookingHeatmapCsv: (filters: Omit<ReportsFilters, 'format'> = {}) =>
    apiClient.get(`${BASE}/booking-heatmap`, {
      params: { ...filters, format: 'csv' },
      responseType: 'blob',
    }),
};