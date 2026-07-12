import type { Role } from '@prisma/client';
import { forbidden } from '../../lib/errors.js';

export interface Actor {
  id: string;
  role: Role;
  departmentId: string | null;
}

// Dept-scope gate for allocate / transfer-approve (RBAC matrix §8): ADMIN and
// ASSET_MANAGER act org-wide; DEPARTMENT_HEAD is confined to their own dept.
// (requireScope middleware only bypasses ADMIN, so scoped-but-unscoped-for-mgr
// capabilities are enforced here in the service instead.)
export function assertDeptScope(actor: Actor, resourceDeptId: string | null | undefined): void {
  if (actor.role === 'ADMIN' || actor.role === 'ASSET_MANAGER') return;
  if (actor.role === 'DEPARTMENT_HEAD') {
    if (!resourceDeptId || resourceDeptId !== actor.departmentId) {
      throw forbidden('Resource is outside your department');
    }
    return;
  }
  throw forbidden('Not permitted');
}
