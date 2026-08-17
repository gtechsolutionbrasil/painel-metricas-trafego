"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatValue, type FmtKey } from "@/lib/format";
import { SERIES_PALETTE } from "./theme";
import { ChartTooltip } from "./ChartTooltip";

export type DonutSlice = { label: string; value: number };

export function DonutChart({
  data,
  height = 240,
  centerLabel = "Sessões",
  format = "int",
}: {
  data: DonutSlice[];
  height?: number;
  centerLabel?: string;
  format?: FmtKey;
}) {
  const fmt = (v: number) => formatValue(format, v);
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES_PALETTE[i % SERIES_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={(v) => fmt(v)} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
            {centerLabel}
          </span>
          <span className="text-lg font-bold tabular-nums text-ink">
            {fmt(total)}
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{
                  background: SERIES_PALETTE[i % SERIES_PALETTE.length],
                }}
              />
              <span className="truncate text-ink">{d.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-muted">
              {total ? ((d.value / total) * 100).toFixed(1).replace(".", ",") : "0"}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
