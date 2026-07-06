"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Megaphone } from "lucide-react";

// Seletor de campanha (?campaign=nome). "Todas" remove o filtro.
export function CampaignFilter({ campaigns }: { campaigns: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const current = search.get("campaign") ?? "all";
  const value = campaigns.includes(current) ? current : "all";

  function onChange(next: string) {
    const params = new URLSearchParams(search.toString());
    if (next === "all") params.delete("campaign");
    else params.set("campaign", next);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex h-14 min-w-[260px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <Megaphone size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <label
          className="block text-[10px] font-bold uppercase tracking-[0.08em] text-faint"
          htmlFor="campaign-filter"
        >
          Campanha
        </label>
        <select
          id="campaign-filter"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="-ml-1 mt-0.5 w-[calc(100%+8px)] truncate rounded-md bg-transparent px-1 text-sm font-semibold text-ink outline-none"
        >
          <option value="all">Todas as campanhas</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
