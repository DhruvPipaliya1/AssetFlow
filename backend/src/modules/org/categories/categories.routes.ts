import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.js';
import { requirePermission } from '../../../middleware/requirePermission.js';
import { validate } from '../../../middleware/validate.js';
import { PERMISSION } from '../../../lib/permissions.js';
import { idParam } from '../../../lib/validation.js';
import { categoriesController } from './categories.controller.js';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
} from './categories.schema.js';

export const categoriesRouter = Router();
categoriesRouter.use(authMiddleware);

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Organization]
 *     summary: List asset categories
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Organization]
 *     summary: Create a category with optional custom fields (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Electronics }
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *               customFields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key: { type: string, example: warrantyMonths }
 *                     label: { type: string, example: Warranty (months) }
 *                     type: { type: string, enum: [text, number, date, boolean] }
 *     responses: { 201: { description: Created }, 403: { description: Forbidden } }
 */
categoriesRouter.get('/', validate(listCategoriesSchema, 'query'), categoriesController.list);
categoriesRouter.post(
  '/',
  requirePermission(PERMISSION.ORG_MANAGE),
  validate(createCategorySchema),
  categoriesController.create,
);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags: [Organization]
 *     summary: Get a category
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   patch:
 *     tags: [Organization]
 *     summary: Update a category (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK }, 403: { description: Forbidden } }
 *   delete:
 *     tags: [Organization]
 *     summary: Deactivate a category (soft-delete, Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Deactivated }, 403: { description: Forbidden } }
 */
categoriesRouter.get('/:id', validate(idParam, 'params'), categoriesController.get);
categoriesRouter.patch(
  '/:id',
  requirePermission(PERMISSION.ORG_MANAGE),
  validate(idParam, 'params'),
  validate(updateCategorySchema),
  categoriesController.update,
);
categoriesRouter.delete(
  '/:id',
  requirePermission(PERMISSION.ORG_MANAGE),
  validate(idParam, 'params'),
  categoriesController.remove,
);
