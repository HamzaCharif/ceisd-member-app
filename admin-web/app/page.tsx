'use client';
// /admin-web/app/page.tsx
// Overview. Every headline number carries its fraction so accuracy is visible.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import MetricCard from '@/components/MetricCard';
import AttendanceLineChart from '@/components/charts/AttendanceLineChart';
import StageBarChart from '@/components/charts/StageBarChart';
import { adminApi } from '@/lib/api';
import { ArrowUpRight, Download } from 'lucide-react';

interface Overview {
  totalMembers: number; activeMembers: number; activeMemberRate: number;
  upcomingEvents: number; pastEvents: number; totalRsvps: number; totalAttendances: number; eventAttendanceRate: number;
  tasksAssigned: number; tasksCompleted: number; taskCompletionRate: number; pendingApprovals: number;
  totalMatches: number; invitationsSent: number; connectedMatches: number; matchSuccessRate: number;
  totalPosts: number; activeWindowDays: number;
}
interface TimePoint { date: string; count: number; rsvps?: number; }
interface StagePoint { stage: string; count: number; }
interface EventRow { id: string; title: string; dateTime: string; totalSeats: number; rsvps: number; attendances: number; fillRate: number; showUpRate: number; }
interface TopMember { rank: number; id: string; name: string; college?: string | null; stage: string; totalPoints: number; eventsAttended: number; tasksCompleted: number; posts: number; }

const STAGE_LABEL: Record<string, string> = { SPARK: 'Spark', SHAPE: 'Shape', SCALE: 'Scale', MENTOR: 'Mentor' };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}
function pctTone(p: number): 'green' | 'amber' | 'red' {
  return p >= 70 ? 'green' : p >= 40 ? 'amber' : 'red';
}

export default function DashboardPage() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [attendance, setAttendance] = useState<TimePoint[]>([]);
  const [stages, setStages] = useState<StagePoint[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [top, setTop] = useState<TopMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [o, a, s, e, t] = await Promise.all([
          adminApi.get<{ data: Overview }>('/api/admin/analytics/overview'),
          adminApi.get<{ data: TimePoint[] }>('/api/admin/analytics/events-over-time'),
          adminApi.get<{ data: StagePoint[] }>('/api/admin/analytics/engagement-by-stage'),
          adminApi.get<{ data: EventRow[] }>('/api/admin/analytics/events'),
          adminApi.get<{ data: TopMember[] }>('/api/admin/analytics/top-members?limit=6'),
        ]);
        setOv(o.data.data); setAttendance(a.data.data); setStages(s.data.data); setEvents(e.data.data); setTop(t.data.data);
      } catch {
        setError("Couldn't reach the API. Check that it's running and NEXT_PUBLIC_API_URL is set.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AdminLayout
      eyebrow={today}
      title="Overview"
      subtitle="Live figures from the member app. Each percentage shows the exact count behind it."
      actions={
        <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/admin/export/csv`} className="btn btn-ghost" target="_blank" rel="noreferrer">
          <Download size={15} /> Export CSV
        </a>
      }
    >
      {error ? <div className="mb-6 rounded-xl border border-red/30 bg-red-soft px-4 py-3 text-sm text-red">{error}</div> : null}

      {/* Headline metrics */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active members" delayClass="rise-1" loading={loading}
          value={ov?.activeMembers ?? 0}
          fraction={ov ? `of ${ov.totalMembers} registered · ${ov.activeMemberRate}%` : undefined}
          hint={`Did anything in the last ${ov?.activeWindowDays ?? 30} days`}
        />
        <MetricCard
          label="Show-up rate" delayClass="rise-2" loading={loading} tone={ov ? pctTone(ov.eventAttendanceRate) : 'ink'}
          value={ov ? `${ov.eventAttendanceRate}%` : '—'}
          fraction={ov ? `${ov.totalAttendances} attended · ${ov.totalRsvps} RSVPs` : undefined}
          hint="RSVPs who scanned in (walk-ins excluded from the rate)"
        />
        <MetricCard
          label="Task completion" delayClass="rise-3" loading={loading} tone={ov ? pctTone(ov.taskCompletionRate) : 'ink'}
          value={ov ? `${ov.taskCompletionRate}%` : '—'}
          fraction={ov ? `${ov.tasksCompleted} of ${ov.tasksAssigned} assignments` : undefined}
          hint={ov && ov.pendingApprovals > 0 ? `${ov.pendingApprovals} awaiting your approval` : 'Per member, per task'}
        />
        <MetricCard
          label="Match acceptance" delayClass="rise-4" loading={loading} tone={ov ? pctTone(ov.matchSuccessRate) : 'ink'}
          value={ov ? `${ov.matchSuccessRate}%` : '—'}
          fraction={ov ? `${ov.connectedMatches} accepted of ${ov.invitationsSent} invitations` : undefined}
          hint={ov ? `${ov.totalMatches} AI suggestions generated` : undefined}
        />
      </section>

      {/* Charts */}
      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="ledger rise rise-5 xl:col-span-3">
          <div className="ledger-head">
            <div>
              <div className="font-display text-[18px] font-semibold tracking-tight text-ink">Attendance, last 12 weeks</div>
              <div className="mt-0.5 text-[12px] text-ink-3">Solid: attended · dashed: RSVPs</div>
            </div>
            <Link href="/analytics" className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-ink hover:underline">Analytics <ArrowUpRight size={14} /></Link>
          </div>
          <div className="ledger-body">{loading ? <div className="skeleton h-60" /> : <AttendanceLineChart data={attendance} />}</div>
        </div>
        <div className="ledger rise rise-6 xl:col-span-2">
          <div className="ledger-head">
            <div className="font-display text-[18px] font-semibold tracking-tight text-ink">Members by stage</div>
            <div className="tnum text-[12px] text-ink-3">{ov ? `${ov.totalMembers} total` : ''}</div>
          </div>
          <div className="ledger-body">{loading ? <div className="skeleton h-60" /> : <StageBarChart data={stages} />}</div>
        </div>
      </section>

      {/* Tables */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="ledger rise rise-6 xl:col-span-3">
          <div className="ledger-head">
            <div className="font-display text-[18px] font-semibold tracking-tight text-ink">Events</div>
            <Link href="/events" className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-ink hover:underline">Manage <ArrowUpRight size={14} /></Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-5" />)}</div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-4">No events yet. <Link href="/events" className="font-semibold text-green-ink">Create the first one.</Link></div>
            ) : (
              <table className="ledger-table">
                <thead>
                  <tr><th>Event</th><th>Date</th><th className="num">RSVPs</th><th className="num">Attended</th><th className="num">Fill</th><th className="num">Show-up</th></tr>
                </thead>
                <tbody>
                  {events.slice(0, 8).map((e) => {
                    const past = new Date(e.dateTime).getTime() < Date.now();
                    return (
                      <tr key={e.id}>
                        <td className="font-medium text-ink">{e.title}</td>
                        <td className="tnum text-ink-3">{fmtDate(e.dateTime)}{past ? '' : <span className="ml-2 rounded bg-green-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-ink">Upcoming</span>}</td>
                        <td className="num">{e.rsvps} <span className="text-ink-4">/ {e.totalSeats}</span></td>
                        <td className="num">{past ? e.attendances : <span className="text-ink-4">—</span>}</td>
                        <td className="num">{e.fillRate}%</td>
                        <td className="num">{past ? <span className={e.showUpRate >= 70 ? 'text-green-ink' : e.showUpRate >= 40 ? 'text-amber' : 'text-red'}>{e.showUpRate}%</span> : <span className="text-ink-4">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ledger rise rise-6 xl:col-span-2">
          <div className="ledger-head">
            <div className="font-display text-[18px] font-semibold tracking-tight text-ink">Most engaged</div>
            <Link href="/members" className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-ink hover:underline">Members <ArrowUpRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-5" />)}</div>
          ) : top.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-4">No activity yet.</div>
          ) : (
            <ol className="divide-y divide-rule">
              {top.map((m) => (
                <li key={m.id} className="flex items-center gap-4 px-6 py-3.5">
                  <span className="font-display tnum w-5 text-[16px] font-semibold text-ink-4">{m.rank}</span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-soft text-[12px] font-bold text-green-ink">
                    {m.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-ink">{m.name}</div>
                    <div className="truncate text-[12px] text-ink-3">{STAGE_LABEL[m.stage] ?? m.stage} · {m.eventsAttended} events · {m.tasksCompleted} tasks</div>
                  </div>
                  <div className="font-display tnum text-[18px] font-semibold text-ink">{m.totalPoints}<span className="ml-0.5 text-[11px] font-body font-medium text-ink-4">pts</span></div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
