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

  // 2-D day-of-week × hour-of-day heatmap of non-cancelled bookings (peak usage
  // windows). Long format: one row per (day, hour) cell so it charts and exports.
  async bookingHeatmap(actor: AnalyticsActor): Promise<ReportRow[]> {
    const { assetWhere } = analyticsScope(actor);
    const bookings = await reportsRepo.bookingStarts(assetWhere);
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
    for (const b of bookings) {
      counts[b.startTime.getUTCDay()][b.startTime.getUTCHours()]++;
    }
    const rows: ReportRow[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        rows.push({
          day: d,
          dayLabel: DAYS[d],
          hour: h,
          hourLabel: `${String(h).padStart(2, '0')}:00`,
          bookings: counts[d][h],
        });
      }
    }
    return rows;
  },

  // Maintenance request volume grouped by asset category.
  async maintenanceByCategory(actor: AnalyticsActor): Promise<ReportRow[]> {
    const { assetWhere } = analyticsScope(actor);
    const rows = await reportsRepo.maintenanceWithCategory(assetWhere);
    const byCategory = new Map<string, number>();
    for (const r of rows) {
      const name = r.asset.category?.name ?? 'Uncategorized';
      byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
    }
    return [...byCategory.entries()]
      .map(([category, maintenanceCount]) => ({ category, maintenanceCount }))
      .sort((a, b) => b.maintenanceCount - a.maintenanceCount);
  },

  // Assets flagged as due for maintenance or nearing retirement, by heuristic:
  // age ≥ 5y, poor condition, ≥3 maintenance requests, or an expired warranty.
  async lifecycleAlerts(actor: AnalyticsActor): Promise<ReportRow[]> {
    const { assetWhere } = analyticsScope(actor);
    const assets = await reportsRepo.assetsForLifecycle(assetWhere);
    const now = Date.now();
    const YEAR_MS = 365.25 * 24 * 3600 * 1000;
    const MONTH_MS = 30.44 * 24 * 3600 * 1000;
    const RETIREMENT_AGE_YEARS = 5;
    const HEAVY_MAINTENANCE = 3;
    const POOR_CONDITION = /poor|fair|damag|repair|worn|broken/i;

    const rows: ReportRow[] = [];
    for (const a of assets) {
      const ageYears = a.acquisitionDate ? (now - a.acquisitionDate.getTime()) / YEAR_MS : null;
      const maintenanceCount = a.maintenance.length;
      const lastMaintenanceAt = a.maintenance[0]?.createdAt ?? null;

      const warrantyMonths = extractWarrantyMonths(a.customFieldValues);
      const warrantyExpiry =
        warrantyMonths != null && a.acquisitionDate
          ? new Date(a.acquisitionDate.getTime() + warrantyMonths * MONTH_MS)
          : null;
      const warrantyExpired = warrantyExpiry != null && warrantyExpiry.getTime() < now;

      const alerts: string[] = [];
      if (ageYears != null && ageYears >= RETIREMENT_AGE_YEARS) alerts.push('Nearing retirement');
      if (POOR_CONDITION.test(a.condition ?? '')) alerts.push('Poor condition');
      if (maintenanceCount >= HEAVY_MAINTENANCE) alerts.push('Frequent maintenance');
      if (warrantyExpired) alerts.push('Warranty expired');
      if (a.status === 'UNDER_MAINTENANCE') alerts.push('Currently in maintenance');
      if (alerts.length === 0) continue;

      rows.push({
        assetTag: a.assetTag,
        name: a.name,
        category: a.category?.name ?? '',
        status: a.status,
        ageYears: ageYears != null ? Math.round(ageYears * 10) / 10 : '',
        condition: a.condition ?? '',
        maintenanceCount,
        lastMaintenanceAt: lastMaintenanceAt ? lastMaintenanceAt.toISOString().slice(0, 10) : '',
        warrantyExpiry: warrantyExpiry ? warrantyExpiry.toISOString().slice(0, 10) : '',
        alerts: alerts.join('; '),
      });
    }
    // Most-flagged first, then oldest.
    return rows.sort((a, b) => {
      const af = String(a.alerts).split(';').length;
      const bf = String(b.alerts).split(';').length;
      if (bf !== af) return bf - af;
      return Number(b.ageYears || 0) - Number(a.ageYears || 0);
    });
  },
};

// Pull a warranty-period (in months) out of an asset's category-specific field
// values: the first numeric value whose key mentions "warranty".
function extractWarrantyMonths(values: unknown): number | null {
  if (!values || typeof values !== 'object') return null;
  for (const [key, val] of Object.entries(values as Record<string, unknown>)) {
    if (/warrant/i.test(key) && typeof val === 'number' && Number.isFinite(val)) return val;
  }
  return null;
}

export type ReportName = keyof Pick<
  typeof reportsService,
  | 'utilization'
  | 'maintenanceFrequency'
  | 'departmentSummary'
  | 'bookingHeatmap'
  | 'maintenanceByCategory'
  | 'lifecycleAlerts'
>;
