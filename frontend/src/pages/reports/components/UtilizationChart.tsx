import { Card } from 'antd';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { UtilizationDataPoint } from '../../../types/models';

interface UtilizationChartProps {
  data: UtilizationDataPoint[];
  loading?: boolean;
}

export function UtilizationChart({ data, loading }: UtilizationChartProps) {
  if (loading) {
    return (
      <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Loading...</span>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <Card title="Asset Utilization Over Time">
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No utilization data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Asset Utilization Over Time">
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="allocatedColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="availableColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${value}`}
          />
          // @ts-ignore - Recharts tooltip formatter type issue
          <Tooltip
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            formatter={(value: any, name: string | undefined) => [
              name === 'allocated' ? 'Allocated' : name === 'available' ? 'Available' : 'Utilization Rate',
              name === 'utilizationRate' ? `${(value * 100).toFixed(1)}%` : value,
            ]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="allocated"
            name="Allocated"
            stroke="#1890ff"
            fillOpacity={1}
            fill="url(#allocatedColor)"
          />
          <Area
            type="monotone"
            dataKey="available"
            name="Available"
            stroke="#52c41a"
            fillOpacity={1}
            fill="url(#availableColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        <strong>Note:</strong> Utilization rate = Allocated / Total Assets.
        Data points represent daily snapshots.
      </div>
    </Card>
  );
}