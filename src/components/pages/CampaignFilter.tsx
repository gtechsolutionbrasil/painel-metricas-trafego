"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Megaphone } from "lucide-react";
import type { AdCampaign } from "@/lib/types";

// Seletor de campanhas (multi-seleção, com status ativas/pausadas).
// Filtra por ?campaign=nome (repetível). Sem nenhuma = todas.
export function CampaignFilter({ campaigns }: { campaigns: AdCampaign[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "all">("active");

  const known = useMemo(() => new Set(campaigns.map((c) => c.campaign)), [campaigns]);
  const selectedFromUrl = search
    .getAll("campaign")
    .filter((c) => known.has(c));
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedFromUrl));

  const activeCount = campaigns.filter((c) => c.status === "ENABLED").length;
  const visible = campaigns.filter((c) =>
    tab === "active" ? c.status === "ENABLED" : true,
  );

  const label =
    selectedFromUrl.length === 0
      ? "Todas as campanhas"
      : selectedFromUrl.length === 1
        ? selectedFromUrl[0]
        : `${selectedFromUrl.length} campanhas`;

  function toggle(name: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function apply(names: string[]) {
    const params = new URLSearchParams(search.toString());
    params.delete("campaign");
    for (const n of names) params.append("campaign", n);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(new Set(selectedFromUrl));
          setOpen((v) => !v);
        }}
        className="flex h-14 min-w-[240px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Megaphone size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
            Campanha
          </span>
          <span className="block truncate text-sm font-semibold text-ink">
            {label}
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
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)]">
            {/* Abas ativas / todas */}
            <div className="flex gap-1 border-b border-line p-1.5">
              <TabButton
                active={tab === "active"}
                onClick={() => setTab("active")}
                label={`Ativas (${activeCount})`}
              />
              <TabButton
                active={tab === "all"}
                onClick={() => setTab("all")}
                label={`Todas (${campaigns.length})`}
              />
            </div>

            <div className="max-h-72 overflow-y-auto p-1.5">
              {visible.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-faint">
                  Nenhuma campanha {tab === "active" ? "ativa" : ""} no período.
                </p>
              )}
              {visible.map((c) => {
                const checked = draft.has(c.campaign);
                return (
                  <button
                    key={c.campaign}
                    type="button"
                    onClick={() => toggle(c.campaign)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                        checked
                          ? "border-brand bg-brand text-white"
                          : "border-line-strong"
                      }`}
                    >
                      {checked && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        c.status === "ENABLED" ? "bg-brand" : "bg-faint"
                      }`}
                      title={c.status === "ENABLED" ? "Ativa" : "Pausada"}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {c.campaign}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-line p-2">
              <button
                type="button"
                onClick={() => apply([])}
                className="btn btn-ghost btn-sm"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => apply([...draft])}
                className="btn btn-primary btn-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );
}
