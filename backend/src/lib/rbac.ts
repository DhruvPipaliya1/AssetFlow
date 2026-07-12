import type { Role } from '@prisma/client';
import { prisma } from './prisma.js';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  LOCKED_PERMISSIONS,
  ROLES,
  type Permission,
} from './permissions.js';

// In-process cache of the editable role→permission grants (non-locked perms for
// non-admin roles). Refreshed at startup and after every matrix edit. Single
// process, so a plain Map is sufficient (no Kafka/Redis — Future Enhancement).
let cache = new Map<Role, Set<string>>();

/** Load the matrix from the DB into the cache. Call at startup + after edits. */
export async function loadPermissions(): Promise<void> {
  const rows = await prisma.rolePermission.findMany();
  const next = new Map<Role, Set<string>>();
  for (const r of ROLES) next.set(r, new Set<string>());
  for (const row of rows) next.get(row.role as Role)?.add(row.permission);
  cache = next;
}

/** Seed the matrix from the static defaults the first time (empty table). */
export async function ensureSeeded(): Promise<void> {
  const count = await prisma.rolePermission.count();
  if (count > 0) return;
  const data: { role: Role; permission: string }[] = [];
  for (const role of ROLES) {
    for (const permission of DEFAULT_ROLE_PERMISSIONS[role]) {
      if (role === 'ADMIN') continue; // ADMIN is implicit (super-admin)
      if (LOCKED_PERMISSIONS.has(permission)) continue; // locked perms are implicit
      data.push({ role, permission });
    }
  }
  await prisma.rolePermission.createMany({ data, skipDuplicates: true });
}

// ADMIN is the super-admin: always full access. Locked (governance) permissions
// are ADMIN-only regardless of the matrix. Everything else comes from the cache.
export function hasPermission(role: Role, perm: Permission | string): boolean {
  if (role === 'ADMIN') return true;
  if (LOCKED_PERMISSIONS.has(perm)) return false;
  return cache.get(role)?.has(perm) ?? false;
}

/** The effective permission list for a role (what the client's `can()` uses). */
export function effectivePermissions(role: Role): string[] {
  return ALL_PERMISSIONS.filter((p) => hasPermission(role, p));
}

/** The full grid: role → effective permissions. */
export function permissionMatrix(): Record<string, string[]> {
  const grants: Record<string, string[]> = {};
  for (const r of ROLES) grants[r] = effectivePermissions(r);
  return grants;
}

/** Replace a (non-admin) role's editable grants. Locked perms are ignored. */
export async function setRolePermissions(role: Role, permissions: string[]): Promise<void> {
  const clean = permissions.filter(
    (p) => (ALL_PERMISSIONS as string[]).includes(p) && !LOCKED_PERMISSIONS.has(p),
  );
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { role } }),
    prisma.rolePermission.createMany({
      data: clean.map((permission) => ({ role, permission })),
      skipDuplicates: true,
    }),
  ]);
  await loadPermissions();
}
