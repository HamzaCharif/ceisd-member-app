'use client';
// /admin-web/components/Sidebar.tsx
// Ink rail. Active item gets a green tick-mark on the left edge and full-ink text.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminToken } from '@/lib/api';
import { LayoutGrid, Users, CalendarDays, ListChecks, BarChart3, Sparkles, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ai-insights', label: 'AI insights', icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearAdminToken();
    router.push('/login');
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-ink text-white">
      <div className="px-6 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-green font-display text-[15px] font-semibold tracking-tight text-white">C</div>
          <div>
            <div className="font-display text-[17px] font-semibold leading-none tracking-tight">CEISD</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/50">Administration</div>
          </div>
        </div>
      </div>

      <div className="mx-6 h-px bg-white/10" />

      <nav className="flex-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
                active ? 'bg-white/[0.07] font-semibold text-white' : 'font-medium text-white/60 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <span className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-green transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="mx-3 mb-3 h-px bg-white/10" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <LogOut size={17} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
