"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Plus, Users } from "lucide-react";
import type { Client } from "@/lib/types";
import { RANGE_PRESETS, rangeFromSearch } from "@/lib/range";

const iso = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function Topbar({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [clientOpen, setClientOpen] = useState(false);

  const { range, days } = rangeFromSearch(Object.fromEntries(search.entries()));
  const isCustom = Boolean(search.get("from") && search.get("to"));
  const today = iso(new Date());

  const activeSlug = search.get("client") ?? "all";
  const active = clients.find((c) => c.slug === activeSlug) ?? null;

  function pushParams(params: URLSearchParams) {
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  // Atalho de período (últimos N dias).
  function selectDays(value: string) {
    const params = new URLSearchParams(search.toString());
    params.set("days", value);
    params.delete("from");
    params.delete("to");
    pushParams(params);
  }

  // Período personalizado (?from=&to=). Só aplica com as duas datas válidas.
  function selectRange(from: string, to: string) {
    if (!from || !to || from > to) return;
    const params = new URLSearchParams(search.toString());
    params.set("from", from);
    params.set("to", to);
    params.delete("days");
    pushParams(params);
  }

  function selectClient(slug: string | null) {
    setClientOpen(false);
    const params = new URLSearchParams(search.toString());
    if (slug) params.set("client", slug);
    else params.delete("client");
    // Filtros que pertencem ao cliente anterior não fazem sentido no novo.
    params.delete("account");
    params.delete("campaign");
    pushParams(params);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full md:max-w-[300px]">
          <button
            type="button"
            onClick={() => setClientOpen((v) => !v)}
            className="flex h-14 w-full items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-3 text-left transition-colors hover:bg-surface-2"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <Users size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
                  Cliente
                </span>
                <span className="block truncate text-sm font-semibold text-ink">
                  {active ? active.name : "Todos os clientes"}
                </span>
              </span>
            </span>
            <ChevronDown size={16} className="shrink-0 text-faint" />
          </button>

          {clientOpen && (
            <>
              <button
                type="button"
                aria-label="Fechar"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setClientOpen(false)}
              />
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)]">
                <div className="flex items-center justify-between border-b border-line px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                    Cliente
                  </p>
                  <Link
                    href="/clientes"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-brand-ink hover:bg-brand-soft"
                  >
                    <Plus size={13} />
                    Novo
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto p-1.5">
                  <ClientOption
                    label="Todos os clientes"
                    selected={!active}
                    onClick={() => selectClient(null)}
                  />
                  {clients.map((c) => (
                    <ClientOption
                      key={c.id}
                      label={c.name}
                      status={c.status}
                      selected={active?.slug === c.slug}
                      onClick={() => selectClient(c.slug)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Período: atalhos + datas livres (De/Até) */}
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-surface px-3 py-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
              Período
            </p>
            <select
              value={isCustom ? "custom" : String(days)}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  selectRange(range.from, range.to);
                } else {
                  selectDays(e.target.value);
                }
              }}
              className="-ml-1 mt-0.5 rounded-md bg-transparent px-1 text-sm font-semibold text-ink outline-none"
            >
              {RANGE_PRESETS.map((p) => (
                <option key={p.days} value={p.days}>
                  Últimos {p.label}
                </option>
              ))}
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div className="h-9 w-px bg-line" />

          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
            De
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => selectRange(e.target.value, range.to)}
              className="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] font-semibold normal-case tracking-normal text-ink outline-none transition-colors focus:border-brand"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
            Até
            <input
              type="date"
              value={range.to}
              min={range.from}
              max={today}
              onChange={(e) => selectRange(range.from, e.target.value)}
              className="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] font-semibold normal-case tracking-normal text-ink outline-none transition-colors focus:border-brand"
            />
          </label>
        </div>
      </div>
    </header>
  );
}

function ClientOption({
  label,
  status,
  selected,
  onClick,
}: {
  label: string;
  status?: "active" | "paused";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        selected ? "bg-brand-soft text-brand-ink" : "text-ink hover:bg-surface-2"
      }`}
    >
      <span className="flex items-center gap-2">
        {status && (
          <span
            className={`h-2 w-2 rounded-full ${
              status === "active" ? "bg-brand" : "bg-faint"
            }`}
          />
        )}
        <span className="font-medium">{label}</span>
      </span>
      {selected && <Check size={16} className="text-brand" />}
    </button>
  );
}
