import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, HelpCircle } from "lucide-react";

type Trend = { value: number; positiveIsGood?: boolean };

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  help,
  trend,
  caption,
  tone = "brand",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  // Explicação didática, em linguagem simples, mostrada ao passar o mouse no "?".
  help?: string;
  trend?: Trend;
  caption?: string;
  tone?: "brand" | "sky" | "indigo" | "amber" | "rose";
}) {
  // Uma explicação só, sob demanda: o "?" mostra help (ou o hint, se for o que
  // houver). O texto fixo embaixo do valor saiu — poluía e duplicava o tooltip.
  const tip = help ?? hint;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-[10px] border ${TONE[tone]}`}>
          <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
        </span>
        {trend && <TrendPill {...trend} />}
      </div>
      <p className="eyebrow mt-4 flex items-center gap-1.5">
        {label}
        {tip && <HelpTip text={tip} />}
      </p>
      <p className="mt-1 break-words text-[26px] font-extrabold tabular-nums tracking-tight text-ink">
        {value}
      </p>
      {caption && <p className="mt-1 text-xs leading-5 text-muted">{caption}</p>}
    </div>
  );
}

const TONE = {
  brand: "border-brand-border bg-brand-soft text-brand",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

// Tooltip só-CSS (sem JS): balão aparece no hover/foco do ícone "?".
function HelpTip({ text }: { text: string }) {
  return (
    <button
      type="button"
      aria-label={`Ajuda: ${text}`}
      className="group relative inline-flex rounded-sm"
    >
      <HelpCircle
        size={13}
        strokeWidth={2.2}
        className="cursor-help text-faint/60 transition-colors group-hover:text-brand"
        aria-hidden="true"
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 w-60 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-ink opacity-0 shadow-[var(--shadow-pop)] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
      >
        {text}
      </span>
    </button>
  );
}

function TrendPill({ value, positiveIsGood = true }: Trend) {
  const up = value >= 0;
  const good = up === positiveIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      title="Variação em relação ao período anterior de mesmo tamanho"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
        good
          ? "bg-brand-soft-2 text-brand-ink"
          : "bg-[#fef2f2] text-[#991b1b]"
      }`}
    >
      <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
      {Math.abs(value).toFixed(1).replace(".", ",")}%
    </span>
  );
}
