"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GitCompareArrows } from "lucide-react";
import { compareFromSearch, type CompareMode } from "@/lib/range";

const OPTIONS: Array<{ value: CompareMode; label: string }> = [
  { value: "prev", label: "Período anterior" },
  { value: "yoy", label: "Ano passado" },
  { value: "none", label: "Sem comparação" },
];

// Base de comparação das pílulas de variação — vale pra todas as telas.
// Vive na URL (?compare=) como os demais filtros; default = período anterior.
export function ComparePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const current = compareFromSearch({ compare: search.get("compare") ?? undefined });

  function onChange(value: string) {
    const params = new URLSearchParams(search.toString());
    if (value === "prev") params.delete("compare");
    else params.set("compare", value);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <label className="inline-flex h-14 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-surface pl-3 pr-2 transition-colors hover:bg-surface-2">
      <GitCompareArrows size={15} className="shrink-0 text-faint" aria-hidden="true" />
      <span className="sr-only">Base de comparação</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent pr-1 text-sm font-semibold text-ink outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
