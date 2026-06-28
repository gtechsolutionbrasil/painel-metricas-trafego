// Helpers de formatação em pt-BR.

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export const fmtCurrency = (v: number) => brl.format(v || 0);
export const fmtCurrencyCents = (v: number) => brlCents.format(v || 0);
export const fmtInt = (v: number) => int.format(v || 0);
export const fmtDecimal = (v: number) => dec.format(v || 0);
export const fmtPercent = (v: number, digits = 1) =>
  `${(v * 100).toFixed(digits).replace(".", ",")}%`;

// Multiplicador de ROAS: 3.42 -> "3,42x"
export const fmtMultiplier = (v: number) =>
  `${dec.format(v || 0).replace(/ /g, "")}x`;

// Compacta números grandes (12.500 -> "12,5 mil").
export function fmtCompact(v: number) {
  const n = v || 0;
  if (Math.abs(n) >= 1_000_000)
    return `${dec.format(n / 1_000_000)} mi`;
  if (Math.abs(n) >= 1_000) return `${dec.format(n / 1_000)} mil`;
  return int.format(n);
}

// "2026-06-28" -> "28 jun"
export function fmtDayShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

export function fmtDateLong(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function fmtDuration(seconds: number) {
  const m = Math.floor((seconds || 0) / 60);
  const s = Math.round((seconds || 0) % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// Chave serializável de formato — usada para passar a intenção de formatação
// de Server Components para Client Components (gráficos) sem cruzar funções.
export type FmtKey =
  | "currency"
  | "currencyCents"
  | "int"
  | "decimal"
  | "compact"
  | "percent"
  | "multiplier"
  | "duration";

export function formatValue(key: FmtKey, v: number): string {
  switch (key) {
    case "currency":
      return fmtCurrency(v);
    case "currencyCents":
      return fmtCurrencyCents(v);
    case "decimal":
      return fmtDecimal(v);
    case "compact":
      return fmtCompact(v);
    case "percent":
      return fmtPercent(v);
    case "multiplier":
      return fmtMultiplier(v);
    case "duration":
      return fmtDuration(v);
    case "int":
    default:
      return fmtInt(v);
  }
}
