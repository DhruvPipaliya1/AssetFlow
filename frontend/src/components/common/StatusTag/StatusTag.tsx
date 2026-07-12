import { Tag } from 'antd';

// Central color map for EVERY status enum in the system. Use this everywhere a
// lifecycle/workflow status is shown — never hand-roll a colored string.
const STATUS_COLORS: Record<string, string> = {
  // Asset
  AVAILABLE: 'green',
  ALLOCATED: 'blue',
  RESERVED: 'gold',
  UNDER_MAINTENANCE: 'orange',
  LOST: 'red',
  RETIRED: 'default',
  DISPOSED: 'default',
  // Allocation
  ACTIVE: 'green',
  RETURNED: 'blue',
  OVERDUE: 'red',
  // Transfer / Maintenance shared
  REQUESTED: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  COMPLETED: 'blue',
  PENDING: 'gold',
  TECH_ASSIGNED: 'cyan',
  IN_PROGRESS: 'processing',
  RESOLVED: 'green',
  // Booking
  UPCOMING: 'blue',
  ONGOING: 'processing',
  CANCELLED: 'default',
  // Audit
  PLANNED: 'blue',
  CLOSED: 'default',
  VERIFIED: 'green',
  MISSING: 'red',
  DAMAGED: 'orange',
  // Entity / priority
  INACTIVE: 'default',
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export interface StatusTagProps {
  status?: string | null;
}

export function StatusTag({ status }: StatusTagProps) {
  if (!status) return null;
  return <Tag color={STATUS_COLORS[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Tag>;
}
