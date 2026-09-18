'use client';
// /admin-web/components/charts/AttendanceLineChart.tsx
// RSVPs (thin, dashed) vs attendances (solid area) per week. The gap between
// the two lines IS the no-show problem — no legend prose needed.

import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

interface DataPoint { date: string; count: number; rsvps?: number; }
interface Props { data: DataPoint[]; }

function fmtWeek(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}

export default function AttendanceLineChart({ data }: Props) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-sm text-ink-4">No attendance yet</div>;
  }
  const allZero = data.every((d) => d.count === 0 && !(d.rsvps ?? 0));

  return (
    <div className="relative">
      {allZero ? (
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center text-sm text-ink-4">
          No attendance in the last {data.length} weeks
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F8F6C" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#1F8F6C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E6E2D9" />
          <XAxis dataKey="date" tickFormatter={fmtWeek} tick={{ fontSize: 11, fill: '#6E7891' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: '#6E7891' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: '#D3CEC2' }}
            contentStyle={{ borderRadius: 10, border: '1px solid #E6E2D9', fontSize: 12, background: '#FDFCFA', boxShadow: '0 8px 24px -12px rgba(20,33,61,0.25)' }}
            labelFormatter={(l) => `Week of ${fmtWeek(String(l))}`}
          />
          <Area type="monotone" dataKey="count" name="Attended" stroke="#1F8F6C" strokeWidth={2} fill="url(#att)" dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="rsvps" name="RSVPs" stroke="#14213D" strokeWidth={1.25} strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
