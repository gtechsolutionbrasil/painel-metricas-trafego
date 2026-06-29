import { createSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import {
  MOCK_CLIENTS,
  generateAdMetrics,
  generateWebMetrics,
} from "../mock/data";
import type { AdMetric, Client, DateRange, WebMetric } from "../types";

// ---------------------------------------------------------------------------
// Acesso a dados. Com Supabase configurado, lê das tabelas (RLS aplica o
// recorte por cliente). Sem Supabase, usa dados de demonstração (mock).
// ---------------------------------------------------------------------------

function logQueryError(operation: string, error: unknown) {
  if (!error) return;
  console.error(`[metrics] ${operation} failed`, error);
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

export async function getAdMetrics(
  range: DateRange,
  clientId?: string,
): Promise<AdMetric[]> {
  if (!isSupabaseConfigured) return generateAdMetrics(range, clientId);

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("ad_metrics")
    .select(
      "client_id, date, platform, campaign, spend, impressions, clicks, conversions, revenue",
    )
    .gte("date", range.from)
    .lte("date", range.to);
  if (clientId) q = q.eq("client_id", clientId);

  const { data, error } = await q;
  if (error || !data) {
    logQueryError("getAdMetrics", error);
    return [];
  }
  return data.map((r) => ({
    clientId: r.client_id,
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
): Promise<WebMetric[]> {
  if (!isSupabaseConfigured) return generateWebMetrics(range, clientId);

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("web_metrics")
    .select(
      "client_id, date, source, medium, sessions, users, pageviews, bounce_rate, avg_duration",
    )
    .gte("date", range.from)
    .lte("date", range.to);
  if (clientId) q = q.eq("client_id", clientId);

  const { data, error } = await q;
  if (error || !data) {
    logQueryError("getWebMetrics", error);
    return [];
  }
  return data.map((r) => ({
    clientId: r.client_id,
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
