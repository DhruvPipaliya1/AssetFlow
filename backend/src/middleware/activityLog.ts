import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// The single writer of the audit trail ("who did what, when"). Called by the
// event handlers (§12.1) and directly for non-event actions (e.g. login).
export interface ActivityEntry {
  actorUserId?: string | null; // null = system
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: unknown;
}

export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    const data: Prisma.ActivityLogUncheckedCreateInput = {
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
    };
    if (entry.metadata !== undefined) {
      data.metadata = entry.metadata as Prisma.InputJsonValue;
    }
    await prisma.activityLog.create({ data });
  } catch (err) {
    console.error('[activityLog] failed', err);
  }
}
