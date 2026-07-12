import { z } from 'zod';

// Create an audit cycle scoped to a department or a location, over a date range.
export const createCycleSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    scopeType: z.enum(['DEPARTMENT', 'LOCATION']),
    scopeValue: z.string().min(1, 'Scope value is required'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export const assignAuditorsSchema = z.object({
  auditorUserIds: z.array(z.string().min(1)).min(1, 'At least one auditor'),
});

// Mark an item during the audit.
export const auditItemSchema = z.object({
  status: z.enum(['VERIFIED', 'MISSING', 'DAMAGED']),
  notes: z.string().min(1).optional(),
});

export const listCyclesSchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'CLOSED']).optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type AssignAuditorsInput = z.infer<typeof assignAuditorsSchema>;
export type AuditItemInput = z.infer<typeof auditItemSchema>;
export type ListCyclesQuery = z.infer<typeof listCyclesSchema>;
