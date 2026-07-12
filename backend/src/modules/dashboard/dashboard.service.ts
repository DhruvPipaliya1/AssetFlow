import { dashboardRepo } from './dashboard.repo.js';
import { analyticsScope, type AnalyticsActor } from '../../lib/analytics.js';

export interface ActivityItem {
  id: string;
  action: string;
  actorName: string | null;
  assetTag: string | null;
  assetName: string | null;
  createdAt: Date;
}

export const dashboardService = {
  async kpis(actor: AnalyticsActor) {
    const scope = analyticsScope(actor);
    const kpis = await dashboardRepo.kpis(scope.assetWhere);
    return { scope: scope.orgWide ? 'ORG' : 'DEPARTMENT', kpis };
  },

  // Recent activity feed for the dashboard — enriched with the related asset
  // tag/name where resolvable (entityType Asset, or a meta.assetId).
  async recentActivity(): Promise<ActivityItem[]> {
    const rows = await dashboardRepo.recentActivity(10);
    const assetIdOf = (r: (typeof rows)[number]): string | null => {
      if (r.entityType === 'Asset' && r.entityId) return r.entityId;
      const metaAssetId = (r.metadata as { assetId?: unknown } | null)?.assetId;
      return typeof metaAssetId === 'string' ? metaAssetId : null;
    };

    const assetIds = [...new Set(rows.map(assetIdOf).filter((id): id is string => !!id))];
    const assets = assetIds.length ? await dashboardRepo.assetsByIds(assetIds) : [];
    const byId = new Map(assets.map((a) => [a.id, a]));

    return rows.slice(0, 8).map((r) => {
      const asset = byId.get(assetIdOf(r) ?? '');
      return {
        id: r.id,
        action: r.action,
        actorName: r.actorUser?.name ?? null,
        assetTag: asset?.assetTag ?? null,
        assetName: asset?.name ?? null,
        createdAt: r.createdAt,
      };
    });
  },
};
