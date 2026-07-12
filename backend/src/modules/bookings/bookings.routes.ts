import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { idParam } from '../../lib/validation.js';
import { bookingsController } from './bookings.controller.js';
import {
  createBookingSchema,
  rescheduleBookingSchema,
  listBookingsSchema,
} from './bookings.schema.js';

export const bookingsRouter = Router();
bookingsRouter.use(authMiddleware);

/**
 * @openapi
 * /bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings (filter by asset, status, mine)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Bookings]
 *     summary: Book a resource (rejects overlap → 409, half-open intervals)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId, startTime, endTime]
 *             properties:
 *               assetId: { type: string }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               onBehalfOfDepartmentId: { type: string }
 *     responses:
 *       201: { description: Booked }
 *       400: { description: Not bookable / bad range }
 *       409: { description: Overlaps an existing booking }
 */
bookingsRouter.get('/', validate(listBookingsSchema, 'query'), bookingsController.list);
bookingsRouter.post(
  '/',
  requirePermission(PERMISSION.BOOKING_CREATE),
  validate(createBookingSchema),
  bookingsController.create,
);

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get a booking
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 */
bookingsRouter.get('/:id', validate(idParam, 'params'), bookingsController.get);

/**
 * @openapi
 * /bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking (booker / Asset Mgr / Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Cancelled }, 403: { description: Forbidden }, 409: { description: Illegal transition } }
 */
bookingsRouter.patch('/:id/cancel', validate(idParam, 'params'), bookingsController.cancel);

/**
 * @openapi
 * /bookings/{id}/reschedule:
 *   patch:
 *     tags: [Bookings]
 *     summary: Reschedule a booking (re-checks overlap)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime]
 *             properties:
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *     responses: { 200: { description: Rescheduled }, 409: { description: Overlaps } }
 */
bookingsRouter.patch(
  '/:id/reschedule',
  validate(idParam, 'params'),
  validate(rescheduleBookingSchema),
  bookingsController.reschedule,
);

// Asset-scoped calendar feed — mounted at /api/assets so the path is
// GET /api/assets/:id/bookings (§B6). Kept in the bookings module so booking
// logic stays out of the assets module.
export const assetBookingsRouter = Router();
assetBookingsRouter.use(authMiddleware);

/**
 * @openapi
 * /assets/{id}/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Calendar feed of a resource's bookings
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK } }
 */
assetBookingsRouter.get('/:id/bookings', validate(idParam, 'params'), bookingsController.assetFeed);
