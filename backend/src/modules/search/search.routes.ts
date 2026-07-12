import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { searchController } from './search.controller.js';
import { searchQuerySchema } from './search.schema.js';

export const searchRouter = Router();
searchRouter.use(authMiddleware);

/**
 * @openapi
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Quick search across assets, employees & departments
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: q, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK } }
 */
searchRouter.get('/', validate(searchQuerySchema, 'query'), searchController.search);
