import { asyncHandler } from '../../../lib/asyncHandler.js';
import { unauthorized } from '../../../lib/errors.js';
import { departmentsService } from './departments.service.js';

export const departmentsController = {
  list: asyncHandler(async (req, res) => {
    res.json({ departments: await departmentsService.list(req.query) });
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ department: await departmentsService.get(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ department: await departmentsService.create(req.body, req.user.id) });
  }),

  update: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ department: await departmentsService.update(req.params.id, req.body, req.user.id) });
  }),

  remove: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ department: await departmentsService.deactivate(req.params.id, req.user.id) });
  }),
};
