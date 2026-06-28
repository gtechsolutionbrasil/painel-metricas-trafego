import type { DateRange } from "./types";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export const RANGE_PRESETS = [
  { days: 7, label: "7 dias" },
  { days: 14, label: "14 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
] as const;

export function defaultRange(days = 30): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: iso(from), to: iso(to) };
}

// Lê o período a partir dos searchParams (?days=30 ou ?from=&to=).
export function rangeFromSearch(
  sp: Record<string, string | string[] | undefined>,
): { range: DateRange; days: number } {
  const daysRaw = Array.isArray(sp.days) ? sp.days[0] : sp.days;
  const days = Number(daysRaw);
  if (days && [7, 14, 30, 90].includes(days)) {
    return { range: defaultRange(days), days };
  }
  return { range: defaultRange(30), days: 30 };
}

// Número de dias entre from e to (inclusive).
export function rangeDays(r: DateRange): number {
  const a = new Date(`${r.from}T00:00:00`).getTime();
  const b = new Date(`${r.to}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

// Período imediatamente anterior, do mesmo tamanho (para comparação).
export function previousRange(r: DateRange): DateRange {
  const n = rangeDays(r);
  const to = new Date(`${r.from}T00:00:00`);
  to.setDate(to.getDate() - 1);
  const from = new Date(to);
  from.setDate(from.getDate() - (n - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

// Variação percentual (delta) entre atual e anterior, em pontos percentuais (%).
export function delta(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}
