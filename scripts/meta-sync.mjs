// Coleta Meta Ads -> Supabase. Mesma logica do workflow n8n
// (n8n/meta-ads-supabase.workflow.json), rodavel localmente para backfill/teste.
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... META_ACCESS_TOKEN=... node scripts/meta-sync.mjs
// Le as contas de integration_accounts (provider=meta_ads) e faz upsert em
// ad_metrics, ad_campaigns e ad_conversion_actions (platform='meta').

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const DATE_PRESET = process.env.META_DATE_PRESET || "last_30d";
const STARTED_AT = new Date().toISOString();

if (!SUPABASE_URL || !SERVICE_KEY || !META_TOKEN) {
  console.error("Faltam env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, META_ACCESS_TOKEN");
  process.exit(1);
}

// Allowlist canonica de conversao (ver workflow para a justificativa).
const CONVERSION_ACTION_TYPES = new Set([
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.lead_grouped",
  "lead",
  "leadgen_grouped",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.fb_pixel_complete_registration",
  "onsite_conversion.purchase",
  "offsite_conversion.fb_pixel_purchase",
  "omni_purchase",
  "purchase",
]);

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const int = (v) => Math.round(num(v));
const money = (v) => Math.round(num(v) * 100) / 100;
const isConversion = (t) => CONVERSION_ACTION_TYPES.has(String(t || "").toLowerCase());
const isRevenue = (t) => /purchase|omni_purchase|fb_pixel_purchase/.test(String(t || "").toLowerCase());

function actionOrigin(t) {
  const v = String(t || "").toLowerCase();
  if (v.includes("fb_pixel") || v.includes("offsite_conversion")) return "WEBSITE";
  if (v.includes("messag") || v.includes("whatsapp") || v.includes("leadgen") || v.includes("lead")) return "META";
  return "UNKNOWN";
}

function sumActions(actions, pred) {
  return (actions || []).filter((a) => pred(a.action_type)).reduce((s, a) => s + num(a.value), 0);
}

async function sb(method, path, { params = {}, body, prefer } = {}) {
  const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const url = `${SUPABASE_URL}/rest/v1/${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

async function upsert(table, rows, onConflict) {
  if (!rows.length) return 0;
  for (let i = 0; i < rows.length; i += 500) {
    await sb("POST", table, {
      params: { on_conflict: onConflict },
      body: rows.slice(i, i + 500),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }
  return rows.length;
}

async function metaGetAll(path, params) {
  const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  let url = `https://graph.facebook.com/${API_VERSION}/${path}?${qs}&access_token=${META_TOKEN}`;
  const out = [];
  while (url) {
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) throw new Error(`Meta API: ${json.error.message}`);
    if (Array.isArray(json.data)) out.push(...json.data);
    url = json.paging?.next || null;
  }
  return out;
}

const normStatus = (s) => {
  const v = String(s || "").toUpperCase();
  if (v === "ACTIVE") return "ENABLED";
  if (v === "PAUSED") return "PAUSED";
  if (v === "DELETED" || v === "ARCHIVED") return "REMOVED";
  return v || "UNKNOWN";
};

async function syncAccount(acc) {
  const campName = (r) => String(r.campaign_name || r.campaign_id || "Sem campanha");
  const insights = await metaGetAll(`${acc.external_id}/insights`, {
    fields: "campaign_id,campaign_name,date_start,date_stop,spend,impressions,clicks,reach,actions,action_values",
    level: "campaign",
    time_increment: 1,
    date_preset: DATE_PRESET,
    limit: 500,
  });
  const campaigns = await metaGetAll(`${acc.external_id}/campaigns`, {
    fields: "id,name,status,effective_status",
    limit: 500,
  });

  const metricRows = insights.filter((r) => r.date_start).map((r) => ({
    client_id: acc.client_id,
    account_external_id: acc.external_id,
    date: r.date_start,
    platform: "meta",
    campaign: campName(r),
    spend: money(r.spend),
    impressions: int(r.impressions),
    clicks: int(r.clicks),
    conversions: int(sumActions(r.actions, isConversion)),
    revenue: money(sumActions(r.action_values, isRevenue)),
    search_impression_share: null,
  }));

  const conversionRows = insights.filter((r) => r.date_start).flatMap((r) =>
    (r.actions || []).filter((a) => isConversion(a.action_type) && num(a.value) > 0).map((a) => ({
      client_id: acc.client_id,
      account_external_id: acc.external_id,
      platform: "meta",
      date: r.date_start,
      campaign: campName(r),
      action_name: String(a.action_type),
      action_category: String(a.action_type),
      origin: actionOrigin(a.action_type),
      conversions: num(a.value),
    })),
  );

  const campaignRows = campaigns.map((c) => ({
    client_id: acc.client_id,
    account_external_id: acc.external_id,
    platform: "meta",
    campaign: String(c.name || c.id || "Sem campanha"),
    status: normStatus(c.effective_status || c.status),
    updated_at: STARTED_AT,
  }));

  const m = await upsert("ad_metrics", metricRows, "client_id,account_external_id,date,platform,campaign");
  const cv = await upsert("ad_conversion_actions", conversionRows, "client_id,account_external_id,date,campaign,action_name");
  const cp = await upsert("ad_campaigns", campaignRows, "client_id,account_external_id,platform,campaign");

  await sb("PATCH", "integration_accounts", {
    params: { id: `eq.${acc.id}` },
    body: { status: "connected", last_sync_at: STARTED_AT },
    prefer: "return=minimal",
  });
  await sb("POST", "sync_runs", {
    body: [{ platform: "meta", client_id: acc.client_id, status: "success", rows: m,
      message: `Meta OK ${acc.account_name}: ${m} metricas, ${cp} campanhas, ${cv} conversoes.`, ran_at: STARTED_AT }],
    prefer: "return=minimal",
  });

  console.log(`${acc.account_name}: ${m} metricas, ${cp} campanhas, ${cv} linhas de conversao`);
  const totalConv = metricRows.reduce((s, r) => s + r.conversions, 0);
  const totalSpend = metricRows.reduce((s, r) => s + r.spend, 0);
  console.log(`  -> gasto R$${totalSpend.toFixed(2)} | conversoes (conversas) ${totalConv}`);
}

const accounts = await sb("GET", "integration_accounts", {
  params: { select: "id,client_id,account_name,external_id,status", provider: "eq.meta_ads" },
});
if (!accounts?.length) {
  console.log("Nenhuma conta meta_ads em integration_accounts.");
  process.exit(0);
}
for (const acc of accounts) {
  try {
    await syncAccount(acc);
  } catch (e) {
    console.error(`ERRO ${acc.account_name}: ${e.message}`);
  }
}
console.log("Concluido.");
