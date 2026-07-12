import { Row, Col, Alert } from 'antd';
import {
  LaptopOutlined,
  SwapOutlined,
  ToolOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import { PageHeader, KpiCard } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';

// Placeholder dashboard — KPI tiles are wired to live data in step B9/F3.
// Colors come from the design system KPI tokens (styles/variables.css).
const KPIS = [
  { title: 'Assets Available', icon: <LaptopOutlined />, color: 'var(--af-kpi-available)' },
  { title: 'Assets Allocated', icon: <SwapOutlined />, color: 'var(--af-kpi-allocated)' },
  { title: 'Maintenance Today', icon: <ToolOutlined />, color: 'var(--af-kpi-maintenance)' },
  { title: 'Active Bookings', icon: <CalendarOutlined />, color: 'var(--af-kpi-bookings)' },
  { title: 'Pending Transfers', icon: <RetweetOutlined />, color: 'var(--af-kpi-transfers)' },
  { title: 'Upcoming Returns', icon: <ClockCircleOutlined />, color: 'var(--af-kpi-returns)' },
  { title: 'Overdue Returns', icon: <WarningOutlined />, color: 'var(--af-kpi-overdue)' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] ?? ''}`} subtitle="Operational snapshot" />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message="Dashboard scaffold ready — live KPI data is wired once the backend dashboard module (B9) lands."
      />
      <Row gutter={[16, 16]}>
        {KPIS.map((k) => (
          <Col key={k.title} xs={24} sm={12} lg={8} xl={4}>
            <KpiCard title={k.title} value="—" prefix={k.icon} valueColor={k.color} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
