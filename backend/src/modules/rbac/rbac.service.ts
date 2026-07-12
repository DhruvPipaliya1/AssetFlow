import type { Role } from '@prisma/client';
import { PERMISSION_META, ROLES } from '../../lib/permissions.js';
import { permissionMatrix, setRolePermissions } from '../../lib/rbac.js';
import { logActivity } from '../../middleware/activityLog.js';

export const rbacService = {
  // The full matrix payload the Access Control page renders.
  matrix() {
    return {
      roles: ROLES,
      permissions: PERMISSION_META, // [{ key, label, description, category, locked }]
      grants: permissionMatrix(), // { [role]: string[] }
    };
  },

  // Replace a role's editable grants (locked/governance perms are ignored by the
  // store). ADMIN is rejected upstream by the route's param schema.
  async setRole(role: Role, permissions: string[], actorUserId: string) {
    await setRolePermissions(role, permissions);
    await logActivity({
      actorUserId,
      action: 'RolePermissionsUpdated',
      entityType: 'Role',
      entityId: role,
      metadata: { permissions },
    });
    return this.matrix();
  },
};
