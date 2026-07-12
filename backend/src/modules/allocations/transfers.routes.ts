import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { idParam } from '../../lib/validation.js';
import { transfersController } from './transfers.controller.js';
import { createTransferSchema, decideTransferSchema, listTransfersSchema } from './transfers.schema.js';

export const transfersRouter = Router();
transfersRouter.use(authMiddleware);

/**
 * @openapi
 * /transfers:
 *   get:
 *     tags: [Transfers]
 *     summary: List transfer requests (filter by asset, status)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Transfers]
 *     summary: Request transfer of a held asset (fromUser derived server-side)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId, toUserId]
 *             properties:
 *               assetId: { type: string }
 *               toUserId: { type: string }
 *     responses: { 201: { description: Requested }, 400: { description: Asset not held } }
 */
transfersRouter.get('/', validate(listTransfersSchema, 'query'), transfersController.list);
transfersRouter.post('/', validate(createTransferSchema), transfersController.create);

/**
 * @openapi
 * /transfers/{id}:
 *   get:
 *     tags: [Transfers]
 *     summary: Get a transfer request
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 */
transfersRouter.get('/:id', validate(idParam, 'params'), transfersController.get);

/**
 * @openapi
 * /transfers/{id}/decision:
 *   patch:
 *     tags: [Transfers]
 *     summary: Approve or reject a transfer (Asset Mgr any · Dept Head own dept)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [APPROVE, REJECT] }
 *     responses:
 *       200: { description: Decided (on APPROVE re-allocates in one txn) }
 *       403: { description: Outside your department }
 *       409: { description: Already decided / illegal transition }
 */
transfersRouter.patch(
  '/:id/decision',
  requirePermission(PERMISSION.TRANSFER_APPROVE),
  validate(idParam, 'params'),
  validate(decideTransferSchema),
  transfersController.decide,
);
