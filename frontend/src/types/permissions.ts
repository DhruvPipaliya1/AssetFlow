import { Role } from './enums';

// Mirror of backend src/lib/permissions.ts. The *live* grants come from the
// server (user.permissions on /auth/me + login), reflecting the editable RBAC
// matrix. This static map is only a fallback when permissions aren't loaded yet.
export const PERMISSION = {
  ORG_MANAGE: 'org:manage',
  ROLE_ASSIGN: 'role:assign',
  RBAC_MANAGE: 'rbac:manage',
  ASSET_REGISTER: 'asset:register',
  ASSET_ALLOCATE: 'asset:allocate',
  TRANSFER_APPROVE: 'transfer:approve',
  RETURN_APPROVE: 'return:approve',
  MAINTENANCE_RAISE: 'maintenance:raise',
  MAINTENANCE_APPROVE: 'maintenance:approve',
  BOOKING_CREATE: 'booking:create',
  AUDIT_MANAGE: 'audit:manage',
  AUDIT_PERFORM: 'audit:perform',
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_VIEW_ALL: 'analytics:viewAll',
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

const P = PERMISSION;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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

// Static fallback (role → default perms).
export const hasPermission = (role: Role, perm: Permission): boolean =>
  ROLE_PERMISSIONS[role]?.includes(perm) ?? false;

// Prefer the server-provided effective permissions; fall back to the static map.
export const userCan = (
  user: { role: Role; permissions?: string[] } | null | undefined,
  perm: Permission,
): boolean => {
  if (!user) return false;
  if (user.permissions) return user.permissions.includes(perm);
  return hasPermission(user.role, perm);
};
