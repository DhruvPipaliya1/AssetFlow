import { z } from 'zod';
import { entityStatusSchema } from '../../../lib/validation.js';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  headUserId: z.string().optional(),
  parentDepartmentId: z.string().optional(),
  status: entityStatusSchema.optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const listDepartmentsSchema = z.object({
  status: entityStatusSchema.optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsSchema>;
