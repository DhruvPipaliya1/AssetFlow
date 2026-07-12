import { prisma } from '../lib/prisma.js';
import { notify } from '../lib/notify.js';

const REMINDER_LEAD_MINUTES = 30;

// §11.5: advance booking lifecycle by wall-clock and send pre-slot reminders.
//  UPCOMING → ONGOING   when startTime <= now < endTime
//  UPCOMING/ONGOING → COMPLETED   when endTime <= now
// Reminders go to the booker for slots starting within the next lead window;
// deduped against an existing BookingReminder notification (no schema flag).
export async function runBookingRollover(now: Date = new Date()): Promise<{
  started: number;
  completed: number;
  reminded: number;
}> {
  const [started, completed] = await prisma.$transaction([
    prisma.booking.updateMany({
      where: { status: 'UPCOMING', startTime: { lte: now }, endTime: { gt: now } },
      data: { status: 'ONGOING' },
    }),
    prisma.booking.updateMany({
      where: { status: { in: ['UPCOMING', 'ONGOING'] }, endTime: { lte: now } },
      data: { status: 'COMPLETED' },
    }),
  ]);

  // Pre-slot reminders.
  const leadEnd = new Date(now.getTime() + REMINDER_LEAD_MINUTES * 60_000);
  const soon = await prisma.booking.findMany({
    where: { status: 'UPCOMING', startTime: { gt: now, lte: leadEnd } },
    include: { asset: { select: { name: true, assetTag: true } } },
  });

  let reminded = 0;
  for (const b of soon) {
    const already = await prisma.notification.count({
      where: { entityType: 'Booking', entityId: b.id, type: 'BookingReminder' },
    });
    if (already > 0) continue;
    await notify(
      b.bookedByUserId,
      'BookingReminder',
      `Your booking of ${b.asset.assetTag} (${b.asset.name}) starts soon`,
      { entityType: 'Booking', entityId: b.id },
    );
    reminded++;
  }

  if (started.count || completed.count || reminded) {
    console.log(
      `[jobs] booking rollover: ${started.count} started, ${completed.count} completed, ${reminded} reminded`,
    );
  }
  return { started: started.count, completed: completed.count, reminded };
}
