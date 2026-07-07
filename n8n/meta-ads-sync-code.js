/* global $helpers, $vars, $input */

const SUPABASE_URL = requiredConfig("SUPABASE_URL").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = requiredConfig("SUPABASE_SERVICE_ROLE_KEY");
const META_ACCESS_TOKEN = requiredConfig("META_ACCESS_TOKEN");
const META_GRAPH_API_VERSION = configValue("META_GRAPH_API_VERSION", "v21.0").replace(/^\/+/, "");
const META_DATE_PRESET = configValue("META_DATE_PRESET", "last_30d");
const STARTED_AT = new Date().toISOString();

const SUPABASE_BATCH_SIZE = 500;

function inputConfig() {
  return $input.first()?.json || {};
}

function configValue(name, fallback = "") {
  const fromInput = inputConfig()[name];
  const fromVars = $vars?.[name];
  const value = fromInput ?? fromVars;
  const text = value == null ? "" : String(value).trim();

  return text || fallback;
}

function requiredConfig(name) {
  const value = configValue(name);
  if (!value || value.startsWith("COLE_AQUI_")) {
    throw new Error(`Configure o campo ${name} no node "Configurar segredos".`);
  }
  return value;
}

function numeric(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function integer(value) {
  return Math.round(numeric(value));
}

function money(value) {
  return Math.round(numeric(value) * 100) / 100;
}

function buildUrl(base, params = {}) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function requestJson(method, url, { headers = {}, params = {}, body } = {}) {
  const fullUrl = buildUrl(url, params);
  try {
    return await $helpers.httpRequest({
      method,
      url: fullUrl,
      headers,
      body,
      json: true,
    });
  } catch (error) {
    const message = error?.message || String(error);
    throw new Error(`${method} ${fullUrl} falhou: ${message}`);
  }
}

async function supabaseRequest(method, path, { params = {}, body, headers = {} } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path.replace(/^\/+/, "")}`;
  return requestJson(method, url, {
    params,
    body,
    headers: supabaseHeaders(headers),
  });
}

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return 0;

  let count = 0;
  for (let i = 0; i < rows.length; i += SUPABASE_BATCH_SIZE) {
    const chunk = rows.slice(i, i + SUPABASE_BATCH_SIZE);
    await supabaseRequest("POST", table, {
      params: { on_conflict: onConflict },
      body: chunk,
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
    count += chunk.length;
  }
  return count;
}

async function patchIntegrationAccount(id, fields) {
  await supabaseRequest("PATCH", "integration_accounts", {
    params: { id: `eq.${id}` },
    body: fields,
    headers: { Prefer: "return=minimal" },
  });
}

async function insertSyncRun(row) {
  await supabaseRequest("POST", "sync_runs", {
    body: [row],
    headers: { Prefer: "return=minimal" },
  });
}

async function fetchMetaAccounts() {
  return supabaseRequest("GET", "integration_accounts", {
    params: {
      select: "id,client_id,account_name,external_id,status",
      provider: "eq.meta_ads",
      status: "in.(pending,connected,error)",
    },
  });
}

function metaHeaders() {
  return {
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
  };
}

async function metaGet(path, params = {}) {
  const endpoint = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${path.replace(/^\/+/, "")}`;
  return requestJson("GET", endpoint, {
    headers: metaHeaders(),
    params,
  });
}

async function metaGetAll(path, params = {}) {
  let response = await metaGet(path, params);
  const rows = [];

  while (response) {
    if (Array.isArray(response.data)) {
      rows.push(...response.data);
    }

    const next = response.paging?.next;
    if (!next) break;

    response = await requestJson("GET", next, { headers: metaHeaders() });
  }

  return rows;
}

function isConversionAction(actionType) {
  const value = String(actionType || "").toLowerCase();
  if (!value) return false;

  const ignored = [
    "link_click",
    "landing_page_view",
    "page_engagement",
    "post_engagement",
    "post_reaction",
    "video_view",
    "comment",
  ];
  if (ignored.includes(value)) return false;

  return /lead|contact|messag|conversation|whatsapp|submit|schedule|appointment|form|purchase|complete_registration|phone_call|call/.test(
    value,
  );
}

function isRevenueAction(actionType) {
  return /purchase|omni_purchase|fb_pixel_purchase/.test(String(actionType || "").toLowerCase());
}

function actionOrigin(actionType) {
  const value = String(actionType || "").toLowerCase();
  if (value.includes("fb_pixel") || value.includes("offsite_conversion")) {
    return "WEBSITE";
  }
  if (value.includes("messag") || value.includes("whatsapp") || value.includes("leadgen")) {
    return "META";
  }
  return "UNKNOWN";
}

function conversionTotal(actions = []) {
  return actions
    .filter((action) => isConversionAction(action.action_type))
    .reduce((sum, action) => sum + numeric(action.value), 0);
}

function revenueTotal(actionValues = []) {
  return actionValues
    .filter((action) => isRevenueAction(action.action_type))
    .reduce((sum, action) => sum + numeric(action.value), 0);
}

function normalizeStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "ACTIVE") return "ENABLED";
  if (value === "PAUSED") return "PAUSED";
  if (value === "DELETED" || value === "ARCHIVED") return "REMOVED";
  return value || "UNKNOWN";
}

function campaignName(row) {
  return String(row.campaign_name || row.campaign_id || "Sem campanha");
}

function mapMetric(account, row) {
  return {
    client_id: account.client_id,
    account_external_id: account.external_id,
    date: row.date_start,
    platform: "meta",
    campaign: campaignName(row),
    spend: money(row.spend),
    impressions: integer(row.impressions),
    clicks: integer(row.clicks),
    conversions: integer(conversionTotal(row.actions || [])),
    revenue: money(revenueTotal(row.action_values || [])),
    search_impression_share: null,
  };
}

function mapConversionActions(account, row) {
  return (row.actions || [])
    .filter((action) => isConversionAction(action.action_type) && numeric(action.value) > 0)
    .map((action) => ({
      client_id: account.client_id,
      account_external_id: account.external_id,
      platform: "meta",
      date: row.date_start,
      campaign: campaignName(row),
      action_name: String(action.action_type),
      action_category: String(action.action_type),
      origin: actionOrigin(action.action_type),
      conversions: numeric(action.value),
    }));
}

function mapCampaign(account, row) {
  return {
    client_id: account.client_id,
    account_external_id: account.external_id,
    platform: "meta",
    campaign: String(row.name || row.id || "Sem campanha"),
    status: normalizeStatus(row.effective_status || row.status),
    updated_at: STARTED_AT,
  };
}

async function collectAccount(account) {
  const insights = await metaGetAll(`${account.external_id}/insights`, {
    fields:
      "campaign_id,campaign_name,date_start,date_stop,spend,impressions,clicks,reach,actions,action_values",
    level: "campaign",
    time_increment: 1,
    date_preset: META_DATE_PRESET,
    limit: 500,
  });

  const campaigns = await metaGetAll(`${account.external_id}/campaigns`, {
    fields: "id,name,status,effective_status",
    limit: 500,
  });

  const metricRows = insights.filter((row) => row.date_start).map((row) => mapMetric(account, row));
  const conversionRows = insights
    .filter((row) => row.date_start)
    .flatMap((row) => mapConversionActions(account, row));
  const campaignRows = campaigns.map((row) => mapCampaign(account, row));

  return { metricRows, conversionRows, campaignRows };
}

async function syncAccount(account) {
  try {
    const { metricRows, conversionRows, campaignRows } = await collectAccount(account);

    const metrics = await upsert(
      "ad_metrics",
      metricRows,
      "client_id,account_external_id,date,platform,campaign",
    );
    const conversions = await upsert(
      "ad_conversion_actions",
      conversionRows,
      "client_id,account_external_id,date,campaign,action_name",
    );
    const campaigns = await upsert(
      "ad_campaigns",
      campaignRows,
      "client_id,account_external_id,platform,campaign",
    );

    await patchIntegrationAccount(account.id, {
      status: "connected",
      last_sync_at: STARTED_AT,
    });

    await insertSyncRun({
      platform: "meta",
      client_id: account.client_id,
      status: "success",
      rows: metrics,
      message: `Meta Ads OK: ${metrics} metricas, ${campaigns} campanhas, ${conversions} conversoes.`,
      ran_at: STARTED_AT,
    });

    return {
      account: account.account_name,
      externalId: account.external_id,
      status: "success",
      metrics,
      campaigns,
      conversions,
    };
  } catch (error) {
    const message = error?.message || String(error);

    await patchIntegrationAccount(account.id, {
      status: "error",
      last_sync_at: STARTED_AT,
    });

    await insertSyncRun({
      platform: "meta",
      client_id: account.client_id,
      status: "error",
      rows: 0,
      message: `Meta Ads erro em ${account.external_id}: ${message}`.slice(0, 500),
      ran_at: STARTED_AT,
    });

    return {
      account: account.account_name,
      externalId: account.external_id,
      status: "error",
      message,
    };
  }
}

const accounts = await fetchMetaAccounts();

if (!Array.isArray(accounts) || accounts.length === 0) {
  return [
    {
      json: {
        status: "skipped",
        message: "Nenhuma integration_accounts provider=meta_ads status pending/connected/error encontrada.",
        ranAt: STARTED_AT,
      },
    },
  ];
}

const summaries = [];
for (const account of accounts) {
  summaries.push(await syncAccount(account));
}

return summaries.map((summary) => ({
  json: {
    ...summary,
    ranAt: STARTED_AT,
    datePreset: META_DATE_PRESET,
    graphApiVersion: META_GRAPH_API_VERSION,
  },
}));
