import type { Role } from '@prisma/client';

// Roles -> named permissions. Guard routes by PERMISSION, never by raw role
// strings. See docs/ARCHITECTURE.md §8.1. The *live* role→permission mapping is
// stored in the DB (RolePermission) and served from lib/rbac.ts so an Admin can
// edit it at runtime. The map below is only the seed default + fallback.
export const PERMISSION = {
  ORG_MANAGE: 'org:manage', // departments, categories
  ROLE_ASSIGN: 'role:assign', // promote employees — Admin only
  RBAC_MANAGE: 'rbac:manage', // edit the permission matrix — Admin only
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

export const ALL_PERMISSIONS: Permission[] = Object.values(P);

export const ROLES: Role[] = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'];

// Governance permissions are structurally ADMIN-only and CANNOT be granted to
// other roles or revoked from ADMIN via the matrix — this prevents an Admin from
// locking themselves (or the org) out of role/permission management.
export const LOCKED_PERMISSIONS: ReadonlySet<string> = new Set<string>([
  P.ORG_MANAGE,
  P.ROLE_ASSIGN,
  P.RBAC_MANAGE,
]);

// UI metadata for the permission matrix (label, description, grouping).
export interface PermissionMeta {
  key: Permission;
  label: string;
  description: string;
  category: string;
  locked: boolean;
}

const meta = (key: Permission, label: string, description: string, category: string): PermissionMeta => ({
  key,
  label,
  description,
  category,
  locked: LOCKED_PERMISSIONS.has(key),
});

export const PERMISSION_META: PermissionMeta[] = [
  meta(P.ORG_MANAGE, 'Manage organization', 'Create/edit departments & categories', 'Governance'),
  meta(P.ROLE_ASSIGN, 'Assign roles', 'Promote employees to Manager / Dept Head', 'Governance'),
  meta(P.RBAC_MANAGE, 'Manage permissions', 'Edit this permission matrix', 'Governance'),
  meta(P.ASSET_REGISTER, 'Register assets', 'Add & edit assets in the directory', 'Assets'),
  meta(P.ASSET_ALLOCATE, 'Allocate assets', 'Allocate/return assets to holders', 'Assets'),
  meta(P.TRANSFER_APPROVE, 'Approve transfers', 'Approve or reject transfer requests', 'Assets'),
  meta(P.RETURN_APPROVE, 'Approve returns', 'Approve returns & condition check-in', 'Assets'),
  meta(P.MAINTENANCE_RAISE, 'Raise maintenance', 'Open maintenance requests', 'Maintenance'),
  meta(P.MAINTENANCE_APPROVE, 'Approve maintenance', 'Approve/assign/resolve maintenance', 'Maintenance'),
  meta(P.BOOKING_CREATE, 'Book resources', 'Create bookings for shared resources', 'Bookings'),
  meta(P.AUDIT_MANAGE, 'Manage audits', 'Create, run & close audit cycles', 'Audits'),
  meta(P.AUDIT_PERFORM, 'Perform audits', 'Mark audit items when assigned', 'Audits'),
  meta(P.ANALYTICS_VIEW, 'View analytics', 'Dashboard & reports (dept-scoped)', 'Analytics'),
  meta(P.ANALYTICS_VIEW_ALL, 'View all analytics', 'Org-wide dashboard & reports', 'Analytics'),
];

// Seed default (also the fallback if the DB matrix is empty). ADMIN is the
// super-admin — always full access, not stored/editable.
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [...ALL_PERMISSIONS],
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
  DEPARTMENT_HEAD: [
    P.ASSET_ALLOCATE,
    P.TRANSFER_APPROVE,
    P.BOOKING_CREATE,
    P.MAINTENANCE_RAISE,
    P.AUDIT_PERFORM,
    P.ANALYTICS_VIEW,
  ],
  EMPLOYEE: [P.MAINTENANCE_RAISE, P.BOOKING_CREATE, P.AUDIT_PERFORM],
};
