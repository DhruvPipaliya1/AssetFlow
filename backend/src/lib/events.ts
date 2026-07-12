import { EventEmitter } from 'node:events';
import { notify } from './notify.js';
import { logActivity } from '../middleware/activityLog.js';

// In-process, synchronous domain events (docs/ARCHITECTURE.md §12.1).
// Services emit; handlers own the side-effects (activity log + notifications).
// NOT a durable broker — no Kafka/Redis (that's a Future Enhancement).

export type DomainEventType =
  | 'AssetAllocated'
  | 'AssetTransferred'
  | 'AssetReturned'
  | 'BookingCreated'
  | 'BookingCancelled'
  | 'MaintenanceRaised'
  | 'MaintenanceApproved'
  | 'MaintenanceRejected'
  | 'ReturnOverdue'
  | 'AuditDiscrepancyFlagged'
  | 'RolePromoted'
  | 'TransferRequested'
  | 'TransferRejected';

export interface DomainEvent {
  type: DomainEventType | string;
  actorUserId?: string; // who did it (for the audit trail)
  targetUserId?: string; // who to notify (optional)
  entityType: string;
  entityId?: string;
  message?: string; // notification message (required to notify)
  meta?: Record<string, unknown>;
}

const bus = new EventEmitter();
const CHANNEL = 'domain';

/** Fire a domain event. Call inside the service, within the txn boundary. */
export function emit(event: DomainEvent): void {
  bus.emit(CHANNEL, event);
}

/** Registered once at startup (server.ts). */
export function registerEventHandlers(): void {
  bus.on(CHANNEL, (event: DomainEvent) => {
    void handle(event);
  });
}

async function handle(event: DomainEvent): Promise<void> {
  try {
    // 1) audit trail — every event
    await logActivity({
      actorUserId: event.actorUserId ?? 'system',
      action: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.meta,
    });
    // 2) notification — when a target + message are present
    if (event.targetUserId && event.message) {
      await notify(event.targetUserId, event.type, event.message, {
        entityType: event.entityType,
        entityId: event.entityId,
      });
    }
  } catch (err) {
    console.error('[events] handler failed for', event.type, err);
  }
}
