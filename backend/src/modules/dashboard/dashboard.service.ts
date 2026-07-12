import { dashboardRepo } from './dashboard.repo.js';
import { analyticsScope, type AnalyticsActor } from '../../lib/analytics.js';

export const dashboardService = {
  async kpis(actor: AnalyticsActor) {
    const scope = analyticsScope(actor);
    const kpis = await dashboardRepo.kpis(scope.assetWhere);
    return { scope: scope.orgWide ? 'ORG' : 'DEPARTMENT', kpis };
  },
};
