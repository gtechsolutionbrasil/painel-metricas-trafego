"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PERIOD_SHORTCUTS, rangeFromSearch } from "@/lib/range";

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtBR = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

// Seletor de período no estilo do Meta Ads: atalhos à esquerda + calendário
// de seleção de intervalo à direita.
export function PeriodPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);

  const { range } = rangeFromSearch(Object.fromEntries(search.entries()));
  const isCustom = Boolean(search.get("from") && search.get("to"));

  // Rótulo do botão: nome do atalho quando bate, senão o intervalo.
  const activeShortcut = PERIOD_SHORTCUTS.find((s) => {
    const r = s.range();
    return r.from === range.from && r.to === range.to;
  });
  const buttonLabel =
    !isCustom && activeShortcut
      ? activeShortcut.label
      : `${fmtBR(range.from)} – ${fmtBR(range.to)}`;

  // Seleção em edição dentro do popover.
  const [draft, setDraft] = useState<{ from: string; to: string }>(range);
  const [viewMonth, setViewMonth] = useState<Date>(parse(range.to));
  const [picking, setPicking] = useState<"from" | "to">("from");

  function apply(from: string, to: string) {
    const params = new URLSearchParams(search.toString());
    params.set("from", from);
    params.set("to", to);
    params.delete("days");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    setOpen(false);
  }

  function onShortcut(id: string) {
    const sc = PERIOD_SHORTCUTS.find((s) => s.id === id);
    if (!sc) return;
    const r = sc.range();
    setDraft(r);
    apply(r.from, r.to);
  }

  function onDayClick(day: string) {
    if (picking === "from" || day < draft.from) {
      setDraft({ from: day, to: day });
      setPicking("to");
    } else {
      setDraft((d) => ({ ...d, to: day }));
      setPicking("from");
    }
  }

  const days = useMemo(() => buildMonth(viewMonth), [viewMonth]);
  const today = iso(new Date());

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(range);
          setViewMonth(parse(range.to));
          setPicking("from");
          setOpen((v) => !v);
        }}
        className="flex h-14 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <CalendarDays size={15} />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
            Período
          </span>
          <span className="block truncate text-sm font-semibold text-ink">
            {buttonLabel}
          </span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-faint" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 flex overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)]">
            {/* Atalhos */}
            <div className="w-44 shrink-0 border-r border-line p-1.5">
              {PERIOD_SHORTCUTS.map((s) => {
                const r = s.range();
                const active =
                  !isCustom && r.from === range.from && r.to === range.to;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onShortcut(s.id)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                      active
                        ? "bg-brand-soft font-semibold text-brand-ink"
                        : "text-ink hover:bg-surface-2"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Calendário */}
            <div className="w-[280px] p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                    )
                  }
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2"
                >
                  <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-bold text-ink">
                  {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                    )
                  }
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {WEEK.map((w, i) => (
                  <div
                    key={i}
                    className="grid h-7 place-items-center text-[11px] font-bold text-faint"
                  >
                    {w}
                  </div>
                ))}
                {days.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const inRange = d >= draft.from && d <= draft.to;
                  const isEdge = d === draft.from || d === draft.to;
                  const future = d > today;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={future}
                      onClick={() => onDayClick(d)}
                      className={`grid h-8 place-items-center rounded-md text-[13px] transition-colors ${
                        isEdge
                          ? "bg-brand font-bold text-white"
                          : inRange
                            ? "bg-brand-soft-2 text-brand-ink"
                            : future
                              ? "text-faint/40"
                              : "text-ink hover:bg-surface-2"
                      }`}
                    >
                      {Number(d.slice(8, 10))}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted">
                  {fmtBR(draft.from)} – {fmtBR(draft.to)}
                </p>
                <button
                  type="button"
                  onClick={() => apply(draft.from, draft.to)}
                  className="btn btn-primary btn-sm"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Monta a grade do mês: posições vazias antes do dia 1 + os dias (ISO).
function buildMonth(month: Date): (string | null)[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(iso(new Date(year, m, d)));
  }
  return cells;
}
