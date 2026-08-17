"use client";

import { HelpCircle } from "lucide-react";

// Tooltip só-CSS (sem JS): balão aparece no hover/foco do ícone "?".
// Compartilhado por KpiCard, listas de ações do Google etc.
export function HelpTip({ text }: { text: string }) {
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
