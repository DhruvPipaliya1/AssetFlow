import { z } from 'zod';

// ADMIN is intentionally excluded — the super-admin role is locked (always full
// access) and cannot be edited via the matrix.
export const roleParam = z.object({
  role: z.enum(['ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']),
});

export const updateRoleSchema = z.object({
  permissions: z.array(z.string()),
});

export type RoleParam = z.infer<typeof roleParam>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
