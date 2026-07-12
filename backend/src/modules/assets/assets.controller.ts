import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { assetsService } from './assets.service.js';

export const assetsController = {
  list: asyncHandler(async (req, res) => {
    res.json(await assetsService.list(req.query));
  }),

  get: asyncHandler(async (req, res) => {
    res.json({ asset: await assetsService.get(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.status(201).json({ asset: await assetsService.create(req.body, req.user.id) });
  }),

  update: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ asset: await assetsService.update(req.params.id, req.body, req.user.id) });
  }),

  // Returns the QR label as a PNG image (not JSON).
  qr: asyncHandler(async (req, res) => {
    const png = await assetsService.qrImage(req.params.id);
    res.type('png').send(png);
  }),
};
