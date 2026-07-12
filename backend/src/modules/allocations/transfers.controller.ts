import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { transfersService } from './transfers.service.js';
import type { Actor } from './scope.js';

const actorOf = (u: { id: string; role: Actor['role']; departmentId?: string | null }): Actor => ({
  id: u.id,
  role: u.role,
  departmentId: u.departmentId ?? null,
});

export const transfersController = {
  list: asyncHandler(async (req, res) => {
    res.json(await transfersService.list(req.query));
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ transfer: await transfersService.get(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ transfer: await transfersService.create(req.body, actorOf(req.user)) });
  }),

  decide: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ transfer: await transfersService.decide(req.params.id, req.body, actorOf(req.user)) });
  }),
};
