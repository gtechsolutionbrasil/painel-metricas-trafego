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

// "Hoje" no fuso do Brasil, independente de onde o código roda. Na Vercel o
// servidor é UTC: sem isso, das 21h à meia-noite (BRT) o "dia" virava antes
// da hora e os períodos deslocavam 1 dia em relação ao Meta/Google.
const TZ = "America/Sao_Paulo";
const todayBR = () =>
  fromIso(new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()));

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

// Atalhos de período no estilo do Meta Ads. Os "últimos N dias" TERMINAM ONTEM
// (o dia atual tem dados incompletos e Meta/Google não o incluem), pra o painel
// bater exatamente com as plataformas na comparação.
export type PeriodShortcut = { id: string; label: string; range: () => DateRange };

const shift = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

export const PERIOD_SHORTCUTS: PeriodShortcut[] = [
  { id: "today", label: "Hoje", range: () => ({ from: iso(todayBR()), to: iso(todayBR()) }) },
  {
    id: "yesterday",
    label: "Ontem",
    range: () => {
      const y = shift(todayBR(), -1);
      return { from: iso(y), to: iso(y) };
    },
  },
  { id: "7d", label: "Últimos 7 dias", range: () => ({ from: iso(shift(todayBR(), -7)), to: iso(shift(todayBR(), -1)) }) },
  { id: "14d", label: "Últimos 14 dias", range: () => ({ from: iso(shift(todayBR(), -14)), to: iso(shift(todayBR(), -1)) }) },
  { id: "30d", label: "Últimos 30 dias", range: () => ({ from: iso(shift(todayBR(), -30)), to: iso(shift(todayBR(), -1)) }) },
  {
    id: "this_month",
    label: "Este mês",
    range: () => {
      const now = todayBR();
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    },
  },
  {
    id: "last_month",
    label: "Mês passado",
    range: () => {
      const now = todayBR();
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: iso(first), to: iso(last) };
    },
  },
];

export function defaultRange(days = 30): DateRange {
  // Termina ONTEM (dia atual incompleto; Meta/Google não incluem hoje nos
  // "últimos N dias") pra o painel bater com as plataformas.
  const to = shift(todayBR(), -1);
  const from = shift(to, -(days - 1));
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

// De uma data fixa até HOJE (fuso BR) — usado pro gasto acumulado desde a
// recarga da conta, que precisa incluir o dia atual (saldo é "agora").
// Data de N dias atrás (fuso de São Paulo), em YYYY-MM-DD.
export function daysAgoIso(days: number): string {
  return iso(shift(todayBR(), -days));
}

export function rangeSince(from: string): DateRange {
  return { from, to: iso(todayBR()) };
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

// ---------------------------------------------------------------------------
// Base de comparação dos TrendPills (?compare= na URL). Vale pra todas as
// telas de uma vez: "prev" (default, período anterior de mesmo tamanho),
// "yoy" (mesmas datas do ano passado) ou "none" (desliga as pílulas).
export type CompareMode = "prev" | "yoy" | "none";

export function compareFromSearch(
  sp: Record<string, string | string[] | undefined>,
): CompareMode {
  const raw = Array.isArray(sp.compare) ? sp.compare[0] : sp.compare;
  return raw === "yoy" || raw === "none" ? raw : "prev";
}

// Período de comparação conforme a base; null = sem comparação.
export function comparisonRange(
  r: DateRange,
  mode: CompareMode,
): DateRange | null {
  if (mode === "none") return null;
  if (mode === "yoy") {
    const shiftYear = (value: string) => {
      const d = fromIso(value);
      d.setFullYear(d.getFullYear() - 1);
      return iso(d);
    };
    return { from: shiftYear(r.from), to: shiftYear(r.to) };
  }
  return previousRange(r);
}

// Texto do tooltip da pílula de variação, por base.
export const COMPARE_TITLES: Record<Exclude<CompareMode, "none">, string> = {
  prev: "Variação em relação ao período anterior de mesmo tamanho",
  yoy: "Variação em relação ao mesmo período do ano passado",
};
