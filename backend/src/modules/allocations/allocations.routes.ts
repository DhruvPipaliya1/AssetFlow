import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { idParam } from '../../lib/validation.js';
import { allocationsController } from './allocations.controller.js';
import {
  createAllocationSchema,
  returnAllocationSchema,
  listAllocationsSchema,
} from './allocations.schema.js';

export const allocationsRouter = Router();
allocationsRouter.use(authMiddleware);

/**
 * @openapi
 * /allocations:
 *   get:
 *     tags: [Allocations]
 *     summary: List allocations (filter by asset, holder, status)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Allocations]
 *     summary: Allocate an asset (blocks double-allocation → 409 heldBy)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId, allocatedToUserId]
 *             properties:
 *               assetId: { type: string }
 *               allocatedToUserId: { type: string }
 *               allocatedToDepartmentId: { type: string }
 *               expectedReturnDate: { type: string, format: date }
 *     responses:
 *       201: { description: Allocated }
 *       409: { description: "Asset not available — { heldBy, action: TRANSFER_REQUEST }" }
 */
allocationsRouter.get('/', validate(listAllocationsSchema, 'query'), allocationsController.list);
allocationsRouter.post(
  '/',
  requirePermission(PERMISSION.ASSET_ALLOCATE),
  validate(createAllocationSchema),
  allocationsController.create,
);

/**
 * @openapi
 * /allocations/{id}:
 *   get:
 *     tags: [Allocations]
 *     summary: Get an allocation
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 */
allocationsRouter.get('/:id', validate(idParam, 'params'), allocationsController.get);

/**
 * @openapi
 * /allocations/{id}/return:
 *   post:
 *     tags: [Allocations]
 *     summary: Return / check-in — closes the allocation, asset → AVAILABLE
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returnCondition: { type: string, example: Good }
 *               checkInNotes: { type: string }
 *     responses: { 200: { description: Returned }, 403: { description: Forbidden }, 409: { description: Illegal transition } }
 */
allocationsRouter.post(
  '/:id/return',
  requirePermission(PERMISSION.RETURN_APPROVE),
  validate(idParam, 'params'),
  validate(returnAllocationSchema),
  allocationsController.return,
);
