import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Card, Skeleton } from 'antd';
import './KpiCard.css';

export interface KpiCardProps {
  title: ReactNode;
  value: number | string;
  prefix?: ReactNode; // icon
  suffix?: ReactNode;
  loading?: boolean;
  valueColor?: string; // CSS colour or var()
  onClick?: () => void;
}

// Animate a number from 0 → target with an ease-out curve.
function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!Number.isFinite(target)) {
      setVal(0);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

// Animated dashboard KPI tile: tinted icon chip, count-up value, hover lift.
export function KpiCard({ title, value, prefix, suffix, loading, valueColor, onClick }: KpiCardProps) {
  const numeric = typeof value === 'number';
  const count = useCountUp(numeric ? value : 0);
  const color = valueColor ?? 'var(--af-primary)';
  const display = numeric ? count : value;

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className="af-kpi"
      style={{ borderInlineStart: `3px solid ${color}` }}
      styles={{ body: { padding: 18 } }}
    >
      <div className="af-kpi__row">
        <div
          className="af-kpi__icon"
          style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          {prefix}
        </div>
        <div className="af-kpi__body">
          {loading ? (
            <Skeleton.Button active size="small" style={{ width: 64, height: 30 }} />
          ) : (
            <div className="af-kpi__value" style={{ color }}>
              {display}
              {suffix && <span className="af-kpi__suffix">{suffix}</span>}
            </div>
          )}
          <div className="af-kpi__title">{title}</div>
        </div>
      </div>
    </Card>
  );
}
