import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.js';
import { requirePermission } from '../../../middleware/requirePermission.js';
import { validate } from '../../../middleware/validate.js';
import { PERMISSION } from '../../../lib/permissions.js';
import { idParam } from '../../../lib/validation.js';
import { employeesController } from './employees.controller.js';
import {
  listEmployeesSchema,
  updateEmployeeSchema,
  changeRoleSchema,
} from './employees.schema.js';

export const employeesRouter = Router();
employeesRouter.use(authMiddleware);

/**
 * @openapi
 * /employees:
 *   get:
 *     tags: [Organization]
 *     summary: List / search the employee directory (paginated)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: role, schema: { type: string, enum: [ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE] } }
 *       - { in: query, name: status, schema: { type: string, enum: [ACTIVE, INACTIVE] } }
 *       - { in: query, name: departmentId, schema: { type: string } }
 *       - { in: query, name: q, schema: { type: string }, description: name/email search }
 *       - { in: query, name: page, schema: { type: string } }
 *       - { in: query, name: take, schema: { type: string } }
 *     responses: { 200: { description: OK } }
 */
employeesRouter.get('/', validate(listEmployeesSchema, 'query'), employeesController.list);

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     tags: [Organization]
 *     summary: Get an employee
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   patch:
 *     tags: [Organization]
 *     summary: Update an employee's name / department / status (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 403: { description: Forbidden } }
 */
employeesRouter.get('/:id', validate(idParam, 'params'), employeesController.get);
employeesRouter.patch(
  '/:id',
  requirePermission(PERMISSION.ORG_MANAGE),
  validate(idParam, 'params'),
  validate(updateEmployeeSchema),
  employeesController.update,
);

/**
 * @openapi
 * /employees/{id}/role:
 *   patch:
 *     tags: [Organization]
 *     summary: Promote/change an employee's role (Admin only — the sole role-assignment endpoint)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE] }
 *     responses:
 *       200: { description: Role updated }
 *       403: { description: Forbidden (not Admin, or changing own role) }
 */
employeesRouter.patch(
  '/:id/role',
  requirePermission(PERMISSION.ROLE_ASSIGN),
  validate(idParam, 'params'),
  validate(changeRoleSchema),
  employeesController.changeRole,
);
