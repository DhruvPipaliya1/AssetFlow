import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSION } from '../../lib/permissions.js';
import { reportsController } from './reports.controller.js';
import { reportQuerySchema } from './reports.schema.js';

export const reportsRouter = Router();
reportsRouter.use(authMiddleware);
reportsRouter.use(requirePermission(PERMISSION.ANALYTICS_VIEW));

/**
 * @openapi
 * /reports/utilization:
 *   get:
 *     tags: [Reports]
 *     summary: Per-asset utilization (allocation & booking counts). ?format=csv to export.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: format, schema: { type: string, enum: [json, csv] } }]
 *     responses: { 200: { description: OK } }
 */
reportsRouter.get('/utilization', validate(reportQuerySchema, 'query'), reportsController.utilization);

/**
 * @openapi
 * /reports/maintenance-frequency:
 *   get:
 *     tags: [Reports]
 *     summary: Assets ranked by maintenance count. ?format=csv to export.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: format, schema: { type: string, enum: [json, csv] } }]
 *     responses: { 200: { description: OK } }
 */
reportsRouter.get(
  '/maintenance-frequency',
  validate(reportQuerySchema, 'query'),
  reportsController.maintenanceFrequency,
);

/**
 * @openapi
 * /reports/maintenance-by-category:
 *   get:
 *     tags: [Reports]
 *     summary: Maintenance request volume grouped by asset category. ?format=csv to export.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: format, schema: { type: string, enum: [json, csv] } }]
 *     responses: { 200: { description: OK } }
 */
reportsRouter.get(
  '/maintenance-by-category',
  validate(reportQuerySchema, 'query'),
  reportsController.maintenanceByCategory,
);

/**
 * @openapi
 * /reports/lifecycle-alerts:
 *   get:
 *     tags: [Reports]
 *     summary: Assets due for maintenance or nearing retirement (age, condition, warranty). ?format=csv to export.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: format, schema: { type: string, enum: [json, csv] } }]
 *     responses: { 200: { description: OK } }
 */
reportsRouter.get(
  '/lifecycle-alerts',
  validate(reportQuerySchema, 'query'),
  reportsController.lifecycleAlerts,
);

/**
 * @openapi
 * /reports/department-summary:
 *   get:
 *     tags: [Reports]
 *     summary: Asset counts by department & status. ?format=csv to export.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: format, schema: { type: string, enum: [json, csv] } }]
 *     responses: { 200: { description: OK } }
 */
reportsRouter.get(
  '/department-summary',
  validate(reportQuerySchema, 'query'),
  reportsController.departmentSummary,
);

/**
 * @openapi
 * /reports/booking-heatmap:
 *   get:
 *     tags: [Reports]
 *     summary: Booking counts by hour-of-day (peak windows). ?format=csv to export.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: format, schema: { type: string, enum: [json, csv] } }]
 *     responses: { 200: { description: OK } }
 */
reportsRouter.get(
  '/booking-heatmap',
  validate(reportQuerySchema, 'query'),
  reportsController.bookingHeatmap,
);
