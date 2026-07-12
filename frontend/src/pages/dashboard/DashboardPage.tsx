import { useEffect, useRef, useState } from 'react';
import { Row, Col, Alert, App, Button, Space, Card, Divider, Timeline, Empty, Skeleton, Typography, Pagination } from 'antd';
import {
  LaptopOutlined,
  SwapOutlined,
  ToolOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RetweetOutlined,
  PlusOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { KpiCard } from '../../components/common';
import { dashboardService } from '../../services/dashboard.service';
import { apiErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSION } from '../../types/permissions';
import { PATHS } from '../../routes/paths';

dayjs.extend(relativeTime);

// action → human phrase + timeline dot colour (blue/green/red/gray).
const ACTIVITY: Record<string, { label: string; color: string }> = {
  AssetRegistered: { label: 'registered', color: 'blue' },
  AssetAllocated: { label: 'allocated', color: 'blue' },
  AssetReturned: { label: 'returned', color: 'green' },
  AssetTransferred: { label: 'transferred', color: 'blue' },
  TransferRequested: { label: 'transfer requested', color: 'gray' },
  TransferRejected: { label: 'transfer rejected', color: 'red' },
  BookingCreated: { label: 'booking confirmed', color: 'green' },
  BookingCancelled: { label: 'booking cancelled', color: 'red' },
  BookingRescheduled: { label: 'booking rescheduled', color: 'blue' },
  MaintenanceRaised: { label: 'maintenance raised', color: 'gray' },
  MaintenanceApproved: { label: 'maintenance approved', color: 'blue' },
  MaintenanceRejected: { label: 'maintenance rejected', color: 'red' },
  MaintenanceResolved: { label: 'maintenance resolved', color: 'green' },
  MaintenanceStatusChanged: { label: 'maintenance updated', color: 'blue' },
  ReturnOverdue: { label: 'return overdue', color: 'red' },
  AuditDiscrepancyFlagged: { label: 'audit discrepancy flagged', color: 'red' },
  AuditCycleCreated: { label: 'audit cycle created', color: 'blue' },
  AuditCycleStarted: { label: 'audit started', color: 'blue' },
  AuditItemMarked: { label: 'audit item marked', color: 'blue' },
  AuditorsAssigned: { label: 'auditors assigned', color: 'blue' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.kpis,
  });
  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardService.recentActivity,
  });
  const k = data?.kpis;

  // Greet once per login session with an auto-dismissing toast — not on every
  // dashboard visit. Keyed by user id in sessionStorage so a fresh login (or a
  // different user) is greeted again, but re-navigating here within the session
  // stays quiet.
  const { notification } = App.useApp();
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current || !data || !user) return;
    const key = `af:greeted:${user.id}`;
    if (sessionStorage.getItem(key)) return;
    greeted.current = true;
    sessionStorage.setItem(key, '1');
    notification.info({
      message: `Welcome back, ${user.name?.split(' ')[0] ?? 'there'}`,
      description: `Showing ${data.scope === 'ORG' ? 'organization-wide' : 'your department'} figures.`,
      placement: 'topRight',
      duration: 3,
    });
  }, [data, user, notification]);

  // Recent-activity pagination.
  const ACT_PAGE_SIZE = 5;
  const [actPage, setActPage] = useState(1);

  const tiles = [
    { title: 'Assets Available', value: k?.available, icon: <LaptopOutlined />, color: 'var(--af-kpi-available)', to: PATHS.assets },
    { title: 'Assets Allocated', value: k?.allocated, icon: <SwapOutlined />, color: 'var(--af-kpi-allocated)', to: PATHS.allocations },
    { title: 'Maintenance Today', value: k?.maintenanceToday, icon: <ToolOutlined />, color: 'var(--af-kpi-maintenance)', to: PATHS.maintenance },
    { title: 'Active Bookings', value: k?.activeBookings, icon: <CalendarOutlined />, color: 'var(--af-kpi-bookings)', to: PATHS.bookings },
    { title: 'Pending Transfers', value: k?.pendingTransfers, icon: <RetweetOutlined />, color: 'var(--af-kpi-transfers)', to: PATHS.allocations },
    { title: 'Upcoming Returns', value: k?.upcomingReturns, icon: <ClockCircleOutlined />, color: 'var(--af-kpi-returns)', to: PATHS.allocations },
  ];

  return (
    <div>
      {isError && (
        <Alert type="error" showIcon style={{ marginBottom: 24 }} message={apiErrorMessage(error)} />
      )}

      <Row gutter={[16, 16]}>
        {tiles.map((t) => (
          <Col key={t.title} xs={24} sm={12} lg={8} xl={6}>
            <KpiCard
              title={t.title}
              value={t.value ?? '—'}
              prefix={t.icon}
              loading={isLoading}
              valueColor={t.color}
              onClick={() => navigate(t.to)}
            />
          </Col>
        ))}
        {/* Overdue is called out separately (danger) per the brief. */}
        <Col xs={24} sm={12} lg={8} xl={6}>
          <KpiCard
            title="Overdue Returns"
            value={k?.overdueReturns ?? '—'}
            prefix={<WarningOutlined />}
            loading={isLoading}
            valueColor="var(--af-danger)"
            onClick={() => navigate(PATHS.allocations)}
          />
        </Col>
      </Row>

      <Divider />

      <Card title="Quick actions" size="small">
        <Space wrap>
          {can(PERMISSION.ASSET_REGISTER) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(PATHS.assets)}>
              Register asset
            </Button>
          )}
          {can(PERMISSION.BOOKING_CREATE) && (
            <Button icon={<ScheduleOutlined />} onClick={() => navigate(PATHS.bookings)}>
              New booking
            </Button>
          )}
          {can(PERMISSION.MAINTENANCE_RAISE) && (
            <Button icon={<ToolOutlined />} onClick={() => navigate(PATHS.maintenance)}>
              Raise maintenance
            </Button>
          )}
        </Space>
      </Card>

      <Divider />

      <Card title="Recent activity" size="small">
        {activityLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : activity.length === 0 ? (
          <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <Timeline
              items={activity.slice((actPage - 1) * ACT_PAGE_SIZE, actPage * ACT_PAGE_SIZE).map((a) => {
                const meta = ACTIVITY[a.action] ?? { label: a.action, color: 'gray' };
                const subject = a.assetTag ? `${a.assetName ? a.assetName + ' ' : ''}${a.assetTag}`.trim() : null;
                return {
                  color: meta.color,
                  children: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <span>
                        {subject && <Typography.Text strong>{subject}</Typography.Text>}
                        {subject ? ' — ' : ''}
                        {meta.label}
                        {a.actorName && <Typography.Text type="secondary"> · {a.actorName}</Typography.Text>}
                      </span>
                      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {dayjs(a.createdAt).fromNow()}
                      </Typography.Text>
                    </div>
                  ),
                };
              })}
            />
            {activity.length > ACT_PAGE_SIZE && (
              <Pagination
                align="end"
                size="small"
                current={actPage}
                pageSize={ACT_PAGE_SIZE}
                total={activity.length}
                onChange={setActPage}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
