import { Prisma, type Role } from '@prisma/client';
import { PERMISSION } from './permissions.js';
import { hasPermission } from './rbac.js';

// Dashboard/reports scope: Admin & Asset Manager see org-wide (ANALYTICS_VIEW_ALL);
// a Department Head is confined to assets their department owns. assetWhere is
// applied to Asset queries; { asset: assetWhere } filters related entities
// (allocations, bookings, transfers, maintenance).
export interface AnalyticsActor {
  id: string;
  role: Role;
  departmentId: string | null;
}

export interface AnalyticsScope {
  orgWide: boolean;
  deptId: string | null;
  assetWhere: Prisma.AssetWhereInput;
}

export function analyticsScope(actor: AnalyticsActor): AnalyticsScope {
  const orgWide = hasPermission(actor.role, PERMISSION.ANALYTICS_VIEW_ALL);
  const deptId = actor.departmentId ?? null;
  return {
    orgWide,
    deptId,
    assetWhere: orgWide ? {} : { ownerDepartmentId: deptId },
  };
}
