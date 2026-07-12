export interface UtilizationDataPoint {
  date: string;
  allocated: number;
  available: number;
  total: number;
  utilizationRate: number;
}

export interface MaintenanceFrequencyDataPoint {
  category: string;
  count: number;
  avgDurationDays: number;
}

export interface DepartmentSummaryDataPoint {
  department: string;
  totalAssets: number;
  allocatedAssets: number;
  availableAssets: number;
  maintenanceAssets: number;
  utilizationRate: number;
}

export interface BookingHeatmapDataPoint {
  date: string;
  hour: number;
  count: number;
}

export interface ReportsFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  categoryId?: string;
  format?: 'json' | 'csv';
}

export interface UtilizationReportResponse {
  data: UtilizationDataPoint[];
  summary: {
    totalAssets: number;
    avgUtilization: number;
    peakUtilization: number;
    peakDate: string;
  };
}

export interface MaintenanceFrequencyReportResponse {
  data: MaintenanceFrequencyDataPoint[];
  summary: {
    totalRequests: number;
    avgDurationDays: number;
    topCategory: string;
  };
}

export interface DepartmentSummaryReportResponse {
  data: DepartmentSummaryDataPoint[];
  summary: {
    totalDepartments: number;
    totalAssets: number;
    overallUtilization: number;
  };
}

export interface BookingHeatmapReportResponse {
  data: BookingHeatmapDataPoint[];
  summary: {
    totalBookings: number;
    peakHour: number;
    peakDay: string;
  };
}