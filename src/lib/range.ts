import type { DateRange } from "./types";

const iso = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const isValidIsoDate = (value: string | undefined): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return iso(fromIso(value)) === value;
};

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
  const fromRaw = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const toRaw = Array.isArray(sp.to) ? sp.to[0] : sp.to;
  if (isValidIsoDate(fromRaw) && isValidIsoDate(toRaw)) {
    const range = { from: fromRaw, to: toRaw };
    const days = rangeDays(range);
    if (days > 0 && days <= 366) return { range, days };
  }

  const daysRaw = Array.isArray(sp.days) ? sp.days[0] : sp.days;
  const days = Number(daysRaw);
  if (days && [7, 14, 30, 90].includes(days)) {
    return { range: defaultRange(days), days };
  }
  return { range: defaultRange(30), days: 30 };
}

// Número de dias entre from e to (inclusive).
export function rangeDays(r: DateRange): number {
  const a = fromIso(r.from).getTime();
  const b = fromIso(r.to).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

// Período imediatamente anterior, do mesmo tamanho (para comparação).
export function previousRange(r: DateRange): DateRange {
  const n = rangeDays(r);
  const to = fromIso(r.from);
  to.setDate(to.getDate() - 1);
  const from = new Date(to);
  from.setDate(from.getDate() - (n - 1));
  return { from: iso(from), to: iso(to) };
}

// Variação percentual (delta) entre atual e anterior, em pontos percentuais (%).
export function delta(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}
