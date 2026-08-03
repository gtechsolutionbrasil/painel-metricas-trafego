"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Plus, Users } from "lucide-react";
import type { Client } from "@/lib/types";
import { PeriodPicker } from "@/components/layout/PeriodPicker";
import { RefreshButton } from "@/components/layout/RefreshButton";
import { ExportReportButton } from "@/components/layout/ExportReportButton";

export function Topbar({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [clientOpen, setClientOpen] = useState(false);

  const activeSlug = search.get("client") ?? "all";
  const active = clients.find((c) => c.slug === activeSlug) ?? null;

  function selectClient(slug: string | null) {
    setClientOpen(false);
    const params = new URLSearchParams(search.toString());
    if (slug) params.set("client", slug);
    else params.delete("client");
    // Filtros que pertencem ao cliente anterior não fazem sentido no novo.
    params.delete("account");
    params.delete("campaign");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[300px]">
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

        <div className="flex items-center gap-2">
          <PeriodPicker />
          <ExportReportButton />
          <RefreshButton />
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
