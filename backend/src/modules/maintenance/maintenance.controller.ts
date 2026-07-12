import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { maintenanceService, type Actor } from './maintenance.service.js';

const actorOf = (u: { id: string; role: Actor['role']; departmentId?: string | null }): Actor => ({
  id: u.id,
  role: u.role,
  departmentId: u.departmentId ?? null,
});

export const maintenanceController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json(await maintenanceService.list(req.query, actorOf(req.user)));
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ maintenance: await maintenanceService.get(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ maintenance: await maintenanceService.raise(req.body, actorOf(req.user)) });
  }),

  decide: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ maintenance: await maintenanceService.decide(req.params.id, req.body, actorOf(req.user)) });
  }),

  setStatus: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ maintenance: await maintenanceService.setStatus(req.params.id, req.body, actorOf(req.user)) });
  }),
};
