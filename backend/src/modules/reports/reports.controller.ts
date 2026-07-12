import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { toCsv } from '../../lib/csv.js';
import { reportsService, type ReportRow } from './reports.service.js';
import type { AnalyticsActor } from '../../lib/analytics.js';

const actorOf = (u: { id: string; role: AnalyticsActor['role']; departmentId?: string | null }): AnalyticsActor => ({
  id: u.id,
  role: u.role,
  departmentId: u.departmentId ?? null,
});

// Respond with a CSV download when ?format=csv, else JSON rows.
function respond(req: Request, res: Response, name: string, rows: ReportRow[]): void {
  if ((req.query.format as string) === 'csv') {
    res.type('text/csv').attachment(`${name}.csv`).send(toCsv(rows));
    return;
  }
  res.json({ report: name, rows });
}

const report = (
  name: string,
  fn: (actor: AnalyticsActor) => Promise<ReportRow[]>,
) =>
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw unauthorized();
    respond(req, res, name, await fn(actorOf(req.user)));
  });

export const reportsController = {
  utilization: report('utilization', reportsService.utilization),
  maintenanceFrequency: report('maintenance-frequency', reportsService.maintenanceFrequency),
  maintenanceByCategory: report('maintenance-by-category', reportsService.maintenanceByCategory),
  departmentSummary: report('department-summary', reportsService.departmentSummary),
  bookingHeatmap: report('booking-heatmap', reportsService.bookingHeatmap),
  lifecycleAlerts: report('lifecycle-alerts', reportsService.lifecycleAlerts),
};
