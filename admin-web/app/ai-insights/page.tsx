'use client';
// /admin-web/app/ai-insights/page.tsx
// AI-driven insights: low engagement members, top match pairs, skill gaps.

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import MetricCard from '@/components/MetricCard';
import { adminApi } from '@/lib/api';
import { AlertTriangle, CheckCircle, ArrowLeftRight, Loader2 } from 'lucide-react';

interface LowEngagementMember {
  id: string;
  name: string;
  email: string;
  college: string;
  stage: string;
  totalPoints: number;
  eventsAttended: number;
  tasksCompleted: number;
}

interface MatchPair {
  matchId: string;
  user1: { id: string; name: string; email: string; college: string };
  user2: { id: string; name: string; email: string; college: string };
  compatibilityScore: number;
  explanation: string;
}

interface SkillGap {
  skill: string;
  averageRating: number;
  memberCount: number;
  isGap: boolean;
}

interface InsightsData {
  lowEngagementMembers: LowEngagementMember[];
  topMatchPairs: MatchPair[];
  skillGaps: SkillGap[];
  stageDistribution: Record<string, number>;
  summary: {
    totalMembers: number;
    activeLastMonth: number;
    inactiveCount: number;
    connectedMatchCount: number;
    identifiedSkillGaps: number;
  };
}

const STAGE_COLORS: Record<string, string> = {
  SPARK: 'bg-amber-100 text-amber-700',
  SHAPE: 'bg-[#378ADD]/10 text-[#378ADD]',
  SCALE: 'bg-[#1D9E75]/10 text-[#1D9E75]',
  MENTOR: 'bg-amber-50 text-amber-500',
};

export default function AiInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'engagement' | 'matches' | 'skills'>('engagement');

  useEffect(() => {
    adminApi
      .get<{ data: InsightsData }>('/api/admin/ai-insights')
      .then((r) => {
        const d = r.data.data;
        if (d && typeof d === 'object' && 'summary' in d) setData(d as InsightsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="AI Insights" subtitle="Data-driven recommendations for member engagement">
      {loading ? (
        <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100">
          <Loader2 size={28} className="text-[#1D9E75] animate-spin" />
          <span className="text-sm text-gray-400">Loading insights...</span>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
          Failed to load insights
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Total Members" value={data.summary.totalMembers} color="navy" />
            <MetricCard label="Active (30d)" value={data.summary.activeLastMonth} color="primary" />
            <MetricCard
              label="Inactive Members"
              value={data.summary.inactiveCount}
              color="red"
              subtitle="No activity in 30 days"
            />
            <MetricCard label="Connected Matches" value={data.summary.connectedMatchCount} color="primary" />
            <MetricCard
              label="Skill Gaps"
              value={data.summary.identifiedSkillGaps}
              color="amber"
              subtitle="Avg rating < 2.5"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            {(
              [
                { key: 'engagement', label: 'Low Engagement' },
                { key: 'matches', label: 'Top Matches' },
                { key: 'skills', label: 'Skill Gaps' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Low Engagement */}
          {activeTab === 'engagement' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  Members with no event attendance or task completion in the last 30 days, sorted by lowest points.
                  Consider reaching out or suggesting relevant events.
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Member</th>
                    <th className="text-left px-4 py-3">College</th>
                    <th className="text-left px-4 py-3">Stage</th>
                    <th className="text-right px-4 py-3">Points</th>
                    <th className="text-right px-4 py-3">Events</th>
                    <th className="text-right px-4 py-3">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowEngagementMembers.map((m) => (
                    <tr key={m.id} className="border-t border-gray-100 hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1A1A1A]">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.college || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STAGE_COLORS[m.stage] ?? ''}`}>
                          {m.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{m.totalPoints}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{m.eventsAttended}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{m.tasksCompleted}</td>
                    </tr>
                  ))}
                  {data.lowEngagementMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        All members have been active recently
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: Top Matches */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {data.topMatchPairs.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
                  No connected matches yet
                </div>
              ) : (
                data.topMatchPairs.map((match) => (
                  <div
                    key={match.matchId}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start justify-between gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* User 1 */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#1A2744] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {match.user1.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#1A1A1A]">{match.user1.name}</div>
                            <div className="text-xs text-gray-400">{match.user1.college}</div>
                          </div>
                        </div>
                        <ArrowLeftRight size={16} className="text-gray-300 shrink-0" />
                        {/* User 2 */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {match.user2.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#1A1A1A]">{match.user2.name}</div>
                            <div className="text-xs text-gray-400">{match.user2.college}</div>
                          </div>
                        </div>
                      </div>
                      {match.explanation && (
                        <p className="text-xs text-gray-500 italic">{match.explanation}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-[#1D9E75]">{Math.round(match.compatibilityScore)}%</div>
                      <div className="text-xs text-gray-400">compatibility</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Skill Gaps */}
          {activeTab === 'skills' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  Skills with average rating below 2.5 are flagged as gaps — consider scheduling targeted workshops.
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Skill</th>
                    <th className="text-right px-4 py-3">Avg Rating</th>
                    <th className="text-right px-4 py-3">Members rated</th>
                    <th className="text-left px-4 py-3 pl-8">Distribution</th>
                    <th className="text-center px-4 py-3">Gap?</th>
                  </tr>
                </thead>
                <tbody>
                  {data.skillGaps.map((s) => (
                    <tr
                      key={s.skill}
                      className={`border-t border-gray-100 transition-colors ${s.isGap ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{s.skill}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${s.isGap ? 'text-red-600' : 'text-[#1D9E75]'}`}>
                        {s.averageRating.toFixed(1)} / 5
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{s.memberCount}</td>
                      <td className="px-4 py-3 pl-8">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${s.isGap ? 'bg-red-400' : 'bg-[#1D9E75]'}`}
                            style={{ width: `${(s.averageRating / 5) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.isGap ? (
                          <AlertTriangle size={16} className="text-red-500 mx-auto" />
                        ) : (
                          <CheckCircle size={16} className="text-[#1D9E75] mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.skillGaps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                        No skill data available yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
