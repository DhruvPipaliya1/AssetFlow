import { Row, Col, Alert, Button, Space, Card, Divider } from 'antd';
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
import { KpiCard } from '../../components/common';
import { dashboardService } from '../../services/dashboard.service';
import { apiErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSION } from '../../types/permissions';
import { PATHS } from '../../routes/paths';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.kpis,
  });
  const k = data?.kpis;

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
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description={
          data ? `Showing ${data.scope === 'ORG' ? 'organization-wide' : 'your department'} figures.` : undefined
        }
      />

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
    </div>
  );
}
