'use client';
// /admin-web/components/AdminLayout.tsx
// Page shell. Title block uses the display serif; an optional `actions` slot sits on the right.

import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export default function AdminLayout({ children, title, subtitle, eyebrow, actions }: AdminLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <main className="relative z-[1] ml-60 min-h-screen px-10 pb-16 pt-9">
        <header className="mb-8 flex items-end justify-between gap-6 border-b border-rule pb-6">
          <div>
            {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
            <h1 className="font-display text-[34px] font-semibold leading-none tracking-[-0.02em] text-ink">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-xl text-[14px] text-ink-3">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
