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
    const raw = await dashboardRepo.recentActivity(30);

    // Collapse near-simultaneous duplicates of the same action on the same entity
    // (e.g. an event that notifies two parties): same action+entity+actor within
    // the same second is one business action.
    const seen = new Set<string>();
    const rows = raw.filter((r) => {
      const key = `${r.action}|${r.entityId ?? ''}|${r.actorUserId ?? ''}|${Math.floor(r.createdAt.getTime() / 1000)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const assetIdOf = (r: (typeof rows)[number]): string | null => {
      if (r.entityType === 'Asset' && r.entityId) return r.entityId;
      const metaAssetId = (r.metadata as { assetId?: unknown } | null)?.assetId;
      return typeof metaAssetId === 'string' ? metaAssetId : null;
    };

    const top = rows.slice(0, 15);
    const assetIds = [...new Set(top.map(assetIdOf).filter((id): id is string => !!id))];
    const assets = assetIds.length ? await dashboardRepo.assetsByIds(assetIds) : [];
    const byId = new Map(assets.map((a) => [a.id, a]));

    return top.map((r) => {
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
