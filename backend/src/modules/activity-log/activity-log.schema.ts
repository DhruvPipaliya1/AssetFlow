import { z } from 'zod';

// The audit-trail feed is filterable so you can scope to one entity's history.
export const listActivitySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actorUserId: z.string().optional(),
  action: z.string().optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type ListActivityQuery = z.infer<typeof listActivitySchema>;
