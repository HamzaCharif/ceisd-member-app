'use client';
// /admin-web/components/charts/StageBarChart.tsx
// Members per journey stage. One hue, four tints — stage order reads as depth.

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface DataPoint { stage: string; count: number; }
interface Props { data: DataPoint[]; }

const STAGE_TINT: Record<string, string> = {
  SPARK: '#A9D9C6',
  SHAPE: '#6DBFA1',
  SCALE: '#1F8F6C',
  MENTOR: '#145C46',
};
const STAGE_LABEL: Record<string, string> = { SPARK: 'Spark', SHAPE: 'Shape', SCALE: 'Scale', MENTOR: 'Mentor' };

export default function StageBarChart({ data }: Props) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-sm text-ink-4">No stage data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="#E6E2D9" />
        <XAxis dataKey="stage" tickFormatter={(s) => STAGE_LABEL[s] ?? s} tick={{ fontSize: 12, fill: '#3B4763' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#6E7891' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'rgba(31,143,108,0.06)' }} contentStyle={{ borderRadius: 10, border: '1px solid #E6E2D9', fontSize: 12, background: '#FDFCFA' }} formatter={(v) => [v, 'Members']} labelFormatter={(l) => STAGE_LABEL[String(l)] ?? l} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((e) => <Cell key={e.stage} fill={STAGE_TINT[e.stage] ?? '#1F8F6C'} />)}
          <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#3B4763', fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
