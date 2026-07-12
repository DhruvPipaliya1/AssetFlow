import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { idParam } from '../../lib/validation.js';
import { maintenanceController } from './maintenance.controller.js';
import {
  createMaintenanceSchema,
  decideMaintenanceSchema,
  statusMaintenanceSchema,
  listMaintenanceSchema,
} from './maintenance.schema.js';

export const maintenanceRouter = Router();
maintenanceRouter.use(authMiddleware);

/**
 * @openapi
 * /maintenance:
 *   get:
 *     tags: [Maintenance]
 *     summary: List maintenance requests (filter by asset, status, priority, mine)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Maintenance]
 *     summary: Raise a request (PENDING) — asset stays put until approved
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId, description]
 *             properties:
 *               assetId: { type: string }
 *               description: { type: string, example: Screen flickers intermittently }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *               photoUrl: { type: string, format: uri }
 *     responses: { 201: { description: Raised (PENDING) } }
 */
maintenanceRouter.get('/', validate(listMaintenanceSchema, 'query'), maintenanceController.list);
maintenanceRouter.post(
  '/',
  requirePermission(PERMISSION.MAINTENANCE_RAISE),
  validate(createMaintenanceSchema),
  maintenanceController.create,
);

/**
 * @openapi
 * /maintenance/{id}:
 *   get:
 *     tags: [Maintenance]
 *     summary: Get a maintenance request
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 */
maintenanceRouter.get('/:id', validate(idParam, 'params'), maintenanceController.get);

/**
 * @openapi
 * /maintenance/{id}/decision:
 *   patch:
 *     tags: [Maintenance]
 *     summary: Approve (asset → UNDER_MAINTENANCE) or reject — Asset Manager
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
 *               technicianUserId: { type: string }
 *     responses: { 200: { description: Decided }, 403: { description: Forbidden }, 409: { description: Already decided } }
 */
maintenanceRouter.patch(
  '/:id/decision',
  requirePermission(PERMISSION.MAINTENANCE_APPROVE),
  validate(idParam, 'params'),
  validate(decideMaintenanceSchema),
  maintenanceController.decide,
);

/**
 * @openapi
 * /maintenance/{id}/status:
 *   patch:
 *     tags: [Maintenance]
 *     summary: Advance work TECH_ASSIGNED → IN_PROGRESS → RESOLVED (asset → AVAILABLE)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [TECH_ASSIGNED, IN_PROGRESS, RESOLVED] }
 *               technicianUserId: { type: string }
 *     responses: { 200: { description: Updated }, 409: { description: Illegal transition } }
 */
maintenanceRouter.patch(
  '/:id/status',
  requirePermission(PERMISSION.MAINTENANCE_APPROVE),
  validate(idParam, 'params'),
  validate(statusMaintenanceSchema),
  maintenanceController.setStatus,
);
