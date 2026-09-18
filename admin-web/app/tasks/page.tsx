'use client';
// /admin-web/app/tasks/page.tsx
// Tasks table with bulk-assign and completion tracking.

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  type: string;
  deadline: string | null;
  isActive: boolean;
  completionMethod: string;
  _count?: { taskCompletions: number };
}

const TYPE_COLORS: Record<string, string> = {
  WORKSHOP: 'bg-[#7F77DD]/10 text-[#7F77DD]',
  MEETING: 'bg-[#D85A30]/10 text-[#D85A30]',
  FORM: 'bg-[#378ADD]/10 text-[#378ADD]',
  PROJECT: 'bg-[#1D9E75]/10 text-[#1D9E75]',
  PEER_REVIEW: 'bg-red-50 text-red-600',
  SELF_ASSESSMENT: 'bg-gray-100 text-gray-600',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'WORKSHOP',
    completionMethod: 'MANUAL_APPROVAL',
    deadline: '',
    pointsAwarded: '30',
    assignedToAll: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .get<{ data: Task[] }>('/api/admin/tasks')
      .then((r) => setTasks(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post('/api/tasks', {
        ...form,
        pointsAwarded: parseInt(form.pointsAwarded),
        deadline: form.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setCreateOpen(false);
      // Refresh
      const r = await adminApi.get<{ data: Task[] }>('/api/admin/tasks');
      setTasks(r.data.data);
    } catch {
      alert('Failed to create task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Tasks" subtitle="Manage mandatory and recommended member tasks">
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white text-sm font-semibold rounded-lg hover:bg-[#157A5A] transition-colors"
        >
          <Plus size={15} />
          New Task
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Deadline</th>
                <th className="text-center px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">{t.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${TYPE_COLORS[t.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {t.completionMethod.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {t.deadline
                      ? new Date(t.deadline).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${
                        t.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'
                      }`}
                    />
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No tasks yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#1A1A1A] text-lg">New Task</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  >
                    {['WORKSHOP', 'MEETING', 'FORM', 'PROJECT', 'PEER_REVIEW', 'SELF_ASSESSMENT'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Method</label>
                  <select
                    value={form.completionMethod}
                    onChange={(e) => setForm((f) => ({ ...f, completionMethod: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  >
                    <option value="MANUAL_APPROVAL">Manual Approval</option>
                    <option value="AUTO_ATTENDANCE">Auto Attendance</option>
                    <option value="FORM_SUBMISSION">Form Submission</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input
                    type="number"
                    value={form.pointsAwarded}
                    onChange={(e) => setForm((f) => ({ ...f, pointsAwarded: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.assignedToAll}
                  onChange={(e) => setForm((f) => ({ ...f, assignedToAll: e.target.checked }))}
                  className="rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]"
                />
                Assign to all members
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#1D9E75] text-white text-sm font-semibold rounded-lg hover:bg-[#157A5A] disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
