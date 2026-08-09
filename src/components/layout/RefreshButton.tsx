"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { refreshData } from "@/app/(dash)/actions";

// Botão "Atualizar": dispara a coleta no n8n (Meta + Google + GA4) e recarrega a
// página com os números novos. O Google Ads leva ~20s, por isso o estado de
// carregando fica visível até a coleta terminar.
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = loading || pending;

  async function onClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await refreshData();
      if (res.error) setError(res.error);
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setError("Não foi possível iniciar a coleta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        title="Buscar os dados mais recentes do Meta, Google Ads e GA4"
        className="flex h-14 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCw size={16} aria-hidden="true" className={`text-brand ${busy ? "animate-spin motion-reduce:animate-none" : ""}`} />
        <span className="hidden sm:inline">{busy ? "Atualizando…" : "Atualizar"}</span>
      </button>
      {error && (
        <p role="status" aria-live="polite" className="absolute right-0 top-[calc(100%+6px)] z-40 max-w-[240px] rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-red-600 shadow-[var(--shadow-pop)]">
          {error}
        </p>
      )}
    </div>
  );
}
