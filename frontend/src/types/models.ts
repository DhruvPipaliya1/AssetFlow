import type { Role, EntityStatus } from './enums';

// DTOs mirrored from the backend responses. Extend as modules land.
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: EntityStatus;
  departmentId: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  take: number;
  pages: number;
}

// ── Organization ──
interface Ref {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  status: EntityStatus;
  headUserId: string | null;
  parentDepartmentId: string | null;
  headUser?: Ref | null;
  parentDepartment?: Ref | null;
  _count?: { members: number; ownedAssets: number };
  createdAt: string;
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'boolean';
export interface CategoryCustomField {
  key: string;
  label: string;
  type: CustomFieldType;
}

export interface AssetCategory {
  id: string;
  name: string;
  status: EntityStatus;
  customFields: CategoryCustomField[] | null;
  _count?: { assets: number };
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: EntityStatus;
  departmentId: string | null;
  department?: Ref | null;
  createdAt: string;
}

// ── Reports ──
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
