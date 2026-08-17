"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDayShort, formatValue, type FmtKey } from "@/lib/format";
import { AXIS, CURSOR_FILL, GRID_STROKE } from "./theme";
import { ChartTooltip } from "./ChartTooltip";

export function BarsChart({
  data,
  dataKey,
  name,
  color,
  format,
  height = 280,
  xIsDate = true,
  yFormat = "compact",
}: {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  name: string;
  color: string;
  format: FmtKey;
  height?: number;
  xIsDate?: boolean;
  yFormat?: FmtKey;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey={xIsDate ? "date" : "label"}
          tickFormatter={xIsDate ? (v) => fmtDayShort(String(v)) : undefined}
          stroke={AXIS.stroke}
          fontSize={AXIS.fontSize}
          tickLine={false}
          axisLine={false}
          minTickGap={20}
        />
        <YAxis
          stroke={AXIS.stroke}
          fontSize={AXIS.fontSize}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => formatValue(yFormat, Number(v))}
        />
        <Tooltip
          cursor={CURSOR_FILL}
          content={
            <ChartTooltip
              formatter={(v) => formatValue(format, v)}
              labelFormatter={xIsDate ? (l) => fmtDayShort(String(l)) : undefined}
            />
          }
        />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
