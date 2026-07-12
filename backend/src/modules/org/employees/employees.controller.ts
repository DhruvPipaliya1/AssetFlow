import { asyncHandler } from '../../../lib/asyncHandler.js';
import { unauthorized } from '../../../lib/errors.js';
import { employeesService } from './employees.service.js';

export const employeesController = {
  list: asyncHandler(async (req, res) => {
    res.json(await employeesService.list(req.query));
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ employee: await employeesService.get(req.params.id) });
  }),

  update: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ employee: await employeesService.update(req.params.id, req.body, req.user.id) });
  }),

  changeRole: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ employee: await employeesService.changeRole(req.params.id, req.body, req.user.id) });
  }),
};
