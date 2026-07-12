import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export const reportsRepo = {
  // Per-asset utilization: allocation & booking counts + current status.
  assetsWithCounts: (assetWhere: Prisma.AssetWhereInput) =>
    prisma.asset.findMany({
      where: assetWhere,
      include: {
        category: { select: { name: true } },
        ownerDepartment: { select: { name: true } },
        _count: { select: { allocations: true, bookings: true } },
      },
      orderBy: { assetTag: 'asc' },
    }),

  // Maintenance requests grouped by asset (count + last raised).
  maintenanceByAsset: (assetWhere: Prisma.AssetWhereInput) =>
    prisma.maintenanceRequest.groupBy({
      by: ['assetId'],
      where: { asset: assetWhere },
      _count: { _all: true },
      _max: { createdAt: true },
    }),

  assetsByIds: (ids: string[]) =>
    prisma.asset.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, assetTag: true } }),

  // Assets grouped by owning department + status (for the department summary).
  assetsByDeptStatus: (assetWhere: Prisma.AssetWhereInput) =>
    prisma.asset.groupBy({
      by: ['ownerDepartmentId', 'status'],
      where: assetWhere,
      _count: { _all: true },
    }),

  departments: () => prisma.department.findMany({ select: { id: true, name: true } }),

  // Non-cancelled booking start times (bucketed into a day×hour heatmap).
  bookingStarts: (assetWhere: Prisma.AssetWhereInput) =>
    prisma.booking.findMany({
      where: { asset: assetWhere, status: { not: 'CANCELLED' } },
      select: { startTime: true },
    }),

  // Assets + their category, condition, age inputs and maintenance history — the
  // inputs to the lifecycle-alert heuristics (due for maintenance / nearing
  // retirement). Already-disposed assets are excluded (nothing to act on).
  assetsForLifecycle: (assetWhere: Prisma.AssetWhereInput) =>
    prisma.asset.findMany({
      where: { ...assetWhere, status: { notIn: ['DISPOSED', 'RETIRED'] } },
      select: {
        assetTag: true,
        name: true,
        status: true,
        condition: true,
        acquisitionDate: true,
        customFieldValues: true,
        category: { select: { name: true } },
        maintenance: { select: { createdAt: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { acquisitionDate: 'asc' },
    }),

  // Maintenance requests with their asset's category — aggregated by category
  // in the service.
  maintenanceWithCategory: (assetWhere: Prisma.AssetWhereInput) =>
    prisma.maintenanceRequest.findMany({
      where: { asset: assetWhere },
      select: { asset: { select: { categoryId: true, category: { select: { name: true } } } } },
    }),
};
