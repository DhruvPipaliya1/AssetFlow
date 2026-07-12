import cron from 'node-cron';
import { SETTINGS } from '../lib/settings.js';
import { runOverdueCheck } from './overdue.js';
import { runBookingRollover } from './bookingRollover.js';

// Registered once at startup (server.ts). Each task swallows its own errors so a
// bad run never crashes the scheduler.
export function startJobs(): void {
  cron.schedule(SETTINGS.cron.overdue, () => {
    void runOverdueCheck().catch((err) => console.error('[jobs] overdue failed', err));
  });
  cron.schedule(SETTINGS.cron.bookingRollover, () => {
    void runBookingRollover().catch((err) => console.error('[jobs] bookingRollover failed', err));
  });
  console.log(
    `⏰ Jobs scheduled — overdue: "${SETTINGS.cron.overdue}", rollover: "${SETTINGS.cron.bookingRollover}"`,
  );
}
