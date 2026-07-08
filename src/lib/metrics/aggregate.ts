import type {
  AdClickTypeMetric,
  AdConversionActionMetric,
  AdGeoMetric,
  AdGroupMetric,
  AdKeywordMetric,
  AdMetric,
  AdSearchTermMetric,
  ConversionSource,
  Platform,
  WebMetric,
} from "../types";

// Origem "WEBSITE" = disparada pelo site do cliente (via GTM). Todo o resto
// (GOOGLE_HOSTED, CALL_FROM_ADS, STORE, GOOGLE_ANALYTICS...) acontece dentro
// do Google, sem tocar o site.
export function conversionSource(origin: string): ConversionSource {
  return origin === "WEBSITE" ? "site" : "google";
}

// --------------------------- Tráfego pago (ads) ----------------------------

export type AdKpis = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // clicks / impressions
  cpc: number; // spend / clicks
  cpl: number; // spend / conversions (custo por lead/conversão)
  roas: number; // revenue / spend
  // Parcela de impressões da pesquisa, ponderada por impressões (null = sem dado)
  impressionShare: number | null;
};

export function adKpis(rows: AdMetric[]): AdKpis {
  const t = rows.reduce(
    (a, r) => {
      a.spend += r.spend;
      a.impressions += r.impressions;
      a.reach += r.reach;
      a.clicks += r.clicks;
      a.conversions += r.conversions;
      a.revenue += r.revenue;
      if (r.searchImpressionShare != null && r.impressions > 0) {
        a.shareWeighted += r.searchImpressionShare * r.impressions;
        a.shareImpressions += r.impressions;
      }
      return a;
    },
    {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      shareWeighted: 0,
      shareImpressions: 0,
    },
  );
  return {
    spend: t.spend,
    impressions: t.impressions,
    reach: t.reach,
    clicks: t.clicks,
    conversions: t.conversions,
    revenue: t.revenue,
    ctr: t.impressions ? t.clicks / t.impressions : 0,
    cpc: t.clicks ? t.spend / t.clicks : 0,
    cpl: t.conversions ? t.spend / t.conversions : 0,
    roas: t.spend ? t.revenue / t.spend : 0,
    impressionShare: t.shareImpressions
      ? t.shareWeighted / t.shareImpressions
      : null,
  };
}

export type AdDayPoint = {
  date: string;
  spend: number;
  conversions: number;
  revenue: number;
  clicks: number;
};

export function adByDay(rows: AdMetric[]): AdDayPoint[] {
  const map = new Map<string, AdDayPoint>();
  for (const r of rows) {
    const p =
      map.get(r.date) ??
      { date: r.date, spend: 0, conversions: 0, revenue: 0, clicks: 0 };
    p.spend += r.spend;
    p.conversions += r.conversions;
    p.revenue += r.revenue;
    p.clicks += r.clicks;
    map.set(r.date, p);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export type PlatformBreak = {
  platform: Platform;
  label: string;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
};

const PLATFORM_LABEL: Record<Platform, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
};

export function adByPlatform(rows: AdMetric[]): PlatformBreak[] {
  const map = new Map<Platform, PlatformBreak>();
  for (const r of rows) {
    const p =
      map.get(r.platform) ??
      {
        platform: r.platform,
        label: PLATFORM_LABEL[r.platform],
        spend: 0,
        conversions: 0,
        revenue: 0,
        roas: 0,
      };
    p.spend += r.spend;
    p.conversions += r.conversions;
    p.revenue += r.revenue;
    map.set(r.platform, p);
  }
  const out = [...map.values()];
  out.forEach((p) => (p.roas = p.spend ? p.revenue / p.spend : 0));
  return out.sort((a, b) => b.spend - a.spend);
}

export type CampaignRow = {
  platform: Platform;
  label: string;
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpl: number;
  roas: number;
};

export function adByCampaign(rows: AdMetric[]): CampaignRow[] {
  const map = new Map<string, CampaignRow>();
  for (const r of rows) {
    const key = `${r.platform}|${r.campaign}`;
    const c =
      map.get(key) ??
      {
        platform: r.platform,
        label: PLATFORM_LABEL[r.platform],
        campaign: r.campaign,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cpc: 0,
        cpl: 0,
        roas: 0,
      };
    c.spend += r.spend;
    c.impressions += r.impressions;
    c.clicks += r.clicks;
    c.conversions += r.conversions;
    c.revenue += r.revenue;
    map.set(key, c);
  }
  const out = [...map.values()];
  out.forEach((c) => {
    c.ctr = c.impressions ? c.clicks / c.impressions : 0;
    c.cpc = c.clicks ? c.spend / c.clicks : 0;
    c.cpl = c.conversions ? c.spend / c.conversions : 0;
    c.roas = c.spend ? c.revenue / c.spend : 0;
  });
  return out.sort((a, b) => b.spend - a.spend);
}

// ------------------------------ Web (GA4) ----------------------------------

export type WebKpis = {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number; // ponderado por sessões
  avgDuration: number; // ponderado por sessões
  pagesPerSession: number;
};

export function webKpis(rows: WebMetric[]): WebKpis {
  let sessions = 0,
    users = 0,
    pageviews = 0,
    bounceW = 0,
    durW = 0;
  for (const r of rows) {
    sessions += r.sessions;
    users += r.users;
    pageviews += r.pageviews;
    bounceW += r.bounceRate * r.sessions;
    durW += r.avgDuration * r.sessions;
  }
  return {
    sessions,
    users,
    pageviews,
    bounceRate: sessions ? bounceW / sessions : 0,
    avgDuration: sessions ? durW / sessions : 0,
    pagesPerSession: sessions ? pageviews / sessions : 0,
  };
}

export type WebDayPoint = { date: string; sessions: number; users: number };

export function webByDay(rows: WebMetric[]): WebDayPoint[] {
  const map = new Map<string, WebDayPoint>();
  for (const r of rows) {
    const p = map.get(r.date) ?? { date: r.date, sessions: 0, users: 0 };
    p.sessions += r.sessions;
    p.users += r.users;
    map.set(r.date, p);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export type SourceRow = {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  share: number; // fração do total de sessões
};

// --------------- Detalhamento do Google Ads (fase 7) -----------------------

export type KeywordRow = {
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpl: number;
};

export function byKeyword(rows: AdKeywordMetric[]): KeywordRow[] {
  const map = new Map<string, KeywordRow>();
  for (const r of rows) {
    const key = `${r.keyword}|${r.matchType}`;
    const k =
      map.get(key) ??
      {
        keyword: r.keyword,
        matchType: r.matchType,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpl: 0,
      };
    k.impressions += r.impressions;
    k.clicks += r.clicks;
    k.spend += r.spend;
    k.conversions += r.conversions;
    map.set(key, k);
  }
  const out = [...map.values()];
  out.forEach((k) => {
    k.ctr = k.impressions ? k.clicks / k.impressions : 0;
    k.cpc = k.clicks ? k.spend / k.clicks : 0;
    k.cpl = k.conversions ? k.spend / k.conversions : 0;
  });
  return out.sort((a, b) => b.clicks - a.clicks);
}

export type SearchTermRow = {
  searchTerm: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
};

export function bySearchTerm(rows: AdSearchTermMetric[]): SearchTermRow[] {
  const map = new Map<string, SearchTermRow>();
  for (const r of rows) {
    const s =
      map.get(r.searchTerm) ??
      {
        searchTerm: r.searchTerm,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
      };
    s.impressions += r.impressions;
    s.clicks += r.clicks;
    s.spend += r.spend;
    s.conversions += r.conversions;
    map.set(r.searchTerm, s);
  }
  const out = [...map.values()];
  out.forEach((s) => (s.ctr = s.impressions ? s.clicks / s.impressions : 0));
  return out.sort((a, b) => b.clicks - a.clicks);
}

export type AdGroupRow = {
  adGroup: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
};

export function byAdGroup(rows: AdGroupMetric[]): AdGroupRow[] {
  const map = new Map<string, AdGroupRow>();
  for (const r of rows) {
    const g =
      map.get(r.adGroup) ??
      {
        adGroup: r.adGroup,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
      };
    g.impressions += r.impressions;
    g.clicks += r.clicks;
    g.spend += r.spend;
    g.conversions += r.conversions;
    map.set(r.adGroup, g);
  }
  const out = [...map.values()];
  out.forEach((g) => {
    g.ctr = g.impressions ? g.clicks / g.impressions : 0;
    g.cpc = g.clicks ? g.spend / g.clicks : 0;
  });
  return out.sort((a, b) => b.spend - a.spend);
}

export type GeoRow = {
  region: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
};

export function byRegion(rows: AdGeoMetric[]): GeoRow[] {
  const map = new Map<string, GeoRow>();
  for (const r of rows) {
    const g =
      map.get(r.region) ??
      { region: r.region, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    g.impressions += r.impressions;
    g.clicks += r.clicks;
    g.spend += r.spend;
    g.conversions += r.conversions;
    map.set(r.region, g);
  }
  return [...map.values()].sort((a, b) => b.clicks - a.clicks);
}

export type ClickTypeRow = { clickType: string; clicks: number; share: number };

export function byClickType(rows: AdClickTypeMetric[]): ClickTypeRow[] {
  const map = new Map<string, ClickTypeRow>();
  let total = 0;
  for (const r of rows) {
    const c =
      map.get(r.clickType) ?? { clickType: r.clickType, clicks: 0, share: 0 };
    c.clicks += r.clicks;
    total += r.clicks;
    map.set(r.clickType, c);
  }
  const out = [...map.values()];
  out.forEach((c) => (c.share = total ? c.clicks / total : 0));
  return out.sort((a, b) => b.clicks - a.clicks);
}

export type ConversionActionRow = {
  actionName: string;
  actionCategory: string;
  source: ConversionSource;
  conversions: number;
  share: number; // fração dentro do próprio grupo (site ou google)
};

export type ConversionActionGroup = {
  source: ConversionSource;
  total: number;
  rows: ConversionActionRow[];
};

// Agrupa as ações por origem (site vs Google), com a participação de cada
// ação calculada dentro do seu grupo. Retorna só os grupos que têm dados.
export function byConversionActionGrouped(
  rows: AdConversionActionMetric[],
): ConversionActionGroup[] {
  const map = new Map<string, ConversionActionRow>();
  for (const r of rows) {
    const source = conversionSource(r.origin);
    const key = `${source}|${r.actionName}`;
    const a =
      map.get(key) ??
      {
        actionName: r.actionName,
        actionCategory: r.actionCategory,
        source,
        conversions: 0,
        share: 0,
      };
    a.conversions += r.conversions;
    map.set(key, a);
  }

  const groups: ConversionActionGroup[] = (["site", "google"] as const).map(
    (source) => {
      const groupRows = [...map.values()]
        .filter((a) => a.source === source)
        .sort((a, b) => b.conversions - a.conversions);
      const total = groupRows.reduce((s, a) => s + a.conversions, 0);
      groupRows.forEach((a) => (a.share = total ? a.conversions / total : 0));
      return { source, total, rows: groupRows };
    },
  );

  return groups.filter((g) => g.rows.length > 0);
}

export function webBySource(rows: WebMetric[]): SourceRow[] {
  const map = new Map<string, SourceRow>();
  let total = 0;
  for (const r of rows) {
    const key = `${r.source} / ${r.medium}`;
    const s =
      map.get(key) ?? { source: r.source, medium: r.medium, sessions: 0, users: 0, share: 0 };
    s.sessions += r.sessions;
    s.users += r.users;
    total += r.sessions;
    map.set(key, s);
  }
  const out = [...map.values()];
  out.forEach((s) => (s.share = total ? s.sessions / total : 0));
  return out.sort((a, b) => b.sessions - a.sessions);
}
