import { Tag } from 'antd';

// Maps every status enum in the system to a design-system CSS variable
// (styles/variables.css). Change a color there and every badge updates.
const STATUS_VAR: Record<string, string> = {
  // Asset
  AVAILABLE: '--af-status-available',
  ALLOCATED: '--af-status-allocated',
  RESERVED: '--af-status-reserved',
  UNDER_MAINTENANCE: '--af-status-maintenance',
  LOST: '--af-status-lost',
  RETIRED: '--af-status-retired',
  DISPOSED: '--af-status-disposed',
  // Allocation
  ACTIVE: '--af-success',
  RETURNED: '--af-info',
  OVERDUE: '--af-danger',
  // Transfer / Maintenance
  REQUESTED: '--af-warning',
  APPROVED: '--af-success',
  REJECTED: '--af-danger',
  COMPLETED: '--af-info',
  PENDING: '--af-warning',
  TECH_ASSIGNED: '--af-info',
  IN_PROGRESS: '--af-primary',
  RESOLVED: '--af-success',
  // Booking
  UPCOMING: '--af-info',
  ONGOING: '--af-primary',
  CANCELLED: '--af-neutral',
  // Audit
  PLANNED: '--af-info',
  CLOSED: '--af-neutral',
  VERIFIED: '--af-success',
  MISSING: '--af-danger',
  DAMAGED: '--af-maintenance',
  // Entity / priority
  INACTIVE: '--af-neutral',
  LOW: '--af-neutral',
  MEDIUM: '--af-info',
  HIGH: '--af-maintenance',
  CRITICAL: '--af-danger',
};

export interface StatusTagProps {
  status?: string | null;
}

export function StatusTag({ status }: StatusTagProps) {
  if (!status) return null;
  const varName = STATUS_VAR[status] ?? '--af-neutral';
  return (
    <Tag
      style={{
        background: `var(${varName})`,
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontWeight: 500,
      }}
    >
      {status.replace(/_/g, ' ')}
    </Tag>
  );
}
