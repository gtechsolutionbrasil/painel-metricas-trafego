"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDayShort, formatValue, type FmtKey } from "@/lib/format";
import { AXIS, GRID_STROKE } from "./theme";
import { ChartTooltip } from "./ChartTooltip";

export type Series = {
  key: string;
  label: string;
  color: string;
  format: FmtKey;
};

export function TrendAreaChart({
  data,
  series,
  height = 280,
  yFormat = "compact",
}: {
  data: Array<Record<string, number | string>>;
  series: Series[];
  height?: number;
  yFormat?: FmtKey;
}) {
  const fmtByKey = (value: number, key: string) => {
    const s = series.find((x) => x.key === key);
    return s ? formatValue(s.format, value) : String(value);
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => fmtDayShort(String(v))}
          stroke={AXIS.stroke}
          fontSize={AXIS.fontSize}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
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
          content={
            <ChartTooltip
              formatter={fmtByKey}
              labelFormatter={(l) => fmtDayShort(String(l))}
            />
          }
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.4}
            fill={`url(#grad-${s.key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
