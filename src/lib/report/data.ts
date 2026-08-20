// ---------------------------------------------------------------------------
// Dados do relatório de prestação de contas (o que a página /relatorio imprime).
// Tudo em linguagem de cliente: nada de jargão de plataforma, nada de custo
// unitário (decisão do usuário — o cliente vê o investido e o que ele gerou).
// ---------------------------------------------------------------------------
import {
  getAdClickTypes,
  getAdConversionActions,
  getAdGroups,
  getAdMetrics,
  getIntegrationAccounts,
} from "@/lib/metrics/queries";
import { rangeDays } from "@/lib/range";
import type { DateRange, Platform } from "@/lib/types";
import {
  actionKind,
  actionLabel,
  campaignLabel,
  campaignNote,
  clickTypeLabel,
  clickTypeNote,
  adGroupLabel,
  adGroupNote,
} from "@/lib/report/labels";

export type ReportPlatform = {
  platform: Platform;
  label: string;
  spend: number;
  share: number;
  impressions: number;
  reach: number;
  clicks: number;
  activeDays: number;
  firstDay: string;
  lastDay: string;
};

export type ReportBar = {
  label: string;
  note: string | null;
  value: number;
  share: number;
};

export type ReportWeek = {
  topLabel: string;
  bottomLabel: string;
  total: number;
  google: number;
  meta: number;
};

export type ReportContactRow = {
  label: string;
  google: number;
  meta: number;
};

export type ReportBalance = {
  label: string;
  available: number;
  limit: number | null;
  spent: number | null;
  stopped: boolean;
};

export type ReportData = {
  clientName: string;
  range: DateRange;
  days: number;
  hasData: boolean;
  platforms: ReportPlatform[];
  totals: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    googleContacts: number;
    metaConversations: number;
    directions: number;
    storeVisits: number;
    profileViews: number;
    profileEngagements: number;
  };
  weeks: ReportWeek[];
  googleCampaigns: ReportBar[];
  googleAdGroups: ReportBar[];
  googleClickTypes: ReportBar[];
  metaCampaigns: ReportBar[];
  contactRows: ReportContactRow[];
  balances: ReportBalance[];
};

const PLATFORM_LABEL: Record<Platform, string> = {
  google: "Google",
  meta: "Instagram e Facebook",
};

const sum = <T,>(rows: T[], pick: (r: T) => number) =>
  rows.reduce((s, r) => s + pick(r), 0);

// Agrupa somando o valor e devolve ordenado do maior pro menor. O agrupamento
// é pelo RÓTULO final, não pela chave crua: duas campanhas com nomes diferentes
// que viram o mesmo rótulo ("Busca do Google") entram como uma linha só.
function ranked<T>(
  rows: T[],
  key: (r: T) => string,
  value: (r: T) => number,
  label: (k: string) => string,
  note: (k: string) => string | null,
): ReportBar[] {
  const map = new Map<string, { value: number; note: string | null }>();
  for (const r of rows) {
    const raw = key(r);
    const l = label(raw);
    const e = map.get(l) ?? { value: 0, note: note(raw) };
    e.value += value(r);
    map.set(l, e);
  }
  const entries = [...map.entries()].filter(([, v]) => v.value > 0);
  const total = entries.reduce((s, [, v]) => s + v.value, 0);
  return entries
    .sort((a, b) => b[1].value - a[1].value)
    .map(([l, v]) => ({
      label: l,
      note: v.note,
      value: v.value,
      share: total ? v.value / total : 0,
    }));
}

// Semanas de 7 dias a partir do início do período (a última pode ser parcial).
function weeksOf(range: DateRange, rows: { date: string; platform: Platform; spend: number }[]) {
  const start = new Date(`${range.from}T12:00:00`);
  const buckets = new Map<number, { google: number; meta: number }>();
  for (const r of rows) {
    const d = new Date(`${r.date}T12:00:00`);
    const idx = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000));
    const b = buckets.get(idx) ?? { google: 0, meta: 0 };
    b[r.platform] += r.spend;
    buckets.set(idx, b);
  }
  const totalWeeks = Math.ceil(rangeDays(range) / 7);
  const end = new Date(`${range.to}T12:00:00`);
  const dm = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const weeks: ReportWeek[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    const from = new Date(start.getTime() + i * 7 * 86400000);
    const rawTo = new Date(from.getTime() + 6 * 86400000);
    const to = rawTo > end ? end : rawTo;
    const b = buckets.get(i) ?? { google: 0, meta: 0 };
    // Mesma mês: "05–11 / jul". Meses diferentes: "05/07 / 11/08".
    const sameMonth = from.getMonth() === to.getMonth();
    weeks.push({
      topLabel: sameMonth
        ? `${String(from.getDate()).padStart(2, "0")}–${String(to.getDate()).padStart(2, "0")}`
        : dm(from),
      bottomLabel: sameMonth ? MES[from.getMonth()] : dm(to),
      total: b.google + b.meta,
      google: b.google,
      meta: b.meta,
    });
  }
  return weeks;
}

export async function getReportData(
  range: DateRange,
  clientId: string | undefined,
  clientName: string,
): Promise<ReportData> {
  const [ads, actions, clickTypes, adGroups, accounts] = await Promise.all([
    getAdMetrics(range, clientId),
    getAdConversionActions(range, clientId),
    getAdClickTypes(range, clientId),
    getAdGroups(range, clientId),
    getIntegrationAccounts(clientId),
  ]);

  const byPlatform = (p: Platform) => ads.filter((r) => r.platform === p);

  const spendTotal = sum(ads, (r) => r.spend);
  const platforms: ReportPlatform[] = (["google", "meta"] as const)
    .map((platform) => {
      const rows = byPlatform(platform).filter((r) => r.spend > 0);
      const dates = [...new Set(rows.map((r) => r.date))].sort();
      return {
        platform,
        label: PLATFORM_LABEL[platform],
        spend: sum(rows, (r) => r.spend),
        share: spendTotal ? sum(rows, (r) => r.spend) / spendTotal : 0,
        impressions: sum(rows, (r) => r.impressions),
        reach: sum(rows, (r) => r.reach),
        clicks: sum(rows, (r) => r.clicks),
        activeDays: dates.length,
        firstDay: dates[0] ?? range.from,
        lastDay: dates[dates.length - 1] ?? range.to,
      };
    })
    .filter((p) => p.spend > 0);

  // Ações: cada linha entra em um dos baldes (contato, rota, site, perfil).
  const actionTotals = {
    googleContact: 0,
    directions: 0,
    storeVisits: 0,
    profileViews: 0,
    engagements: 0,
  };
  const contactMap = new Map<string, { google: number; meta: number }>();
  for (const a of actions) {
    const kind = actionKind(a.actionName, a.actionCategory);
    if (kind === "ignore") continue;
    const platform = a.platform;
    if (kind === "contact") {
      if (platform !== "google") continue;
      actionTotals.googleContact += a.conversions;
      const label = actionLabel(a.actionName);
      const e = contactMap.get(label) ?? { google: 0, meta: 0 };
      e[platform] += a.conversions;
      contactMap.set(label, e);
    } else if (kind === "directions") {
      actionTotals.directions += a.conversions;
    } else if (kind === "storeVisit") {
      // Estimativa modelada, não contagem: soma cru e arredonda uma vez só no
      // total. Hoje o Google entrega inteiro nesta conta, mas o campo é
      // numérico e arredondar linha a linha acumularia erro se deixar de ser.
      actionTotals.storeVisits += a.conversions;
    } else if (kind === "profileView") {
      actionTotals.profileViews += a.conversions;
    } else if (kind === "engagement") {
      actionTotals.engagements += a.conversions;
    }
  }

  // Meta usa a conversa iniciada da linha de campanha como leitura canônica.
  // Não somamos com Google nem recontamos os vários action_types do Meta.
  const metaConversations = sum(byPlatform("meta"), (r) => r.conversions);
  if (metaConversations > 0) {
    contactMap.set("Conversas iniciadas no Instagram/Facebook", {
      google: 0,
      meta: metaConversations,
    });
  }

  const contactRows: ReportContactRow[] = [...contactMap.entries()]
    .map(([label, v]) => ({
      label,
      google: Math.round(v.google),
      meta: Math.round(v.meta),
    }))
    .filter((r) => r.google > 0 || r.meta > 0)
    .sort((a, b) => Math.max(b.google, b.meta) - Math.max(a.google, a.meta));

  const balances: ReportBalance[] = accounts
    .filter((a) => a.provider !== "ga4" && a.balanceAvailable != null)
    .map((a) => ({
      label: a.provider === "meta_ads" ? "Meta Ads (Instagram e Facebook)" : "Google Ads",
      available: a.balanceAvailable as number,
      limit: a.balanceLimit ?? null,
      spent: a.balanceSpent ?? null,
      stopped: (a.balanceAvailable as number) <= 0,
    }));

  return {
    clientName,
    range,
    days: rangeDays(range),
    hasData: ads.length > 0,
    platforms,
    totals: {
      spend: spendTotal,
      impressions: sum(ads, (r) => r.impressions),
      reach: sum(ads, (r) => r.reach),
      clicks: sum(ads, (r) => r.clicks),
      googleContacts: Math.round(actionTotals.googleContact),
      metaConversations: Math.round(metaConversations),
      directions: Math.round(actionTotals.directions),
      storeVisits: Math.round(actionTotals.storeVisits),
      profileViews: Math.round(actionTotals.profileViews),
      profileEngagements: Math.round(actionTotals.engagements),
    },
    weeks: weeksOf(range, ads),
    googleCampaigns: ranked(
      byPlatform("google"),
      (r) => r.campaign,
      (r) => r.spend,
      campaignLabel,
      campaignNote,
    ),
    googleAdGroups: ranked(
      adGroups,
      (r) => r.adGroup,
      (r) => r.spend,
      adGroupLabel,
      adGroupNote,
    ),
    googleClickTypes: ranked(
      clickTypes,
      (r) => r.clickType,
      (r) => r.clicks,
      clickTypeLabel,
      clickTypeNote,
    ),
    metaCampaigns: ranked(
      byPlatform("meta"),
      (r) => r.campaign,
      (r) => r.spend,
      campaignLabel,
      campaignNote,
    ),
    contactRows,
    balances,
  };
}
