import { z } from 'zod';

// Request to move a currently-held asset to another user. fromUser is derived
// server-side from the asset's active allocation (never trusted from the body).
export const createTransferSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  toUserId: z.string().min(1, 'Recipient is required'),
  expectedReturnDate: z.coerce.date().optional(),
});

// Approve/reject a pending transfer request.
export const decideTransferSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
});

export const listTransfersSchema = z.object({
  assetId: z.string().optional(),
  status: z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED']).optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type DecideTransferInput = z.infer<typeof decideTransferSchema>;
export type ListTransfersQuery = z.infer<typeof listTransfersSchema>;
