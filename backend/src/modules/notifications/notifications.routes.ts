import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../lib/validation.js';
import { notificationsController } from './notifications.controller.js';
import { listNotificationsSchema } from './notifications.schema.js';

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: The caller's notifications + unread count
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: isRead, schema: { type: string, enum: [true, false] } }]
 *     responses: { 200: { description: OK } }
 */
notificationsRouter.get('/', validate(listNotificationsSchema, 'query'), notificationsController.list);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all the caller's notifications read
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
notificationsRouter.patch('/read-all', notificationsController.markAllRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark one notification read (must be the caller's)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 403: { description: Not yours }, 404: { description: Not found } }
 */
notificationsRouter.patch('/:id/read', validate(idParam, 'params'), notificationsController.markRead);
