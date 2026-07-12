import type {
  Role,
  EntityStatus,
  AssetStatus,
  AllocationStatus,
  TransferStatus,
  BookingStatus,
  MaintenanceStatus,
  AuditCycleStatus,
  AuditItemStatus,
  Priority,
} from './enums';

// DTOs mirrored from the backend responses. Extend as modules land.
export interface UserPreferences {
  theme?: 'light' | 'dark';
  landingPath?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: EntityStatus;
  departmentId: string | null;
  avatarUrl?: string | null;
  preferences?: UserPreferences | null;
  permissions?: string[]; // effective permissions from the live RBAC matrix
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

// ── Assets ──
export interface AssetDocument {
  name: string;
  url: string;
}

export type CustomFieldValue = string | number | boolean | null;

export interface Asset {
  id: string;
  name: string;
  assetTag: string;
  serialNumber: string | null;
  categoryId: string;
  category?: Ref;
  acquisitionDate: string | null;
  acquisitionCost: string | null; // Prisma Decimal serialized as string
  condition: string | null;
  location: string | null;
  status: AssetStatus;
  isBookable: boolean;
  photoUrl: string | null;
  documents?: AssetDocument[] | null;
  customFieldValues?: Record<string, CustomFieldValue> | null;
  currentHolderUserId: string | null;
  currentHolderUser?: (Ref & { email?: string }) | null;
  ownerDepartmentId: string | null;
  ownerDepartment?: Ref | null;
  createdAt: string;
}

export interface AssetHistoryEntry {
  kind: 'ALLOCATION' | 'TRANSFER' | 'MAINTENANCE';
  id: string;
  at: string;
  status: string;
  summary: string;
  meta: Record<string, unknown>;
}

export interface AssetDetail extends Asset {
  history: AssetHistoryEntry[];
  allocations: Allocation[];
  transfers: Transfer[];
  maintenance: MaintenanceRequest[];
  qrDataUrl?: string;
}

// ── Allocations & Transfers ──
export interface Allocation {
  id: string;
  assetId: string;
  asset?: { id: string; name: string; assetTag: string; status: AssetStatus };
  allocatedToUserId: string | null;
  allocatedToUser?: (Ref & { email?: string }) | null;
  allocatedToDepartmentId: string | null;
  allocatedToDepartment?: Ref | null;
  allocatedByUserId: string;
  allocatedByUser?: Ref | null;
  allocatedAt: string;
  expectedReturnDate: string | null;
  returnedAt: string | null;
  returnCondition: string | null;
  checkInNotes: string | null;
  status: AllocationStatus;
}

export interface Transfer {
  id: string;
  assetId: string;
  asset?: { id: string; name: string; assetTag: string; status: AssetStatus; ownerDepartmentId: string | null };
  fromUserId: string | null;
  fromUser?: Ref | null;
  toUserId: string;
  toUser?: Ref | null;
  requestedByUserId: string;
  requestedByUser?: Ref | null;
  approvedByUserId: string | null;
  approvedByUser?: Ref | null;
  status: TransferStatus;
  decidedAt: string | null;
  createdAt: string;
}

// ── Bookings ──
export interface Booking {
  id: string;
  assetId: string;
  asset?: { id: string; name: string; assetTag: string };
  bookedByUserId: string;
  bookedByUser?: Ref | null;
  onBehalfOfDepartmentId: string | null;
  onBehalfOfDepartment?: Ref | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

// ── Maintenance ──
export interface MaintenanceRequest {
  id: string;
  assetId: string;
  asset?: { id: string; name: string; assetTag: string; status: AssetStatus };
  raisedByUserId: string;
  raisedByUser?: Ref | null;
  description: string;
  priority: Priority;
  photoUrl: string | null;
  status: MaintenanceStatus;
  approvedByUserId: string | null;
  approvedByUser?: Ref | null;
  technicianUserId: string | null;
  technicianUser?: Ref | null;
  createdAt: string;
  resolvedAt: string | null;
}

// ── Audits ──
export interface AuditCycle {
  id: string;
  name: string;
  scopeType: 'DEPARTMENT' | 'LOCATION';
  scopeValue: string;
  startDate: string;
  endDate: string;
  status: AuditCycleStatus;
  createdByUserId: string;
  createdByUser?: Ref | null;
  auditors?: Array<{ id: string; auditorUserId: string; auditorUser?: Ref }>;
  _count?: { items: number };
  createdAt: string;
}

export interface AuditItem {
  id: string;
  auditCycleId: string;
  assetId: string;
  asset?: { id: string; name: string; assetTag: string; status: AssetStatus };
  status: AuditItemStatus;
  auditedByUserId: string | null;
  auditedByUser?: Ref | null;
  notes: string | null;
  auditedAt: string | null;
}

// ── Notifications & Activity log ──
export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  actorUserId: string | null;
  actorUser?: { id: string; name: string; role: Role } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}

// ── Dashboard ──
export interface DashboardKpis {
  totalAssets: number;
  available: number;
  allocated: number;
  underMaintenance: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
  overdueReturns: number;
}

export interface DashboardResponse {
  scope: 'ORG' | 'DEPARTMENT';
  kpis: DashboardKpis;
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  actorName: string | null;
  assetTag: string | null;
  assetName: string | null;
  createdAt: string;
}

// ── Reports ──
export type ReportRow = Record<string, string | number | boolean>;
