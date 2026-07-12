import { z } from 'zod';

// Allocate an asset to a person (and optionally on behalf of a department).
// allocatedToUserId becomes the asset's currentHolder.
export const createAllocationSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  allocatedToUserId: z.string().min(1, 'Recipient is required'),
  allocatedToDepartmentId: z.string().min(1).optional(),
  expectedReturnDate: z.coerce.date().optional(),
});

// Return / check-in — captures condition + notes when the asset comes back.
export const returnAllocationSchema = z.object({
  returnCondition: z.string().min(1).optional(),
  checkInNotes: z.string().min(1).optional(),
});

export const listAllocationsSchema = z.object({
  assetId: z.string().optional(),
  allocatedToUserId: z.string().optional(),
  status: z.enum(['ACTIVE', 'RETURNED', 'OVERDUE']).optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type ReturnAllocationInput = z.infer<typeof returnAllocationSchema>;
export type ListAllocationsQuery = z.infer<typeof listAllocationsSchema>;
