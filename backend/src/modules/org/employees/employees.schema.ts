import { z } from 'zod';
import { entityStatusSchema, roleSchema } from '../../../lib/validation.js';

export const listEmployeesSchema = z.object({
  role: roleSchema.optional(),
  status: entityStatusSchema.optional(),
  departmentId: z.string().optional(),
  q: z.string().optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  departmentId: z.string().nullable().optional(),
  status: entityStatusSchema.optional(),
});

// The ONLY way a role changes (Golden Invariant #1) — Admin-guarded.
export const changeRoleSchema = z.object({ role: roleSchema });

export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
