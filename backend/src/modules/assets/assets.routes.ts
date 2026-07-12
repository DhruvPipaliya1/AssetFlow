import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { idParam } from '../../lib/validation.js';
import { assetsController } from './assets.controller.js';
import { createAssetSchema, updateAssetSchema, listAssetsSchema } from './assets.schema.js';

export const assetsRouter = Router();
assetsRouter.use(authMiddleware);

/**
 * @openapi
 * /assets:
 *   get:
 *     tags: [Assets]
 *     summary: Search & filter the asset directory
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: q, schema: { type: string }, description: Free-text over name/tag/serial }
 *       - { in: query, name: assetTag, schema: { type: string } }
 *       - { in: query, name: serialNumber, schema: { type: string } }
 *       - { in: query, name: categoryId, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [AVAILABLE, ALLOCATED, RESERVED, UNDER_MAINTENANCE, LOST, RETIRED, DISPOSED] } }
 *       - { in: query, name: ownerDepartmentId, schema: { type: string } }
 *       - { in: query, name: location, schema: { type: string } }
 *       - { in: query, name: isBookable, schema: { type: string, enum: [true, false] } }
 *       - { in: query, name: page, schema: { type: string } }
 *       - { in: query, name: take, schema: { type: string } }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Assets]
 *     summary: Register an asset (auto AF-#### tag + QR) — Asset Manager
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId]
 *             properties:
 *               name: { type: string, example: MacBook Pro 16" }
 *               categoryId: { type: string }
 *               serialNumber: { type: string, example: C02X1234JGH7 }
 *               acquisitionDate: { type: string, format: date }
 *               acquisitionCost: { type: number, example: 2499 }
 *               condition: { type: string, example: New }
 *               location: { type: string, example: HQ / Floor 3 }
 *               isBookable: { type: boolean }
 *               photoUrl: { type: string, format: uri }
 *               ownerDepartmentId: { type: string }
 *     responses: { 201: { description: Registered (returns assetTag + qrDataUrl) }, 403: { description: Forbidden } }
 */
assetsRouter.get('/', validate(listAssetsSchema, 'query'), assetsController.list);
assetsRouter.post(
  '/',
  requirePermission(PERMISSION.ASSET_REGISTER),
  validate(createAssetSchema),
  assetsController.create,
);

/**
 * @openapi
 * /assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Asset detail + derived history (allocations, transfers, maintenance)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   patch:
 *     tags: [Assets]
 *     summary: Edit asset metadata (not status) — Asset Manager
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 403: { description: Forbidden }, 404: { description: Not found } }
 */
assetsRouter.get('/:id', validate(idParam, 'params'), assetsController.get);
assetsRouter.patch(
  '/:id',
  requirePermission(PERMISSION.ASSET_REGISTER),
  validate(idParam, 'params'),
  validate(updateAssetSchema),
  assetsController.update,
);

/**
 * @openapi
 * /assets/{id}/qr:
 *   get:
 *     tags: [Assets]
 *     summary: Asset QR label as a PNG image
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: PNG image, content: { image/png: {} } }
 *       404: { description: Not found }
 */
assetsRouter.get('/:id/qr', validate(idParam, 'params'), assetsController.qr);
