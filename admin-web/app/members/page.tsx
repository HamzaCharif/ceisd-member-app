'use client';
// /admin-web/app/members/page.tsx
// Searchable member table with detail slide-over panel.

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { Download, X } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  college: string | null;
  yearOfStudy: string | null;
  createdAt: string;
  userStage: { stage: string; totalPoints: number } | null;
  _count: { eventAttendances: number; taskCompletions: number };
}

interface MemberDetail extends Member {
  profile: unknown;
  eventAttendances: Array<{ event: { id: string; title: string; dateTime: string } }>;
  taskCompletions: Array<{ task: { id: string; title: string; type: string } }>;
  gamificationRecords: Array<{ id: string; reason: string; points: number; createdAt: string }>;
}

const STAGE_COLORS: Record<string, string> = {
  SPARK: 'bg-amber-100 text-amber-700',
  SHAPE: 'bg-[#378ADD]/10 text-[#378ADD]',
  SCALE: 'bg-[#1D9E75]/10 text-[#1D9E75]',
  MENTOR: 'bg-amber-50 text-amber-500',
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (stageFilter) params.set('stage', stageFilter);
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await adminApi.get<{ data: Member[]; total: number }>(
        `/api/admin/members?${params}`
      );
      setMembers(Array.isArray(res.data.data) ? res.data.data : []);
      setTotal(typeof res.data.total === 'number' ? res.data.total : 0);
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, stageFilter, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await adminApi.get<{ data: MemberDetail }>(`/api/admin/members/${id}`);
      setSelected(res.data.data);
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleRole(id: string, current: string) {
    const newRole = current === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    if (!confirm(`Change role to ${newRole}?`)) return;
    setRoleUpdating(true);
    try {
      await adminApi.patch(`/api/admin/members/${id}/role`, { role: newRole });
      fetchMembers();
      if (selected?.id === id) {
        setSelected((prev) => prev ? { ...prev, role: newRole } : prev);
      }
    } catch {
      alert('Failed to update role');
    } finally {
      setRoleUpdating(false);
    }
  }

  async function exportCSV() {
    const res = await adminApi.get('/api/admin/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceisd-members-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout title="Members" subtitle={`${total} total members`}>
      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
        >
          <option value="">All roles</option>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
        >
          <option value="">All stages</option>
          <option value="SPARK">Spark</option>
          <option value="SHAPE">Shape</option>
          <option value="SCALE">Scale</option>
          <option value="MENTOR">Mentor</option>
        </select>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white text-sm font-semibold rounded-lg hover:bg-[#157A5A] transition-colors"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">College</th>
                  <th className="text-left px-4 py-3">Stage</th>
                  <th className="text-right px-4 py-3">Points</th>
                  <th className="text-right px-4 py-3">Events</th>
                  <th className="text-left px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => openDetail(m.id)}
                    className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selected?.id === m.id ? 'bg-[#E8F7F2]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-400">{m.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.college ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STAGE_COLORS[m.userStage?.stage ?? 'SPARK'] ?? ''}`}>
                        {m.userStage?.stage ?? 'SPARK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#1D9E75] font-semibold">
                      {m.userStage?.totalPoints ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {m._count.eventAttendances}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        m.role === 'ADMIN'
                          ? 'bg-[#1A2744] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
              <span className="text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {(selected || detailLoading) && (
          <div className="w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-5 self-start">
            {detailLoading ? (
              <div className="text-gray-400 text-sm text-center py-8">Loading...</div>
            ) : selected ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#1A1A1A] text-base">{selected.name}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-4">{selected.email}</div>

                <div className="space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">College</span>
                    <span className="font-medium text-[#1A1A1A]">{selected.college ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Stage</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STAGE_COLORS[selected.userStage?.stage ?? 'SPARK']}`}>
                      {selected.userStage?.stage ?? 'SPARK'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points</span>
                    <span className="font-semibold text-[#1D9E75]">{selected.userStage?.totalPoints ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Events attended</span>
                    <span className="font-medium text-[#1A1A1A]">{selected.eventAttendances?.length ?? selected._count?.eventAttendances ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tasks completed</span>
                    <span className="font-medium text-[#1A1A1A]">{selected.taskCompletions?.length ?? selected._count?.taskCompletions ?? 0}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleRole(selected.id, selected.role)}
                  disabled={roleUpdating}
                  className="w-full py-2 rounded-lg border border-[#1D9E75] text-sm font-semibold text-[#1D9E75] hover:bg-[#E8F7F2] transition-colors disabled:opacity-50"
                >
                  {roleUpdating ? 'Updating...' : selected.role === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
                </button>

                {/* Recent points */}
                {selected.gamificationRecords?.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Points</div>
                    <div className="space-y-1.5">
                      {selected.gamificationRecords.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex justify-between text-xs">
                          <span className="text-gray-500 truncate mr-2">{r.reason.replace(/_/g, ' ')}</span>
                          <span className="text-[#1D9E75] font-semibold shrink-0">+{r.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
