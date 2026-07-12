import {
  type AssetStatus,
  type TransferStatus,
  type MaintenanceStatus,
  type BookingStatus,
  type AuditCycleStatus,
} from '@prisma/client';
import { conflict } from './errors.js';

// Allowed transitions per entity (docs/ARCHITECTURE.md §7). Anything not listed
// is illegal and throws 409.
type Transitions<T extends string> = Record<T, readonly T[]>;

const asset: Transitions<AssetStatus> = {
  AVAILABLE: ['ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED'],
  ALLOCATED: ['AVAILABLE', 'UNDER_MAINTENANCE', 'LOST'],
  RESERVED: ['AVAILABLE', 'ALLOCATED', 'LOST'],
  UNDER_MAINTENANCE: ['AVAILABLE', 'LOST', 'RETIRED'],
  LOST: ['AVAILABLE', 'RETIRED'], // a found asset can come back
  RETIRED: ['DISPOSED'],
  DISPOSED: [],
};

const transfer: Transitions<TransferStatus> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

const maintenance: Transitions<MaintenanceStatus> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['TECH_ASSIGNED', 'IN_PROGRESS'],
  TECH_ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  REJECTED: [],
  RESOLVED: [],
};

const booking: Transitions<BookingStatus> = {
  UPCOMING: ['ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const auditCycle: Transitions<AuditCycleStatus> = {
  PLANNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['CLOSED'],
  CLOSED: [],
};

const MACHINES = { asset, transfer, maintenance, booking, auditCycle } as const;
export type MachineName = keyof typeof MACHINES;

export function canTransition(
  machine: MachineName,
  from: string,
  to: string,
): boolean {
  const map = MACHINES[machine] as Record<string, readonly string[]>;
  if (from === to) return true; // no-op is allowed
  return map[from]?.includes(to) ?? false;
}

/** Throws 409 if the transition is illegal. Call before mutating status. */
export function assertTransition(
  machine: MachineName,
  from: string,
  to: string,
): void {
  if (!canTransition(machine, from, to)) {
    throw conflict(`Illegal ${machine} transition: ${from} -> ${to}`);
  }
}
