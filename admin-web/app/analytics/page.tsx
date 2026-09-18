'use client';
// /admin-web/app/analytics/page.tsx
// Full analytics page with all charts and export buttons.

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import MetricCard from '@/components/MetricCard';
import AttendanceLineChart from '@/components/charts/AttendanceLineChart';
import StageBarChart from '@/components/charts/StageBarChart';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import TaskCompletionBarChart from '@/components/charts/TaskCompletionBarChart';
import EngagementPieChart from '@/components/charts/EngagementPieChart';
import { adminApi } from '@/lib/api';
import { Download, FileText } from 'lucide-react';

interface OverviewData {
  activeMembers: number;
  eventAttendanceRate: number;
  taskCompletionRate: number;
  matchSuccessRate: number;
}

interface TimePoint { date: string; count: number; }
interface StagePoint { stage: string; count: number; }
interface SkillPoint { skill: string; averageRating: number; memberCount: number; }

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [attendance, setAttendance] = useState<TimePoint[]>([]);
  const [stages, setStages] = useState<StagePoint[]>([]);
  const [skills, setSkills] = useState<SkillPoint[]>([]);
  const [insights, setInsights] = useState<{ summary?: { activeLastMonth: number; inactiveCount: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [ov, at, st, sk, ins] = await Promise.all([
          adminApi.get<{ data: OverviewData }>('/api/admin/analytics/overview'),
          adminApi.get<{ data: TimePoint[] }>('/api/admin/analytics/events-over-time'),
          adminApi.get<{ data: StagePoint[] }>('/api/admin/analytics/engagement-by-stage'),
          adminApi.get<{ data: SkillPoint[] }>('/api/admin/analytics/skill-distribution'),
          adminApi.get<{ data: typeof insights }>('/api/admin/ai-insights').catch(() => ({ data: { data: null } })),
        ]);
        setOverview(ov.data.data);
        setAttendance(Array.isArray(at.data.data) ? at.data.data : []);
        setStages(Array.isArray(st.data.data) ? st.data.data : []);
        setSkills(Array.isArray(sk.data.data) ? sk.data.data : []);
        setInsights(ins.data.data);
      } catch {
        // show partial data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleExport(type: 'csv' | 'pdf') {
    setExporting(type);
    try {
      const res = await adminApi.get(`/api/admin/export/${type}`, { responseType: 'blob' });
      const blob = new Blob([res.data as BlobPart], {
        type: type === 'csv' ? 'text/csv' : 'text/html',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ceisd-report-${Date.now()}.${type === 'pdf' ? 'html' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert(`Failed to export ${type.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <AdminLayout title="Analytics" subtitle="Platform engagement metrics and distributions">
      {/* Export row */}
      <div className="flex gap-3 mb-6 justify-end">
        <button
          onClick={() => handleExport('csv')}
          disabled={!!exporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-[#1A1A1A]"
        >
          <Download size={15} />
          {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={!!exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white text-sm font-semibold rounded-lg hover:bg-[#157A5A] disabled:opacity-50 transition-colors"
        >
          <FileText size={15} />
          {exporting === 'pdf' ? 'Exporting...' : 'Export PDF Report'}
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard label="Active Members" value={loading ? '—' : (overview?.activeMembers ?? 0)} color="navy" />
        <MetricCard label="Attendance Rate" value={loading ? '—' : `${overview?.eventAttendanceRate ?? 0}%`} />
        <MetricCard label="Task Completion" value={loading ? '—' : `${overview?.taskCompletionRate ?? 0}%`} />
        <MetricCard label="Match Success" value={loading ? '—' : `${overview?.matchSuccessRate ?? 0}%`} color="amber" />
      </div>

      {/* Charts grid — row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Attendance Over Time (Weekly)</h2>
          <AttendanceLineChart data={attendance} />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Members by Journey Stage</h2>
          <StageBarChart data={stages} />
        </div>
      </div>

      {/* Charts grid — row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Member Engagement (Last 30 Days)</h2>
          <EngagementPieChart
            active={insights?.summary?.activeLastMonth ?? 0}
            inactive={insights?.summary?.inactiveCount ?? 0}
          />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Task Completions (Weekly)</h2>
          <TaskCompletionBarChart data={attendance} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
          Skill Ratings Distribution (avg across all members)
        </h2>
        <SkillRadarChart data={skills} />

        {/* Skill table */}
        {skills.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-3 py-2">Skill</th>
                  <th className="text-right px-3 py-2">Avg Rating</th>
                  <th className="text-right px-3 py-2">Members</th>
                  <th className="text-left px-3 py-2 pl-4">Bar</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s.skill} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-3 text-gray-700">{s.skill}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${s.averageRating < 2.5 ? 'text-red-600' : 'text-[#1D9E75]'}`}>
                      {s.averageRating.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500">{s.memberCount}</td>
                    <td className="py-2 px-3 pl-4">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${s.averageRating < 2.5 ? 'bg-red-400' : 'bg-[#1D9E75]'}`}
                          style={{ width: `${(s.averageRating / 5) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
