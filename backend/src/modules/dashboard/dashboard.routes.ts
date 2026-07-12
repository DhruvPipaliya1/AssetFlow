import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { PERMISSION } from '../../lib/permissions.js';
import { dashboardController } from './dashboard.controller.js';

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

/**
 * @openapi
 * /dashboard/kpis:
 *   get:
 *     tags: [Dashboard]
 *     summary: Operational KPI tiles (org-wide, or dept-scoped for a Dept Head)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Counts — available, allocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns, overdueReturns" }
 *       403: { description: Forbidden }
 */
dashboardRouter.get('/kpis', requirePermission(PERMISSION.ANALYTICS_VIEW), dashboardController.kpis);

/**
 * @openapi
 * /dashboard/activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Recent operational activity feed (all roles)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
dashboardRouter.get('/activity', dashboardController.recentActivity);
