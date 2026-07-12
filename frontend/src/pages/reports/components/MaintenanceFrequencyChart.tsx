import { Card } from 'antd';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { MaintenanceFrequencyDataPoint } from '../../../types/models';

interface MaintenanceFrequencyChartProps {
  data: MaintenanceFrequencyDataPoint[];
  loading?: boolean;
}

export function MaintenanceFrequencyChart({ data, loading }: MaintenanceFrequencyChartProps) {
  if (loading) {
    return (
      <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Loading...</span>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <Card title="Maintenance Frequency by Category">
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No maintenance data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Maintenance Frequency by Category">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="category"
            width={120}
            tick={{ fontSize: 11 }}
          />
          // @ts-expect-error - Recharts tooltip formatter type issue
          <Tooltip
            formatter={(value: unknown, name: any) => [
              name === 'count' ? 'Maintenance Requests' : 'Avg Duration (days)',
              value as number,
            ]}
          />
          <Legend />
          <Bar
            dataKey="count"
            name="Maintenance Requests"
            fill="#1890ff"
            radius={[0, 4, 4, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        <strong>Note:</strong> Bar length shows number of maintenance requests per category.
        Average duration is shown in tooltips.
      </div>
    </Card>
  );
}