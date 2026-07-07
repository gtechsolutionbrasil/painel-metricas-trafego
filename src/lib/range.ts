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

// Atalhos de período no estilo do Meta Ads. Cada um resolve pra um DateRange
// concreto (from/to) com base na data de hoje.
export type PeriodShortcut = { id: string; label: string; range: () => DateRange };

const shift = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

export const PERIOD_SHORTCUTS: PeriodShortcut[] = [
  { id: "today", label: "Hoje", range: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  {
    id: "yesterday",
    label: "Ontem",
    range: () => {
      const y = shift(new Date(), -1);
      return { from: iso(y), to: iso(y) };
    },
  },
  { id: "7d", label: "Últimos 7 dias", range: () => ({ from: iso(shift(new Date(), -6)), to: iso(new Date()) }) },
  { id: "14d", label: "Últimos 14 dias", range: () => ({ from: iso(shift(new Date(), -13)), to: iso(new Date()) }) },
  { id: "30d", label: "Últimos 30 dias", range: () => ({ from: iso(shift(new Date(), -29)), to: iso(new Date()) }) },
  {
    id: "this_month",
    label: "Este mês",
    range: () => {
      const now = new Date();
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    },
  },
  {
    id: "last_month",
    label: "Mês passado",
    range: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: iso(first), to: iso(last) };
    },
  },
];

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
