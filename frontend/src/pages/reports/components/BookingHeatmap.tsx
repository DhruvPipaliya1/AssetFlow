import { Tooltip, Typography } from 'antd';
import type { ReportRow } from '../../../types/models';

// Renders the day×hour booking heatmap (168 cells) from the long-format rows the
// backend returns: { day, dayLabel, hour, hourLabel, bookings }. Cell opacity
// scales with booking volume relative to the busiest cell.
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function BookingHeatmap({ rows }: { rows: ReportRow[] }) {
  // grid[day][hour] = count
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  let max = 0;
  for (const r of rows) {
    const d = Number(r.day);
    const h = Number(r.hour);
    const n = Number(r.bookings);
    if (d >= 0 && d < 7 && h >= 0 && h < 24) {
      grid[d][h] = n;
      if (n > max) max = n;
    }
  }

  const cell = (n: number) => {
    const alpha = max === 0 ? 0 : Math.max(n === 0 ? 0 : 0.12, n / max);
    return {
      background: n === 0 ? 'var(--af-fill, rgba(0,0,0,0.03))' : `rgba(113,75,103,${alpha.toFixed(2)})`,
      color: alpha > 0.6 ? '#fff' : 'inherit',
    };
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontSize: 11 }}>
        <thead>
          <tr>
            <th />
            {HOURS.map((h) => (
              <th key={h} style={{ padding: '2px 4px', fontWeight: 400, color: 'var(--af-text-secondary, #888)' }}>
                {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, d) => (
            <tr key={day}>
              <td style={{ paddingRight: 8, textAlign: 'right', fontWeight: 500, whiteSpace: 'nowrap' }}>{day}</td>
              {HOURS.map((h) => {
                const n = grid[d][h];
                return (
                  <Tooltip key={h} title={`${day} ${String(h).padStart(2, '0')}:00 — ${n} booking${n === 1 ? '' : 's'}`}>
                    <td
                      style={{
                        width: 22,
                        height: 22,
                        textAlign: 'center',
                        borderRadius: 4,
                        cursor: 'default',
                        ...cell(n),
                      }}
                    >
                      {n || ''}
                    </td>
                  </Tooltip>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
        Darker cells are busier booking windows (UTC). Peak: {max} booking{max === 1 ? '' : 's'} in a single hour.
      </Typography.Text>
    </div>
  );
}
