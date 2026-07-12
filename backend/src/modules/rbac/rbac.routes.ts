import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { rbacController } from './rbac.controller.js';
import { roleParam, updateRoleSchema } from './rbac.schema.js';

export const rbacRouter = Router();
rbacRouter.use(authMiddleware, requirePermission(PERMISSION.RBAC_MANAGE));

/**
 * @openapi
 * /rbac/matrix:
 *   get:
 *     tags: [RBAC]
 *     summary: The role × permission matrix (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK }, 403: { description: Forbidden } }
 */
rbacRouter.get('/matrix', rbacController.matrix);

/**
 * @openapi
 * /rbac/roles/{role}:
 *   put:
 *     tags: [RBAC]
 *     summary: Set a (non-admin) role's editable permissions (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: role, required: true, schema: { type: string, enum: [ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE] } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions: { type: array, items: { type: string } }
 *     responses: { 200: { description: Updated matrix }, 400: { description: Invalid role }, 403: { description: Forbidden } }
 */
rbacRouter.put('/roles/:role', validate(roleParam, 'params'), validate(updateRoleSchema), rbacController.setRole);
