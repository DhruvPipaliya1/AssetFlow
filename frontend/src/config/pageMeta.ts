import { PATHS } from '../routes/paths';

// Title + subtitle shown in the top header (after the collapse button) per
// route — so pages don't repeat a header in their body. Add an entry when you
// add a route.
export interface PageMeta {
  title: string;
  subtitle?: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  [PATHS.dashboard]: { title: 'Dashboard', subtitle: 'Real-time operational snapshot' },
  [PATHS.assets]: { title: 'Assets', subtitle: 'Register, search & track assets centrally' },
  [PATHS.allocations]: { title: 'Allocations & Transfers', subtitle: 'Who holds what, with conflict handling' },
  [PATHS.bookings]: { title: 'Resource Booking', subtitle: 'Book shared resources by time slot' },
  [PATHS.maintenance]: { title: 'Maintenance', subtitle: 'Approval-gated repair workflow' },
  [PATHS.audits]: { title: 'Audit Cycles', subtitle: 'Structured verification & discrepancy reports' },
  [PATHS.reports]: { title: 'Reports & Analytics', subtitle: 'Actionable operational insight' },
  [PATHS.organization]: { title: 'Organization Setup', subtitle: 'Master data everything else depends on — Admin only' },
  [PATHS.notifications]: { title: 'Notifications', subtitle: 'Activity feed & alerts' },
  [PATHS.forbidden]: { title: 'Access denied' },
};

export function getPageMeta(pathname: string): PageMeta {
  return PAGE_META[pathname] ?? { title: 'AssetFlow' };
}
