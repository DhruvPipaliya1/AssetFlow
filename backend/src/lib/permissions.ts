import type { Role } from '@prisma/client';

// Roles -> named permissions. Guard routes by PERMISSION, never by raw role
// strings. See docs/ARCHITECTURE.md §8.1. The frontend mirrors this map for
// show/hide (UX only — the server is the real gate).
export const PERMISSION = {
  ORG_MANAGE: 'org:manage', // departments, categories
  ROLE_ASSIGN: 'role:assign', // promote employees — Admin only
  ASSET_REGISTER: 'asset:register',
  ASSET_ALLOCATE: 'asset:allocate',
  TRANSFER_APPROVE: 'transfer:approve',
  RETURN_APPROVE: 'return:approve',
  MAINTENANCE_RAISE: 'maintenance:raise',
  MAINTENANCE_APPROVE: 'maintenance:approve',
  BOOKING_CREATE: 'booking:create',
  AUDIT_MANAGE: 'audit:manage', // create/close cycles
  AUDIT_PERFORM: 'audit:perform',
  ANALYTICS_VIEW: 'analytics:view', // dashboard/reports access (dept-scoped or all)
  ANALYTICS_VIEW_ALL: 'analytics:viewAll', // org-wide scope
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

const P = PERMISSION;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Admin is superuser across the matrix (§8) — grant everything.
  ADMIN: Object.values(P),
  ASSET_MANAGER: [
    P.ASSET_REGISTER,
    P.ASSET_ALLOCATE,
    P.TRANSFER_APPROVE,
    P.RETURN_APPROVE,
    P.MAINTENANCE_RAISE,
    P.MAINTENANCE_APPROVE,
    P.BOOKING_CREATE,
    P.AUDIT_PERFORM,
    P.ANALYTICS_VIEW,
    P.ANALYTICS_VIEW_ALL,
  ],
  // Department Head: scoped to their department via requireScope. Analytics are
  // dept-scoped (ANALYTICS_VIEW without _ALL).
  DEPARTMENT_HEAD: [
    P.ASSET_ALLOCATE,
    P.TRANSFER_APPROVE,
    P.BOOKING_CREATE,
    P.MAINTENANCE_RAISE,
    P.AUDIT_PERFORM,
    P.ANALYTICS_VIEW,
  ],
  // Employee: scoped to their own resources via requireScope. AUDIT_PERFORM is
  // granted because the RBAC matrix (§8) lets any role audit *when assigned* —
  // the "assigned auditors only" service check is the real scope gate.
  EMPLOYEE: [P.MAINTENANCE_RAISE, P.BOOKING_CREATE, P.AUDIT_PERFORM],
};

export const hasPermission = (role: Role, perm: Permission): boolean =>
  ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
