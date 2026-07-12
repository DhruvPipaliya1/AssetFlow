import { Card } from 'antd';
import { Heatmap } from '@ant-design/plots';
import type { BookingHeatmapDataPoint } from '../../../types/models';

interface BookingHeatmapChartProps {
  data: BookingHeatmapDataPoint[];
}

export function BookingHeatmapChart({ data }: BookingHeatmapChartProps) {
  if (!data?.length) {
    return (
      <Card title="Booking Heatmap (Peak Hours)">
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No booking data available
        </div>
      </Card>
    );
  }

  // Transform data for heatmap
  const heatmapData = data.map((d) => ({
    date: d.date,
    hour: d.hour.toString().padStart(2, '0') + ':00',
    count: d.count,
  }));

  return (
    <Card title="Booking Heatmap (Peak Hours)">
      <div style={{ height: 350 }}>
        <Heatmap
          data={heatmapData}
          xField="date"
          yField="hour"
          colorField="count"
          meta={{
            date: { alias: 'Date' },
            hour: { alias: 'Hour' },
            count: { alias: 'Bookings' },
          }}
          color={['#f0f0f0', '#1890ff', '#096dd9', '#003a8c']}
          tooltip={{
            title: 'date',
            items: [
              (d: Record<string, unknown>) => ({ name: 'Hour', value: d.hour }),
              (d: Record<string, unknown>) => ({ name: 'Bookings', value: d.count }),
            ],
          }}
          label={false}
          axis={{
            x: { tickCount: 7 },
            y: { reverse: true },
          }}
        />
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        <strong>Note:</strong> Darker cells indicate more bookings. Hover for exact counts.
        X-axis = Date, Y-axis = Hour of day (0-23).
      </div>
    </Card>
  );
}