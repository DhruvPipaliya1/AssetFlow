import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.js';
import { requirePermission } from '../../../middleware/requirePermission.js';
import { validate } from '../../../middleware/validate.js';
import { PERMISSION } from '../../../lib/permissions.js';
import { idParam } from '../../../lib/validation.js';
import { departmentsController } from './departments.controller.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentsSchema,
} from './departments.schema.js';

export const departmentsRouter = Router();
departmentsRouter.use(authMiddleware);

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Organization]
 *     summary: List departments (with head, parent & counts)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Organization]
 *     summary: Create a department (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               headUserId: { type: string }
 *               parentDepartmentId: { type: string }
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       201: { description: Created }
 *       403: { description: Forbidden }
 */
departmentsRouter.get('/', validate(listDepartmentsSchema, 'query'), departmentsController.list);
departmentsRouter.post(
  '/',
  requirePermission(PERMISSION.ORG_MANAGE),
  validate(createDepartmentSchema),
  departmentsController.create,
);

/**
 * @openapi
 * /departments/{id}:
 *   get:
 *     tags: [Organization]
 *     summary: Get a department
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   patch:
 *     tags: [Organization]
 *     summary: Update a department (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 403: { description: Forbidden } }
 *   delete:
 *     tags: [Organization]
 *     summary: Deactivate a department (soft-delete, Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Deactivated }, 403: { description: Forbidden } }
 */
departmentsRouter.get('/:id', validate(idParam, 'params'), departmentsController.get);
departmentsRouter.patch(
  '/:id',
  requirePermission(PERMISSION.ORG_MANAGE),
  validate(idParam, 'params'),
  validate(updateDepartmentSchema),
  departmentsController.update,
);
departmentsRouter.delete(
  '/:id',
  requirePermission(PERMISSION.ORG_MANAGE),
  validate(idParam, 'params'),
  departmentsController.remove,
);
