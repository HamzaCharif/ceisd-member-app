'use client';
// /admin-web/app/login/page.tsx
// Admin sign-in. Auth logic is unchanged (dev-login in development, SSO endpoint
// in production) — this file only fixes the production build (useSearchParams
// needs a Suspense boundary) and brings the screen into the ledger design.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, setAdminToken, getAdminToken } from '@/lib/api';
import { ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getAdminToken()) router.replace('/');
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.toLowerCase().endsWith('@aus.edu')) {
      setError('Only @aus.edu accounts are permitted.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const endpoint = process.env.NODE_ENV === 'production' ? '/api/auth/sso' : '/api/auth/dev-login';
      const res = await adminApi.post<{ token: string; role: string }>(endpoint, { email });
      if (res.data.role !== 'ADMIN') {
        setError('This account does not have admin access.');
        return;
      }
      setAdminToken(res.data.token);
      router.replace(searchParams.get('redirect') ?? '/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {error ? <div className="rounded-lg border border-red/30 bg-red-soft px-3.5 py-2.5 text-[13px] text-red" role="alert">{error}</div> : null}
      <div>
        <label htmlFor="email" className="eyebrow mb-2 block">AUS email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@aus.edu" required className="input" />
      </div>
      {process.env.NODE_ENV === 'production' ? (
        <div>
          <label htmlFor="password" className="eyebrow mb-2 block">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" />
        </div>
      ) : null}
      <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center disabled:opacity-60">
        {loading ? 'Signing in…' : 'Continue with Microsoft'} {loading ? null : <ArrowRight size={16} />}
      </button>
      {process.env.NODE_ENV !== 'production' ? (
        <p className="text-center text-[12px] text-ink-4">Development mode: any address in <span className="font-semibold text-ink-3">ADMIN_EMAILS</span> signs in without SSO.</p>
      ) : null}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative grid min-h-screen place-items-center px-6 py-12">
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-green-soft opacity-70 blur-3xl" />
        <div className="absolute -right-32 -top-24 h-[420px] w-[420px] rounded-full bg-amber-soft opacity-60 blur-3xl" />
      </div>
      <div className="relative z-[1] w-full max-w-[420px]">
        <div className="mb-8">
          <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-ink font-display text-[18px] font-semibold text-white">C</div>
          <div className="eyebrow mb-2">CEISD · American University of Sharjah</div>
          <h1 className="font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink">Sign in to the admin&nbsp;ledger.</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-3">Members, events, tasks and matching — with the exact counts behind every number.</p>
        </div>
        <div className="ledger p-7">
          <Suspense fallback={<div className="skeleton h-40" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-[12px] text-ink-4">Access is limited to registered CEISD administrators.</p>
      </div>
    </div>
  );
}
