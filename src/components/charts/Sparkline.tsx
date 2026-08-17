"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./theme";

// Mini-tendência dentro do KpiCard: sem eixos e sem tooltip — mostra só a
// forma da série no período (a leitura fina fica nos gráficos grandes).
export function Sparkline({
  data,
  color = CHART_COLORS.brand,
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const id = useId();
  if (!data.length) return null;
  // Período de 1 dia: um ponto só não desenha área — duplica e vira linha reta.
  const points = data.length === 1 ? [data[0], data[0]] : data;
  const rows = points.map((v, i) => ({ i, v }));
  return (
    <div className="mt-3" style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
