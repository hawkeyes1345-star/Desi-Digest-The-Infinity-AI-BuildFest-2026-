import type React from "react";

export interface MacroRingProps {
  /** Display label, e.g. "Calories" */
  label: string;
  /** Current accumulated value */
  current: number;
  /** Daily target value */
  target: number;
  /** Unit suffix, e.g. "kcal", "g", "ml" */
  unit: string;
  /** Small icon rendered beside the label */
  icon: React.ReactNode;
  /** CSS color string for the ring stroke */
  color: string;
}

export function MacroRing({ label, current, target, unit, icon, color }: MacroRingProps) {
  const pct = Math.max(0, Math.min(100, (current / target) * 100));
  const r = 34;
  const C = 2 * Math.PI * r;
  const offset = C - (pct / 100) * C;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-warm">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
      <div className="relative flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)" }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-display text-sm font-semibold">
            {Math.round(pct)}%
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {icon} {label}
          </div>
          <p className="mt-1 font-display text-2xl font-semibold leading-none">
            {Math.round(current)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / {target} {unit}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
