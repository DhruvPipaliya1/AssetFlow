import { reportsRepo } from './reports.repo.js';
import { analyticsScope, type AnalyticsActor } from '../../lib/analytics.js';

// Every report returns a flat array of rows so CSV export is a straight
// key→column mapping (lib/csv.ts).
export type ReportRow = Record<string, unknown>;

export const reportsService = {
  async utilization(actor: AnalyticsActor): Promise<ReportRow[]> {
    const { assetWhere } = analyticsScope(actor);
    const assets = await reportsRepo.assetsWithCounts(assetWhere);
    return assets.map((a) => ({
      assetTag: a.assetTag,
      name: a.name,
      category: a.category?.name ?? '',
      department: a.ownerDepartment?.name ?? 'Unassigned',
      status: a.status,
      timesAllocated: a._count.allocations,
      timesBooked: a._count.bookings,
      currentlyAllocated: a.status === 'ALLOCATED',
    }));
  },

  async maintenanceFrequency(actor: AnalyticsActor): Promise<ReportRow[]> {
    const { assetWhere } = analyticsScope(actor);
    const grouped = await reportsRepo.maintenanceByAsset(assetWhere);
    if (grouped.length === 0) return [];
    const assets = await reportsRepo.assetsByIds(grouped.map((g) => g.assetId));
    const byId = new Map(assets.map((a) => [a.id, a]));
    return grouped
      .map((g) => ({
        assetTag: byId.get(g.assetId)?.assetTag ?? '',
        name: byId.get(g.assetId)?.name ?? '',
        maintenanceCount: g._count._all,
        lastRaisedAt: g._max.createdAt?.toISOString() ?? '',
      }))
      .sort((a, b) => b.maintenanceCount - a.maintenanceCount);
  },

  async departmentSummary(actor: AnalyticsActor): Promise<ReportRow[]> {
    const { assetWhere } = analyticsScope(actor);
    const [grouped, departments] = await Promise.all([
      reportsRepo.assetsByDeptStatus(assetWhere),
      reportsRepo.departments(),
    ]);
    const deptName = new Map(departments.map((d) => [d.id, d.name]));

    // Pivot (dept, status) rows into one row per department.
    const rows = new Map<string, ReportRow>();
    for (const g of grouped) {
      const key = g.ownerDepartmentId ?? '__none__';
      const label = g.ownerDepartmentId ? deptName.get(g.ownerDepartmentId) ?? 'Unknown' : 'Unassigned';
      if (!rows.has(key)) {
        rows.set(key, {
          department: label,
          totalAssets: 0,
          available: 0,
          allocated: 0,
          underMaintenance: 0,
          lost: 0,
          other: 0,
        });
      }
      const row = rows.get(key)!;
      const n = g._count._all;
      row.totalAssets = (row.totalAssets as number) + n;
      if (g.status === 'AVAILABLE') row.available = (row.available as number) + n;
      else if (g.status === 'ALLOCATED') row.allocated = (row.allocated as number) + n;
      else if (g.status === 'UNDER_MAINTENANCE') row.underMaintenance = (row.underMaintenance as number) + n;
      else if (g.status === 'LOST') row.lost = (row.lost as number) + n;
      else row.other = (row.other as number) + n;
    }
    return [...rows.values()].sort((a, b) => (b.totalAssets as number) - (a.totalAssets as number));
  },

  async bookingHeatmap(actor: AnalyticsActor): Promise<ReportRow[]> {
    const { assetWhere } = analyticsScope(actor);
    const bookings = await reportsRepo.bookingStarts(assetWhere);
    const buckets = new Array(24).fill(0);
    for (const b of bookings) buckets[b.startTime.getUTCHours()]++;
    return buckets.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      bookings: count,
    }));
  },
};

export type ReportName = keyof Pick<
  typeof reportsService,
  'utilization' | 'maintenanceFrequency' | 'departmentSummary' | 'bookingHeatmap'
>;
