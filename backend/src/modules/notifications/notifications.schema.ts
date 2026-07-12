import { z } from 'zod';

export const listNotificationsSchema = z.object({
  isRead: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
