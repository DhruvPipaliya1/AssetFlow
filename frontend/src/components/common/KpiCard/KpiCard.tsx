import type { ReactNode } from 'react';
import { Card, Statistic } from 'antd';

export interface KpiCardProps {
  title: ReactNode;
  value: number | string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  loading?: boolean;
  valueColor?: string;
  onClick?: () => void;
}

// Reusable dashboard KPI tile.
export function KpiCard({ title, value, prefix, suffix, loading, valueColor, onClick }: KpiCardProps) {
  return (
    <Card hoverable={!!onClick} onClick={onClick} styles={{ body: { padding: 20 } }}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        loading={loading}
        valueStyle={valueColor ? { color: valueColor } : undefined}
      />
    </Card>
  );
}
