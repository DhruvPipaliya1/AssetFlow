import { z } from 'zod';

// Reusable request-part schemas shared across modules.
export const idParam = z.object({ id: z.string().min(1) });

export const entityStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export const roleSchema = z.enum([
  'ADMIN',
  'ASSET_MANAGER',
  'DEPARTMENT_HEAD',
  'EMPLOYEE',
]);
