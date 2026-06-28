"use client";

import type { ReactNode } from "react";

type Item = { name?: string; value?: number; color?: string; dataKey?: string };

// Tooltip claro e legível, reutilizado por todos os gráficos.
export function ChartTooltip({
  active,
  label,
  payload,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  label?: string;
  payload?: Item[];
  formatter?: (value: number, key: string) => string;
  labelFormatter?: (label: string) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-[var(--shadow-pop)]">
      {label !== undefined && (
        <p className="mb-1 text-xs font-semibold text-muted">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: it.color }}
            />
            <span className="text-muted">{it.name}:</span>
            <span className="font-semibold text-ink">
              {formatter
                ? formatter(Number(it.value), String(it.dataKey ?? it.name))
                : it.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
