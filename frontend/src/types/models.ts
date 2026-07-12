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
