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
