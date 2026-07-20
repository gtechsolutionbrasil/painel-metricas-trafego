import { createSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import {
  MOCK_INTEGRATION_ACCOUNTS,
  MOCK_CLIENTS,
  generateAdMetrics,
  generateWebMetrics,
} from "../mock/data";
import type {
  AdCampaign,
  AdClickTypeMetric,
  AdConversionActionMetric,
  AdGeoMetric,
  AdGroupMetric,
  AdKeywordMetric,
  AdMetric,
  AdSearchTermMetric,
  Client,
  DateRange,
  IntegrationAccount,
  Platform,
  WebMetric,
} from "../types";

type AdMetricRow = {
  client_id: string;
  account_external_id?: string | null;
  date: string;
  platform: Platform;
  campaign: string;
  spend: number | string;
  impressions: number | string;
  reach?: number | string;
  clicks: number | string;
  conversions: number | string;
  revenue: number | string;
  search_impression_share?: number | string | null;
};

type WebMetricRow = {
  client_id: string;
  account_external_id?: string | null;
  date: string;
  source: string;
  medium: string;
  sessions: number | string;
  users: number | string;
  pageviews: number | string;
  bounce_rate: number | string;
  avg_duration: number | string;
};

// ---------------------------------------------------------------------------
// Acesso a dados. Com Supabase configurado, lê das tabelas (RLS aplica o
// recorte por cliente). Sem Supabase, usa dados de demonstração (mock).
// ---------------------------------------------------------------------------

function logQueryError(operation: string, error: unknown) {
  if (!error) return;
  console.error(`[metrics] ${operation} failed`, error);
}

// PostgREST devolve no máximo 1000 linhas por padrão; sem .range() explícito
// as métricas seriam truncadas SILENCIOSAMENTE e os KPIs sairiam errados.
const MAX_METRIC_ROWS = 50_000;

export async function getClients(): Promise<Client[]> {
  if (!isSupabaseConfigured) return MOCK_CLIENTS;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, slug, status, logo_url")
    .order("name");

  if (error || !data) {
    logQueryError("getClients", error);
    return [];
  }
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    status: c.status,
    logoUrl: c.logo_url,
  }));
}

export async function getIntegrationAccounts(
  clientId?: string,
): Promise<IntegrationAccount[]> {
  if (!isSupabaseConfigured) {
    return clientId
      ? MOCK_INTEGRATION_ACCOUNTS.filter((a) => a.clientId === clientId)
      : MOCK_INTEGRATION_ACCOUNTS;
  }

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("integration_accounts")
    .select(
      "id, client_id, provider, account_name, external_id, status, website_url, last_sync_at, balance_recharge, balance_recharge_date",
    )
    .order("provider")
    .order("account_name");
  if (clientId) q = q.eq("client_id", clientId);

  const { data, error } = await q;
  if (error || !data) {
    logQueryError("getIntegrationAccounts", error);
    return [];
  }

  return data.map((a) => ({
    id: a.id,
    clientId: a.client_id,
    provider: a.provider,
    accountName: a.account_name,
    externalId: a.external_id,
    status: a.status,
    websiteUrl: a.website_url,
    lastSyncAt: a.last_sync_at,
    balanceRecharge:
      a.balance_recharge == null ? null : Number(a.balance_recharge),
    balanceRechargeDate: a.balance_recharge_date,
  }));
}

export async function getAdMetrics(
  range: DateRange,
  clientId?: string,
  platforms?: Platform[],
  accountExternalId?: string,
): Promise<AdMetric[]> {
  if (!isSupabaseConfigured) {
    return filterAdMetrics(
      generateAdMetrics(range, clientId),
      platforms,
      accountExternalId,
    );
  }

  const supabase = await createSupabaseServerClient();
  const accountId = accountExternalId === "all" ? undefined : accountExternalId;
  let q = supabase
    .from("ad_metrics")
    .select(
      "client_id, account_external_id, date, platform, campaign, spend, impressions, reach, clicks, conversions, revenue, search_impression_share",
    )
    .gte("date", range.from)
    .lte("date", range.to)
    .range(0, MAX_METRIC_ROWS - 1);
  if (clientId) q = q.eq("client_id", clientId);
  if (platforms?.length) q = q.in("platform", platforms);
  if (accountId) q = q.eq("account_external_id", accountId);

  const { data, error } = await q;
  const rows = data as AdMetricRow[] | null;
  if (error || !rows) {
    logQueryError("getAdMetrics", error);
    return [];
  }
  return rows.map((r) => ({
    clientId: r.client_id,
    accountExternalId: r.account_external_id ?? "",
    date: r.date,
    platform: r.platform,
    campaign: r.campaign,
    spend: Number(r.spend),
    impressions: Number(r.impressions),
    reach: Number(r.reach ?? 0),
    clicks: Number(r.clicks),
    conversions: Number(r.conversions),
    revenue: Number(r.revenue),
    searchImpressionShare:
      r.search_impression_share == null
        ? null
        : Number(r.search_impression_share),
  }));
}

// ------------------ Detalhamento do Google Ads (fase 7) ------------------
// Tabelas alimentadas pelo workflow n8n. Sem Supabase, não há detalhamento.

type BreakdownRow = Record<string, unknown>;

async function getBreakdown(
  table: string,
  columns: string,
  range: DateRange,
  clientId?: string,
): Promise<BreakdownRow[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from(table)
    .select(columns)
    .eq("platform", "google")
    .gte("date", range.from)
    .lte("date", range.to)
    .range(0, MAX_METRIC_ROWS - 1);
  if (clientId) q = q.eq("client_id", clientId);

  const { data, error } = await q;
  if (error || !data) {
    logQueryError(`getBreakdown(${table})`, error);
    return [];
  }
  return data as unknown as BreakdownRow[];
}

export async function getAdKeywords(
  range: DateRange,
  clientId?: string,
): Promise<AdKeywordMetric[]> {
  const rows = await getBreakdown(
    "ad_keywords",
    "client_id, date, campaign, keyword, match_type, impressions, clicks, spend, conversions",
    range,
    clientId,
  );
  return rows.map((r) => ({
    clientId: String(r.client_id),
    date: String(r.date),
    campaign: String(r.campaign),
    keyword: String(r.keyword),
    matchType: String(r.match_type ?? ""),
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    spend: Number(r.spend),
    conversions: Number(r.conversions),
  }));
}

export async function getAdGeo(
  range: DateRange,
  clientId?: string,
): Promise<AdGeoMetric[]> {
  const rows = await getBreakdown(
    "ad_geo",
    "client_id, date, campaign, region, impressions, clicks, spend, conversions",
    range,
    clientId,
  );
  return rows
    // Linhas antigas eram por estado ("State of ..."); agora coletamos cidade.
    // As órfãs de estado continuam no banco, mas ficam fora do painel.
    .filter((r) => !String(r.region ?? "").startsWith("State of"))
    .map((r) => ({
      clientId: String(r.client_id),
      date: String(r.date),
      campaign: String(r.campaign),
      region: String(r.region),
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      spend: Number(r.spend),
      conversions: Number(r.conversions),
    }));
}

export async function getAdClickTypes(
  range: DateRange,
  clientId?: string,
): Promise<AdClickTypeMetric[]> {
  const rows = await getBreakdown(
    "ad_click_types",
    "client_id, date, campaign, click_type, clicks",
    range,
    clientId,
  );
  return rows.map((r) => ({
    clientId: String(r.client_id),
    date: String(r.date),
    campaign: String(r.campaign),
    clickType: String(r.click_type),
    clicks: Number(r.clicks),
  }));
}

// Campanhas do cliente com o status atual (pro filtro do painel).
export async function getAdCampaigns(
  clientId?: string,
  platform: Platform = "google",
): Promise<AdCampaign[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("ad_campaigns")
    .select("campaign, status")
    .eq("platform", platform)
    .order("campaign");
  if (clientId) q = q.eq("client_id", clientId);

  const { data, error } = await q;
  if (error || !data) {
    logQueryError("getAdCampaigns", error);
    return [];
  }
  return data.map((r) => ({
    campaign: String(r.campaign),
    status: String(r.status ?? "UNKNOWN"),
  }));
}

export async function getAdSearchTerms(
  range: DateRange,
  clientId?: string,
): Promise<AdSearchTermMetric[]> {
  const rows = await getBreakdown(
    "ad_search_terms",
    "client_id, date, campaign, search_term, impressions, clicks, spend, conversions",
    range,
    clientId,
  );
  return rows.map((r) => ({
    clientId: String(r.client_id),
    date: String(r.date),
    campaign: String(r.campaign),
    searchTerm: String(r.search_term),
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    spend: Number(r.spend),
    conversions: Number(r.conversions),
  }));
}

export async function getAdGroups(
  range: DateRange,
  clientId?: string,
): Promise<AdGroupMetric[]> {
  const rows = await getBreakdown(
    "ad_groups",
    "client_id, date, campaign, ad_group, impressions, clicks, spend, conversions",
    range,
    clientId,
  );
  return rows.map((r) => ({
    clientId: String(r.client_id),
    date: String(r.date),
    campaign: String(r.campaign),
    adGroup: String(r.ad_group),
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    spend: Number(r.spend),
    conversions: Number(r.conversions),
  }));
}

export async function getAdConversionActions(
  range: DateRange,
  clientId?: string,
): Promise<AdConversionActionMetric[]> {
  const rows = await getBreakdown(
    "ad_conversion_actions",
    "client_id, date, campaign, action_name, action_category, origin, conversions",
    range,
    clientId,
  );
  return rows.map((r) => ({
    clientId: String(r.client_id),
    date: String(r.date),
    campaign: String(r.campaign),
    actionName: String(r.action_name),
    actionCategory: String(r.action_category ?? ""),
    origin: String(r.origin ?? "UNKNOWN"),
    conversions: Number(r.conversions),
  }));
}

export async function getWebMetrics(
  range: DateRange,
  clientId?: string,
  accountExternalId?: string,
): Promise<WebMetric[]> {
  if (!isSupabaseConfigured) {
    return filterWebMetrics(generateWebMetrics(range, clientId), accountExternalId);
  }

  const supabase = await createSupabaseServerClient();
  const accountId = accountExternalId === "all" ? undefined : accountExternalId;
  let q = supabase
    .from("web_metrics")
    .select(
      "client_id, account_external_id, date, source, medium, sessions, users, pageviews, bounce_rate, avg_duration",
    )
    .gte("date", range.from)
    .lte("date", range.to)
    .range(0, MAX_METRIC_ROWS - 1);
  if (clientId) q = q.eq("client_id", clientId);
  if (accountId) q = q.eq("account_external_id", accountId);

  const { data, error } = await q;
  const rows = data as WebMetricRow[] | null;
  if (error || !rows) {
    logQueryError("getWebMetrics", error);
    return [];
  }
  return rows.map((r) => ({
    clientId: r.client_id,
    accountExternalId: r.account_external_id ?? "",
    date: r.date,
    source: r.source,
    medium: r.medium,
    sessions: Number(r.sessions),
    users: Number(r.users),
    pageviews: Number(r.pageviews),
    bounceRate: Number(r.bounce_rate),
    avgDuration: Number(r.avg_duration),
  }));
}

// Resolve o cliente selecionado (?client=slug). Vazio/"all" => todos.
export function resolveClient(
  clients: Client[],
  slug?: string | string[],
): Client | null {
  const s = Array.isArray(slug) ? slug[0] : slug;
  if (!s || s === "all") return null;
  return clients.find((c) => c.slug === s) ?? null;
}

export function resolveIntegrationAccount(
  accounts: IntegrationAccount[],
  externalId?: string | string[],
): IntegrationAccount | null {
  const id = Array.isArray(externalId) ? externalId[0] : externalId;
  if (!id || id === "all") return null;
  return accounts.find((a) => a.externalId === id) ?? null;
}

function filterAdMetrics(
  rows: AdMetric[],
  platforms?: Platform[],
  accountExternalId?: string,
) {
  const accountId = accountExternalId === "all" ? undefined : accountExternalId;
  return rows.filter((r) => {
    if (platforms?.length && !platforms.includes(r.platform)) return false;
    if (accountId && r.accountExternalId !== accountId) {
      return false;
    }
    return true;
  });
}

function filterWebMetrics(rows: WebMetric[], accountExternalId?: string) {
  const accountId = accountExternalId === "all" ? undefined : accountExternalId;
  if (!accountId) return rows;
  return rows.filter((r) => r.accountExternalId === accountId);
}

// ------------------------- Páginas do site (GA4) ---------------------------
// kind='landing' = por onde o visitante ENTROU; kind='view' = o que ele VIU.

export type WebPageMetric = {
  kind: "landing" | "view";
  page: string;
  sessions: number;
  views: number;
};

export async function getWebPages(
  range: DateRange,
  clientId?: string,
  accountExternalId?: string,
): Promise<WebPageMetric[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  const accountId = accountExternalId === "all" ? undefined : accountExternalId;
  let q = supabase
    .from("web_pages")
    .select("kind, page, sessions, views")
    .gte("date", range.from)
    .lte("date", range.to)
    .range(0, MAX_METRIC_ROWS - 1);
  if (clientId) q = q.eq("client_id", clientId);
  if (accountId) q = q.eq("account_external_id", accountId);

  const { data, error } = await q;
  if (error || !data) {
    logQueryError("getWebPages", error);
    return [];
  }
  return (data as Array<{ kind: "landing" | "view"; page: string; sessions: number | string; views: number | string }>).map(
    (r) => ({
      kind: r.kind,
      page: r.page,
      sessions: Number(r.sessions),
      views: Number(r.views),
    }),
  );
}
