import { z } from 'zod';

// Raise a maintenance request. Asset is NOT touched here — it flips to
// UNDER_MAINTENANCE only on APPROVE (Golden Invariant #4).
export const createMaintenanceSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  photoUrl: z.string().url().optional(),
});

// Approve (asset → UNDER_MAINTENANCE) or reject (asset untouched). A technician
// may be assigned at approval time.
export const decideMaintenanceSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  technicianUserId: z.string().min(1).optional(),
});

// Work progress: TECH_ASSIGNED → IN_PROGRESS → RESOLVED (asset → AVAILABLE).
export const statusMaintenanceSchema = z.object({
  status: z.enum(['TECH_ASSIGNED', 'IN_PROGRESS', 'RESOLVED']),
  technicianUserId: z.string().min(1).optional(),
});

export const listMaintenanceSchema = z.object({
  assetId: z.string().optional(),
  status: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'TECH_ASSIGNED', 'IN_PROGRESS', 'RESOLVED'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  mine: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type DecideMaintenanceInput = z.infer<typeof decideMaintenanceSchema>;
export type StatusMaintenanceInput = z.infer<typeof statusMaintenanceSchema>;
export type ListMaintenanceQuery = z.infer<typeof listMaintenanceSchema>;
