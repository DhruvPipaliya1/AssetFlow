import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { activityLogController } from './activity-log.controller.js';
import { listActivitySchema } from './activity-log.schema.js';

export const activityLogRouter = Router();
activityLogRouter.use(authMiddleware);

/**
 * @openapi
 * /activity-log:
 *   get:
 *     tags: [Activity Log]
 *     summary: Who-did-what-when audit feed (Admin / Asset Manager)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: entityType, schema: { type: string } }
 *       - { in: query, name: entityId, schema: { type: string } }
 *       - { in: query, name: actorUserId, schema: { type: string } }
 *       - { in: query, name: action, schema: { type: string } }
 *     responses: { 200: { description: OK }, 403: { description: Forbidden } }
 */
activityLogRouter.get(
  '/',
  requirePermission(PERMISSION.ANALYTICS_VIEW_ALL),
  validate(listActivitySchema, 'query'),
  activityLogController.list,
);
