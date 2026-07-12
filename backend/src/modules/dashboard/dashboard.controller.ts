import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { dashboardService } from './dashboard.service.js';
import type { AnalyticsActor } from '../../lib/analytics.js';

const actorOf = (u: { id: string; role: AnalyticsActor['role']; departmentId?: string | null }): AnalyticsActor => ({
  id: u.id,
  role: u.role,
  departmentId: u.departmentId ?? null,
});

export const dashboardController = {
  kpis: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json(await dashboardService.kpis(actorOf(req.user)));
  }),
};
