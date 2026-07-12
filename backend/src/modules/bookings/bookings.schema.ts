import { z } from 'zod';

// A booking reserves a bookable asset for a half-open time window [start, end).
export const createBookingSchema = z
  .object({
    assetId: z.string().min(1, 'Asset is required'),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    onBehalfOfDepartmentId: z.string().min(1).optional(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export const rescheduleBookingSchema = z
  .object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export const listBookingsSchema = z.object({
  assetId: z.string().optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  mine: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsSchema>;
