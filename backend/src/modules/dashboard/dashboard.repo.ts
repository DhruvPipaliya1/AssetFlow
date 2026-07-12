import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export const dashboardRepo = {
  // All KPI counts in one batch. `assetWhere` scopes Asset queries; related
  // entities are scoped via their asset relation.
  async kpis(assetWhere: Prisma.AssetWhereInput) {
    const rel = { asset: assetWhere };
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalAssets,
      available,
      allocated,
      underMaintenance,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturns,
    ] = await prisma.$transaction([
      prisma.asset.count({ where: assetWhere }),
      prisma.asset.count({ where: { ...assetWhere, status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { ...assetWhere, status: 'ALLOCATED' } }),
      prisma.asset.count({ where: { ...assetWhere, status: 'UNDER_MAINTENANCE' } }),
      prisma.maintenanceRequest.count({ where: { ...rel, createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { ...rel, status: { in: ['UPCOMING', 'ONGOING'] } } }),
      prisma.transferRequest.count({ where: { ...rel, status: 'REQUESTED' } }),
      prisma.allocation.count({
        where: { ...rel, status: 'ACTIVE', expectedReturnDate: { gte: now } },
      }),
      prisma.allocation.count({
        where: {
          ...rel,
          OR: [{ status: 'OVERDUE' }, { status: 'ACTIVE', expectedReturnDate: { lt: now } }],
        },
      }),
    ]);

    return {
      totalAssets,
      available,
      allocated,
      underMaintenance,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturns,
    };
  },
};
