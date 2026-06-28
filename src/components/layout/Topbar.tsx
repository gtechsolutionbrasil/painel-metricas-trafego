"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Users } from "lucide-react";
import type { Client } from "@/lib/types";
import { RANGE_PRESETS } from "@/lib/range";

export function Topbar({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);

  const days = Number(search.get("days")) || 30;
  const activeSlug = search.get("client") ?? "all";
  const active = clients.find((c) => c.slug === activeSlug) ?? null;

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(search.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function selectClient(slug: string | null) {
    setOpen(false);
    setParam("client", slug);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
      {/* Seletor de cliente */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand">
            <Users size={15} />
          </span>
          <span className="max-w-[180px] truncate">
            {active ? active.name : "Todos os clientes"}
          </span>
          <ChevronDown size={16} className="text-faint" />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Fechar"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)]">
              <p className="border-b border-line px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                Selecionar cliente
              </p>
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

      {/* Período + usuário */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center rounded-[10px] border border-line bg-surface-2 p-1 sm:flex">
          {RANGE_PRESETS.map((p) => {
            const isActive = days === p.days;
            return (
              <button
                key={p.days}
                type="button"
                onClick={() => setParam("days", String(p.days))}
                className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? "bg-surface text-brand-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface px-2.5 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">
            GT
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-semibold text-ink">GTech Solution</p>
            <p className="text-[11px] text-faint">Administrador</p>
          </div>
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
