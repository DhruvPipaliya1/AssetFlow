import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { auditsService, type Actor } from './audits.service.js';

const actorOf = (u: { id: string; role: Actor['role']; departmentId?: string | null }): Actor => ({
  id: u.id,
  role: u.role,
  departmentId: u.departmentId ?? null,
});

export const auditsController = {
  listCycles: asyncHandler(async (req, res) => {
    res.json(await auditsService.listCycles(req.query));
  }),

  getCycle: asyncHandler(async (req, res) => {
    res.json({ cycle: await auditsService.getCycle(req.params.id) });
  }),

  createCycle: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ cycle: await auditsService.createCycle(req.body, actorOf(req.user)) });
  }),

  assignAuditors: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ cycle: await auditsService.assignAuditors(req.params.id, req.body, actorOf(req.user)) });
  }),

  start: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ cycle: await auditsService.start(req.params.id, actorOf(req.user)) });
  }),

  items: asyncHandler(async (req, res) => {
    res.json({ items: await auditsService.items(req.params.id) });
  }),

  discrepancies: asyncHandler(async (req, res) => {
    res.json({ discrepancies: await auditsService.discrepancies(req.params.id) });
  }),

  close: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json(await auditsService.close(req.params.id, actorOf(req.user)));
  }),

  // PATCH /api/audit-items/:id
  markItem: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ item: await auditsService.markItem(req.params.id, req.body, actorOf(req.user)) });
  }),
};
