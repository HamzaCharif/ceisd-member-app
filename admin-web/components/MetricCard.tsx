// /admin-web/components/MetricCard.tsx
// A metric with its receipt. The big number is the headline; the `fraction`
// line shows the exact numerator/denominator so nobody has to trust a percentage.

interface MetricCardProps {
  label: string;
  value: string | number;
  fraction?: string;      // e.g. "5 of 8 assignments"
  hint?: string;          // one-line definition of how it's computed
  tone?: 'ink' | 'green' | 'amber' | 'red';
  loading?: boolean;
  delayClass?: string;
  /** legacy props from older pages */
  subtitle?: string;
  color?: 'primary' | 'navy' | 'amber' | 'red';
}

const LEGACY_TONE: Record<string, MetricCardProps['tone']> = { primary: 'green', navy: 'ink', amber: 'amber', red: 'red' };

const TONE: Record<NonNullable<MetricCardProps['tone']>, string> = {
  ink: 'text-ink',
  green: 'text-green-ink',
  amber: 'text-amber',
  red: 'text-red',
};

export default function MetricCard({ label, value, fraction, hint, tone, loading = false, delayClass = '', subtitle, color }: MetricCardProps) {
  const resolvedTone = tone ?? (color ? LEGACY_TONE[color] : undefined) ?? 'ink';
  const resolvedHint = hint ?? subtitle;
  return (
    <div className={`ledger rise ${delayClass} flex flex-col justify-between px-6 pb-5 pt-5`}>
      <div className="eyebrow">{label}</div>
      <div className="mt-3">
        {loading ? (
          <div className="skeleton h-10 w-24" />
        ) : (
          <div className={`font-display tnum text-[40px] font-semibold leading-none tracking-[-0.02em] ${TONE[resolvedTone]}`}>{value}</div>
        )}
        {fraction ? <div className="tnum mt-2 text-[13px] font-medium text-ink-2">{loading ? <span className="skeleton inline-block h-3 w-32 align-middle" /> : fraction}</div> : null}
        {resolvedHint ? <div className="mt-1 text-[12px] leading-snug text-ink-4">{resolvedHint}</div> : null}
      </div>
    </div>
  );
}
