import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { notificationsService } from './notifications.service.js';

export const notificationsController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json(await notificationsService.list(req.user.id, req.query));
  }),

  markRead: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ notification: await notificationsService.markRead(req.params.id, req.user.id) });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json(await notificationsService.markAllRead(req.user.id));
  }),
};
