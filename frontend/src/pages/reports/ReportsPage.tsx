import { Tabs, Table, Tag, Typography, Empty, type TableProps } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ReportCard } from './components/ReportCard';
import { BookingHeatmap } from './components/BookingHeatmap';
import { StatusTag } from '../../components/common';
import type { ReportRow } from '../../types/models';

const PRIMARY = 'var(--af-primary)';

const SERIES = {
  available: '#52c41a',
  allocated: '#1677ff',
  underMaintenance: '#faad14',
  lost: '#ff4d4f',
};

const ALERT_COLOR: Record<string, string> = {
  'Nearing retirement': 'volcano',
  'Poor condition': 'orange',
  'Frequent maintenance': 'gold',
  'Warranty expired': 'red',
  'Currently in maintenance': 'blue',
};

const num = (v: ReportRow[string]) => Number(v ?? 0);

// ── Most-used vs idle (derived client-side from the utilization dataset) ──
type ScoredRow = ReportRow & { usage: number };
function MostUsedIdle({ rows }: { rows: ReportRow[] }) {
  const scored: ScoredRow[] = rows.map((r) => ({ ...r, usage: num(r.timesAllocated) + num(r.timesBooked) }));
  const mostUsed = [...scored].filter((r) => r.usage > 0).sort((a, b) => b.usage - a.usage).slice(0, 10);
  const idle = scored.filter((r) => r.usage === 0);

  const usedCols: TableProps<ScoredRow>['columns'] = [
    { title: 'Tag', dataIndex: 'assetTag', key: 'tag' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Allocations', dataIndex: 'timesAllocated', key: 'a', align: 'right' },
    { title: 'Bookings', dataIndex: 'timesBooked', key: 'b', align: 'right' },
    { title: 'Total use', dataIndex: 'usage', key: 'u', align: 'right', render: (v) => <strong>{v}</strong> },
  ];
  const idleCols: TableProps<ScoredRow>['columns'] = [
    { title: 'Tag', dataIndex: 'assetTag', key: 'tag' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Department', dataIndex: 'department', key: 'dept' },
    { title: 'Status', key: 'status', render: (_, r) => <StatusTag status={String(r.status)} /> },
  ];

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div>
        <Typography.Title level={5} style={{ marginTop: 0 }}>Most-used assets</Typography.Title>
        <Table rowKey={(r) => String(r.assetTag)} size="small" columns={usedCols} dataSource={mostUsed}
          pagination={false} locale={{ emptyText: <Empty description="No usage yet" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>
      <div>
        <Typography.Title level={5}>Idle assets <Tag>{idle.length}</Tag></Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
          Never allocated or booked — candidates for redeployment.
        </Typography.Paragraph>
        <Table rowKey={(r) => String(r.assetTag)} size="small" columns={idleCols} dataSource={idle}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty description="No idle assets" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>
    </div>
  );
}

// ── Lifecycle alerts: due for maintenance / nearing retirement ──
function LifecycleTable({ rows }: { rows: ReportRow[] }) {
  const columns: TableProps<ReportRow>['columns'] = [
    { title: 'Tag', dataIndex: 'assetTag', key: 'tag' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Status', key: 'status', render: (_, r) => <StatusTag status={String(r.status)} /> },
    { title: 'Age', dataIndex: 'ageYears', key: 'age', align: 'right', render: (v) => (v === '' ? '—' : `${v}y`) },
    { title: 'Condition', dataIndex: 'condition', key: 'cond', render: (v) => String(v) || '—' },
    { title: 'Maint.', dataIndex: 'maintenanceCount', key: 'm', align: 'right' },
    {
      title: 'Alerts',
      key: 'alerts',
      render: (_, r) =>
        String(r.alerts)
          .split('; ')
          .map((a) => <Tag key={a} color={ALERT_COLOR[a] ?? 'default'}>{a}</Tag>),
    },
  ];
  return (
    <Table rowKey={(r) => String(r.assetTag)} size="small" columns={columns} dataSource={rows}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      locale={{ emptyText: <Empty description="No assets need attention" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
  );
}

export default function ReportsPage() {
  return (
    <Tabs
      defaultActiveKey="utilization"
      items={[
        {
          key: 'utilization',
          label: 'Utilization',
          children: (
            <ReportCard name="utilization" title="Asset utilization (times allocated)">
              {(rows) => (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={rows.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="assetTag" angle={-35} textAnchor="end" height={70} interval={0} fontSize={11} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="timesAllocated" name="Allocations" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="timesBooked" name="Bookings" fill="#722ed1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>
          ),
        },
        {
          key: 'most-idle',
          label: 'Most-used vs idle',
          children: (
            <ReportCard name="utilization" title="Most-used vs idle assets">
              {(rows) => <MostUsedIdle rows={rows} />}
            </ReportCard>
          ),
        },
        {
          key: 'maintenance',
          label: 'Maintenance frequency',
          children: (
            <ReportCard name="maintenance-frequency" title="Assets by maintenance count">
              {(rows) => (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={rows.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="assetTag" angle={-35} textAnchor="end" height={70} interval={0} fontSize={11} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="maintenanceCount" name="Requests" fill="#faad14" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>
          ),
        },
        {
          key: 'maintenance-category',
          label: 'Maintenance by category',
          children: (
            <ReportCard name="maintenance-by-category" title="Maintenance requests by category">
              {(rows) => (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={rows} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="category" width={120} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="maintenanceCount" name="Requests" fill="#eb2f96" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>
          ),
        },
        {
          key: 'department',
          label: 'Department summary',
          children: (
            <ReportCard name="department-summary" title="Assets by department & status">
              {(rows) => (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" fontSize={12} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="available" stackId="a" name="Available" fill={SERIES.available} />
                    <Bar dataKey="allocated" stackId="a" name="Allocated" fill={SERIES.allocated} />
                    <Bar dataKey="underMaintenance" stackId="a" name="Maintenance" fill={SERIES.underMaintenance} />
                    <Bar dataKey="lost" stackId="a" name="Lost" fill={SERIES.lost} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>
          ),
        },
        {
          key: 'lifecycle',
          label: 'Due / retiring',
          children: (
            <ReportCard name="lifecycle-alerts" title="Assets due for maintenance or nearing retirement">
              {(rows) => <LifecycleTable rows={rows} />}
            </ReportCard>
          ),
        },
        {
          key: 'heatmap',
          label: 'Booking peaks',
          children: (
            <ReportCard name="booking-heatmap" title="Booking heatmap — day × hour (peak windows)">
              {(rows) => <BookingHeatmap rows={rows} />}
            </ReportCard>
          ),
        },
      ]}
    />
  );
}
