import { Tabs } from 'antd';
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

const PRIMARY = 'var(--af-primary)';

// Recharts reads CSS var colors fine via computed style; fall back to hex where
// a literal is needed for stacked series.
const SERIES = {
  available: '#52c41a',
  allocated: '#1677ff',
  underMaintenance: '#faad14',
  lost: '#ff4d4f',
};

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
          key: 'heatmap',
          label: 'Booking peaks',
          children: (
            <ReportCard name="booking-heatmap" title="Bookings by hour of day">
              {(rows) => (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" fontSize={11} interval={1} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="bookings" name="Bookings" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>
          ),
        },
      ]}
    />
  );
}
