"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, CircleDollarSign, Plus, Users } from "lucide-react";
import type { Client, IntegrationAccount } from "@/lib/types";
import { RANGE_PRESETS } from "@/lib/range";

export function Topbar({
  clients,
  accounts,
}: {
  clients: Client[];
  accounts: IntegrationAccount[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [clientOpen, setClientOpen] = useState(false);

  const days = Number(search.get("days")) || 30;
  const activeDays = RANGE_PRESETS.some((p) => p.days === days) ? days : 30;
  const activeSlug = search.get("client") ?? "all";
  const active = clients.find((c) => c.slug === activeSlug) ?? null;
  const activePlatform = search.get("platform") ?? "all";
  const activeAccountId = search.get("account") ?? "all";
  const visibleAccounts = active
    ? accounts.filter((a) => a.clientId === active.id)
    : accounts;
  const activeAccount =
    visibleAccounts.find((a) => a.externalId === activeAccountId) ?? null;

  function pushParams(params: URLSearchParams) {
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(search.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    pushParams(params);
  }

  function selectDays(value: string) {
    const params = new URLSearchParams(search.toString());
    params.set("days", value);
    params.delete("from");
    params.delete("to");
    pushParams(params);
  }

  function selectClient(slug: string | null) {
    setClientOpen(false);
    const params = new URLSearchParams(search.toString());
    if (slug) params.set("client", slug);
    else params.delete("client");
    params.delete("account");
    pushParams(params);
  }

  function selectAccount(value: string) {
    setParam("account", value === "all" ? null : value);
  }

  function selectPlatform(value: string) {
    setParam("platform", value === "all" ? null : value);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setClientOpen((v) => !v)}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 md:w-[280px]"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Users size={15} />
                </span>
                <span className="truncate">
                  {active ? active.name : "Todos os clientes"}
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
                      Conta / cliente
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

          <label className="sr-only" htmlFor="account-filter">
            Conta conectada
          </label>
          <select
            id="account-filter"
            value={activeAccount?.externalId ?? "all"}
            onChange={(e) => selectAccount(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold text-ink md:w-[260px]"
          >
            <option value="all">Todas as contas</option>
            {visibleAccounts.map((account) => (
              <option key={account.id} value={account.externalId}>
                {account.accountName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center rounded-[10px] border border-line bg-surface-2 p-1">
            {[
              { value: "all", label: "Todas" },
              { value: "google", label: "Google" },
              { value: "meta", label: "Meta" },
            ].map((item) => {
              const isActive = activePlatform === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => selectPlatform(item.value)}
                  className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-colors md:flex-none ${
                    isActive
                      ? "bg-surface text-brand-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <CircleDollarSign size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden items-center rounded-[10px] border border-line bg-surface-2 p-1 sm:flex">
            {RANGE_PRESETS.map((p) => {
              const isActive = days === p.days;
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => selectDays(String(p.days))}
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

          <label className="sr-only" htmlFor="period-mobile">
            Período
          </label>
          <select
            id="period-mobile"
            value={activeDays}
            onChange={(e) => selectDays(e.target.value)}
            className="h-10 rounded-[10px] border border-line bg-surface px-2.5 text-[13px] font-semibold text-ink sm:hidden"
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.days} value={p.days}>
                {p.label}
              </option>
            ))}
          </select>
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
