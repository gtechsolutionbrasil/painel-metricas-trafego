import type { AdMetric, Platform, WebMetric } from "../types";

// --------------------------- Tráfego pago (ads) ----------------------------

export type AdKpis = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // clicks / impressions
  cpc: number; // spend / clicks
  cpl: number; // spend / conversions (custo por lead/conversão)
  roas: number; // revenue / spend
};

export function adKpis(rows: AdMetric[]): AdKpis {
  const t = rows.reduce(
    (a, r) => {
      a.spend += r.spend;
      a.impressions += r.impressions;
      a.clicks += r.clicks;
      a.conversions += r.conversions;
      a.revenue += r.revenue;
      return a;
    },
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  );
  return {
    ...t,
    ctr: t.impressions ? t.clicks / t.impressions : 0,
    cpc: t.clicks ? t.spend / t.clicks : 0,
    cpl: t.conversions ? t.spend / t.conversions : 0,
    roas: t.spend ? t.revenue / t.spend : 0,
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
