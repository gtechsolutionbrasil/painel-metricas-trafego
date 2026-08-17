// Paleta dos gráficos — verde como cor dominante, demais tons só para
// categorizar séries secundárias (status/origens). Identidade fixa por canal:
// sky = Google, indigo = Meta (cor segue a entidade, nunca a posição).
// Tons validados com scripts/validate_palette.js da skill dataviz (fundo claro):
// chroma, separação CVD, piso de visão normal e contraste ≥ 3:1 — todos PASS.
export const CHART_COLORS = {
  brand: "#16a34a",
  teal: "#0d9488",
  sky: "#0284c7",
  indigo: "#6366f1",
  amber: "#d97706",
  slate: "#94a3b8",
  // Fora da SERIES_PALETTE: usado só pelo tone "rose" do KpiCard (sparkline).
  rose: "#e11d48",
};

// Ordem fixa de atribuição para séries sem identidade própria (donut de
// origens etc.). Intercalada para separação máxima entre vizinhos; o slate é
// o balde neutro "outros/sem origem" (cinza de propósito) e fica por último.
export const SERIES_PALETTE = [
  CHART_COLORS.brand,
  CHART_COLORS.sky,
  CHART_COLORS.amber,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
  CHART_COLORS.slate,
];

export const AXIS = {
  stroke: "#94a3b8",
  fontSize: 12,
};

export const GRID_STROKE = "#e2e8f0";

// Cursor de hover compartilhado (linha nos gráficos de área, véu nas barras).
export const CURSOR_LINE = { stroke: "#cbd5e1", strokeDasharray: "3 3" };
export const CURSOR_FILL = { fill: "rgba(15, 23, 42, 0.04)" };
