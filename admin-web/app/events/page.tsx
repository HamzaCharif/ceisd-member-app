'use client';
// /admin-web/app/events/page.tsx
// Events management table with QR code modal.

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { QrCode, X } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  capacity: number;
  rsvpCount: number;
  isPublished: boolean;
  pointsAwarded: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ eventId: string; token: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    adminApi
      .get<{ data: Event[] }>('/api/content/events')
      .then((r) => setEvents(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openQR(eventId: string) {
    setQrLoading(true);
    try {
      const res = await adminApi.get<{ token: string }>(`/api/attendance/qr/${eventId}`);
      setQrModal({ eventId, token: res.data.token });
    } catch {
      alert('Failed to generate QR token');
    } finally {
      setQrLoading(false);
    }
  }

  async function togglePublish(event: Event) {
    try {
      await adminApi.patch(`/api/content/events/${event.id}`, {
        isPublished: !event.isPublished,
      });
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, isPublished: !e.isPublished } : e))
      );
    } catch {
      alert('Failed to update event');
    }
  }

  return (
    <AdminLayout title="Events" subtitle="Manage published events and attendance QR codes">
      {loading ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
          Loading...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-right px-4 py-3">RSVPs</th>
                <th className="text-right px-4 py-3">Points</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">{ev.title}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(ev.dateTime).toLocaleDateString('en-AE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-36 truncate">{ev.location}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {ev.rsvpCount} / {ev.capacity}
                  </td>
                  <td className="px-4 py-3 text-right text-[#1D9E75] font-semibold">
                    {ev.pointsAwarded}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublish(ev)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        ev.isPublished
                          ? 'bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {ev.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openQR(ev.id)}
                      disabled={qrLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F7F2] text-[#1D9E75] text-xs font-semibold rounded-lg hover:bg-[#d4f0e8] transition-colors disabled:opacity-50"
                    >
                      <QrCode size={13} />
                      QR Code
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#1A1A1A] text-lg">Attendance QR Token</h3>
              <button
                onClick={() => setQrModal(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Share this token with the event QR display. It is time-limited and single-use per member.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-700 break-all select-all border border-gray-200">
              {qrModal.token}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(qrModal.token)}
              className="mt-4 w-full py-2.5 bg-[#1D9E75] text-white text-sm font-semibold rounded-lg hover:bg-[#157A5A] transition-colors"
            >
              Copy Token
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
