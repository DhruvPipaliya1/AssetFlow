import { asyncHandler } from '../../../lib/asyncHandler.js';
import { unauthorized } from '../../../lib/errors.js';
import { categoriesService } from './categories.service.js';

export const categoriesController = {
  list: asyncHandler(async (req, res) => {
    res.json({ categories: await categoriesService.list(req.query) });
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ category: await categoriesService.get(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ category: await categoriesService.create(req.body, req.user.id) });
  }),

  update: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ category: await categoriesService.update(req.params.id, req.body, req.user.id) });
  }),

  remove: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ category: await categoriesService.deactivate(req.params.id, req.user.id) });
  }),
};
