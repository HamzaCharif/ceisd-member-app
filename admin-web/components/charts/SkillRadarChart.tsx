'use client';
// /admin-web/components/charts/SkillRadarChart.tsx
// Radar chart: average skill ratings across membership.

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

interface DataPoint {
  skill: string;
  averageRating: number;
}

interface Props {
  data: DataPoint[];
}

export default function SkillRadarChart({ data }: Props) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No skill data yet
      </div>
    );
  }

  // Radar works best with ≤12 items; take top 12 by memberCount
  const radarData = data.slice(0, 12).map((d) => ({
    skill: d.skill.length > 14 ? d.skill.slice(0, 13) + '…' : d.skill,
    rating: d.averageRating,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#6B7280' }} />
        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
        />
        <Radar
          name="Avg Rating"
          dataKey="rating"
          stroke="#1D9E75"
          fill="#1D9E75"
          fillOpacity={0.25}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
