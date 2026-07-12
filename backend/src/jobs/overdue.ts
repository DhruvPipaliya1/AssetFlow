import { prisma } from '../lib/prisma.js';
import { emit } from '../lib/events.js';
import { notify } from '../lib/notify.js';

// Hourly (§11.4): flip ACTIVE allocations past their expectedReturnDate to
// OVERDUE and notify the holder + every Asset Manager. Runs as a "system"
// actor (no user), so activity-log entries carry a null actorUserId.
export async function runOverdueCheck(now: Date = new Date()): Promise<{ flagged: number }> {
  const overdue = await prisma.allocation.findMany({
    where: { status: 'ACTIVE', expectedReturnDate: { lt: now } },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      allocatedToUser: { select: { id: true, name: true } },
    },
  });
  if (overdue.length === 0) return { flagged: 0 };

  // The recipients of the "asset overdue" alert (besides the holder).
  const managers = await prisma.user.findMany({
    where: { role: 'ASSET_MANAGER', status: 'ACTIVE' },
    select: { id: true },
  });

  for (const alloc of overdue) {
    await prisma.allocation.update({ where: { id: alloc.id }, data: { status: 'OVERDUE' } });

    // Activity-log entry (system actor).
    emit({
      type: 'ReturnOverdue',
      entityType: 'Allocation',
      entityId: alloc.id,
      meta: { assetTag: alloc.asset.assetTag, holder: alloc.allocatedToUser?.name },
    });

    const msg = `Asset ${alloc.asset.assetTag} (${alloc.asset.name}) is overdue for return`;
    if (alloc.allocatedToUserId) {
      await notify(alloc.allocatedToUserId, 'ReturnOverdue', msg, {
        entityType: 'Allocation',
        entityId: alloc.id,
      });
    }
    for (const m of managers) {
      await notify(m.id, 'ReturnOverdue', msg, { entityType: 'Allocation', entityId: alloc.id });
    }
  }

  console.log(`[jobs] overdue: flagged ${overdue.length} allocation(s)`);
  return { flagged: overdue.length };
}
