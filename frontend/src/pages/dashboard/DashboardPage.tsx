import { Row, Col, Alert } from 'antd';
import {
  LaptopOutlined,
  SwapOutlined,
  ToolOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageHeader, KpiCard } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';

// Placeholder dashboard — KPI tiles are wired to live data in step B9/F3.
const KPIS = [
  { title: 'Assets Available', icon: <LaptopOutlined /> },
  { title: 'Assets Allocated', icon: <SwapOutlined /> },
  { title: 'Maintenance Today', icon: <ToolOutlined /> },
  { title: 'Active Bookings', icon: <CalendarOutlined /> },
  { title: 'Upcoming Returns', icon: <ClockCircleOutlined /> },
  { title: 'Overdue Returns', icon: <WarningOutlined />, color: '#cf1322' },
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
