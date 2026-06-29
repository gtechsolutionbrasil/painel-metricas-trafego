import { createSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import {
  MOCK_INTEGRATION_ACCOUNTS,
  MOCK_CLIENTS,
  generateAdMetrics,
  generateWebMetrics,
} from "../mock/data";
import type {
  AdMetric,
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
  clicks: number | string;
  conversions: number | string;
  revenue: number | string;
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

function isMissingIntegrationShape(error: unknown) {
  const message = String(
    (error as { message?: string; code?: string } | null)?.message ?? "",
  );
  return (
    message.includes("account_external_id") ||
    message.includes("integration_accounts")
  );
}

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
      "id, client_id, provider, account_name, external_id, status, website_url, last_sync_at",
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
      "client_id, account_external_id, date, platform, campaign, spend, impressions, clicks, conversions, revenue",
    )
    .gte("date", range.from)
    .lte("date", range.to);
  if (clientId) q = q.eq("client_id", clientId);
  if (platforms?.length) q = q.in("platform", platforms);
  if (accountId) q = q.eq("account_external_id", accountId);

  const result = await q;
  let error = result.error;
  let rows = result.data as AdMetricRow[] | null;
  if (error && isMissingIntegrationShape(error) && !accountId) {
    let fallback = supabase
      .from("ad_metrics")
      .select(
        "client_id, date, platform, campaign, spend, impressions, clicks, conversions, revenue",
      )
      .gte("date", range.from)
      .lte("date", range.to);
    if (clientId) fallback = fallback.eq("client_id", clientId);
    if (platforms?.length) fallback = fallback.in("platform", platforms);
    const fallbackResult = await fallback;
    rows = fallbackResult.data as AdMetricRow[] | null;
    error = fallbackResult.error;
  }
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
    clicks: Number(r.clicks),
    conversions: Number(r.conversions),
    revenue: Number(r.revenue),
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
    .lte("date", range.to);
  if (clientId) q = q.eq("client_id", clientId);
  if (accountId) q = q.eq("account_external_id", accountId);

  const result = await q;
  let error = result.error;
  let rows = result.data as WebMetricRow[] | null;
  if (error && isMissingIntegrationShape(error) && !accountId) {
    let fallback = supabase
      .from("web_metrics")
      .select(
        "client_id, date, source, medium, sessions, users, pageviews, bounce_rate, avg_duration",
      )
      .gte("date", range.from)
      .lte("date", range.to);
    if (clientId) fallback = fallback.eq("client_id", clientId);
    const fallbackResult = await fallback;
    rows = fallbackResult.data as WebMetricRow[] | null;
    error = fallbackResult.error;
  }
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

export function platformsFromSearch(
  value?: string | string[],
): Platform[] | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "google") return ["google"];
  if (raw === "meta") return ["meta"];
  return undefined;
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
