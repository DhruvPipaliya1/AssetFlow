import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { bookingsService, type Actor } from './bookings.service.js';

const actorOf = (u: { id: string; role: Actor['role']; departmentId?: string | null }): Actor => ({
  id: u.id,
  role: u.role,
  departmentId: u.departmentId ?? null,
});

export const bookingsController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json(await bookingsService.list(req.query, actorOf(req.user)));
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ booking: await bookingsService.get(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ booking: await bookingsService.create(req.body, actorOf(req.user)) });
  }),

  cancel: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ booking: await bookingsService.cancel(req.params.id, actorOf(req.user)) });
  }),

  reschedule: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ booking: await bookingsService.reschedule(req.params.id, req.body, actorOf(req.user)) });
  }),

  // GET /api/assets/:id/bookings — calendar feed for one resource.
  assetFeed: asyncHandler(async (req, res) => {
    res.json({ bookings: await bookingsService.assetFeed(req.params.id) });
  }),
};
