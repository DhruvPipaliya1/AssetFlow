import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { idParam } from '../../lib/validation.js';
import { auditsController } from './audits.controller.js';
import {
  createCycleSchema,
  assignAuditorsSchema,
  auditItemSchema,
  listCyclesSchema,
} from './audits.schema.js';

// ─────────────── /api/audit-cycles ───────────────
export const auditCyclesRouter = Router();
auditCyclesRouter.use(authMiddleware);

/**
 * @openapi
 * /audit-cycles:
 *   get:
 *     tags: [Audits]
 *     summary: List audit cycles
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Audits]
 *     summary: Create an audit cycle (scope + date range, PLANNED) — Admin
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, scopeType, scopeValue, startDate, endDate]
 *             properties:
 *               name: { type: string, example: Q3 Floor-3 Audit }
 *               scopeType: { type: string, enum: [DEPARTMENT, LOCATION] }
 *               scopeValue: { type: string, description: department id or location string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses: { 201: { description: Created }, 403: { description: Forbidden } }
 */
auditCyclesRouter.get('/', validate(listCyclesSchema, 'query'), auditsController.listCycles);
auditCyclesRouter.post(
  '/',
  requirePermission(PERMISSION.AUDIT_MANAGE),
  validate(createCycleSchema),
  auditsController.createCycle,
);

/**
 * @openapi
 * /audit-cycles/{id}:
 *   get:
 *     tags: [Audits]
 *     summary: Get a cycle (auditors + item count)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 */
auditCyclesRouter.get('/:id', validate(idParam, 'params'), auditsController.getCycle);

/**
 * @openapi
 * /audit-cycles/{id}/auditors:
 *   post:
 *     tags: [Audits]
 *     summary: Assign auditors to a cycle — Admin
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [auditorUserIds]
 *             properties:
 *               auditorUserIds: { type: array, items: { type: string } }
 *     responses: { 200: { description: Assigned } }
 */
auditCyclesRouter.post(
  '/:id/auditors',
  requirePermission(PERMISSION.AUDIT_MANAGE),
  validate(idParam, 'params'),
  validate(assignAuditorsSchema),
  auditsController.assignAuditors,
);

/**
 * @openapi
 * /audit-cycles/{id}/start:
 *   post:
 *     tags: [Audits]
 *     summary: Start the cycle (PLANNED → IN_PROGRESS, generates items) — Admin
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Started }, 409: { description: Illegal transition } }
 */
auditCyclesRouter.post(
  '/:id/start',
  requirePermission(PERMISSION.AUDIT_MANAGE),
  validate(idParam, 'params'),
  auditsController.start,
);

/**
 * @openapi
 * /audit-cycles/{id}/items:
 *   get:
 *     tags: [Audits]
 *     summary: List the cycle's audit items
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK } }
 */
auditCyclesRouter.get('/:id/items', validate(idParam, 'params'), auditsController.items);

/**
 * @openapi
 * /audit-cycles/{id}/discrepancies:
 *   get:
 *     tags: [Audits]
 *     summary: Items marked MISSING or DAMAGED
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK } }
 */
auditCyclesRouter.get('/:id/discrepancies', validate(idParam, 'params'), auditsController.discrepancies);

/**
 * @openapi
 * /audit-cycles/{id}/close:
 *   post:
 *     tags: [Audits]
 *     summary: Close & lock the cycle (MISSING → asset LOST) — Admin
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Closed }, 409: { description: Illegal transition } }
 */
auditCyclesRouter.post(
  '/:id/close',
  requirePermission(PERMISSION.AUDIT_MANAGE),
  validate(idParam, 'params'),
  auditsController.close,
);

// ─────────────── /api/audit-items ───────────────
export const auditItemsRouter = Router();
auditItemsRouter.use(authMiddleware);

/**
 * @openapi
 * /audit-items/{id}:
 *   patch:
 *     tags: [Audits]
 *     summary: Mark an item VERIFIED / MISSING / DAMAGED (assigned auditors only)
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
 *               status: { type: string, enum: [VERIFIED, MISSING, DAMAGED] }
 *               notes: { type: string }
 *     responses: { 200: { description: Marked }, 403: { description: Not an assigned auditor }, 409: { description: Cycle not in progress } }
 */
auditItemsRouter.patch(
  '/:id',
  requirePermission(PERMISSION.AUDIT_PERFORM),
  validate(idParam, 'params'),
  validate(auditItemSchema),
  auditsController.markItem,
);
