import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { allocationsService } from './allocations.service.js';
import type { Actor } from './scope.js';

const actorOf = (u: { id: string; role: Actor['role']; departmentId?: string | null }): Actor => ({
  id: u.id,
  role: u.role,
  departmentId: u.departmentId ?? null,
});

export const allocationsController = {
  list: asyncHandler(async (req, res) => {
    res.json(await allocationsService.list(req.query));
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ allocation: await allocationsService.get(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ allocation: await allocationsService.allocate(req.body, actorOf(req.user)) });
  }),

  return: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ allocation: await allocationsService.return(req.params.id, req.body, actorOf(req.user)) });
  }),
};
