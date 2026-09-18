'use client';
// /admin-web/components/charts/EngagementPieChart.tsx
// Donut / pie chart: active vs inactive members.

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface Props {
  active: number;
  inactive: number;
}

const COLORS = ['#1D9E75', '#E5E7EB'];

export default function EngagementPieChart({ active, inactive }: Props) {
  const data = [
    { name: 'Active (30d)', value: active },
    { name: 'Inactive', value: inactive },
  ];

  if (active + inactive === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No member data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
          formatter={(value: number, name: string) => [`${value} members`, name]}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={(value: string) => (
            <span style={{ fontSize: 12, color: '#6B7280' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
