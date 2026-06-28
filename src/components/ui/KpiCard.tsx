import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Trend = { value: number; positiveIsGood?: boolean };

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: Trend;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] border border-brand-border bg-brand-soft text-brand">
          <Icon size={18} strokeWidth={2.2} />
        </span>
        {trend && <TrendPill {...trend} />}
      </div>
      <p className="eyebrow mt-4">{label}</p>
      <p className="mt-1 text-[26px] font-extrabold tracking-tight text-ink">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

function TrendPill({ value, positiveIsGood = true }: Trend) {
  const up = value >= 0;
  const good = up === positiveIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
        good
          ? "bg-brand-soft-2 text-brand-ink"
          : "bg-[#fef2f2] text-[#991b1b]"
      }`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {Math.abs(value).toFixed(1).replace(".", ",")}%
    </span>
  );
}
