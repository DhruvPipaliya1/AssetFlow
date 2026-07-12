import { z } from 'zod';

// ?format=csv streams a downloadable file; otherwise JSON rows.
export const reportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional(),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
