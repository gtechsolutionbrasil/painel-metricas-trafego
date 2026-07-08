import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ============================================================================
// Gera o workflow n8n "Meta Ads -> Supabase" no padrao HTTP Request nodes
// (igual ao Google Ads: Ui5tKcvG1aRmWptS). O Code node desta instancia roda
// num task-runner isolado SEM fetch e SEM $helpers — por isso todo HTTP e feito
// por nos httpRequest e os Code nodes SO transformam dados.
//
// Auth Supabase: credential existente `supabaseApi` (service role).
// Auth Meta: header Authorization Bearer com o token do node "Configurar segredos".
// ============================================================================

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const SUPABASE_URL = "https://oqsjdhrwpmpdrihgbgtx.supabase.co";
const SUPABASE_CRED = { id: "sfp0d2ZkWr7zz5wM", name: "Supabase - Painel Métricas (service role)" };
const META_VERSION = "v21.0";
// Credential httpHeaderAuth com "Authorization: Bearer <system-user-token>".
const META_CRED = { id: "HOIxAoGnU2fpRgXE", name: "Meta Graph API - Painel (system user)" };

// Allowlist canonica de conversao (conversas iniciadas + leads + compras).
const CONVERSION_LIST = `[
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
  ]`;

// ---- Code nodes (SO transformacao, sem HTTP) -------------------------------
const codeMetrics = `// 1 item de entrada = resposta /insights de UMA conta. Saida: 1 item {rows}.
const CONV = new Set(${CONVERSION_LIST});
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (v) => Math.round(num(v) * 100) / 100;
const sumA = (arr, pred) => (arr || []).filter((x) => pred(x.action_type)).reduce((s, x) => s + num(x.value), 0);
const isConv = (t) => CONV.has(String(t || "").toLowerCase());
const isRev = (t) => /purchase/.test(String(t || "").toLowerCase());

const raw = [];
for (let i = 0; i < items.length; i++) {
  const resp = items[i].json;
  const conta = $('Buscar contas Meta').itemMatching(i).json;
  for (const r of resp.data ?? []) {
    if (!r.date_start) continue;
    raw.push({
      client_id: conta.client_id,
      account_external_id: String(conta.external_id),
      date: r.date_start,
      platform: "meta",
      campaign: r.campaign_name ?? r.campaign_id ?? "Sem campanha",
      spend: money(r.spend),
      impressions: Math.round(num(r.impressions)),
      reach: Math.round(num(r.reach)),
      clicks: Math.round(num(r.clicks)),
      conversions: Math.round(sumA(r.actions, isConv)),
      revenue: money(sumA(r.action_values, isRev)),
      search_impression_share: null,
    });
  }
}
// merge de campanhas homonimas (mesmo nome, ids diferentes) por chave de upsert
const map = new Map();
for (const r of raw) {
  const k = r.date + "|" + r.account_external_id + "|" + r.campaign;
  const e = map.get(k);
  if (!e) { map.set(k, { ...r }); continue; }
  e.spend = money(e.spend + r.spend);
  e.impressions += r.impressions;
  e.reach += r.reach;
  e.clicks += r.clicks;
  e.conversions += r.conversions;
  e.revenue = money(e.revenue + r.revenue);
}
const rows = [...map.values()];
if (!rows.length) return [];
return [{ json: { rows, total: rows.length } }];`;

const codeConversions = `// Conversoes por acao (breakdown). 1 item = resposta /insights de UMA conta.
const CONV = new Set(${CONVERSION_LIST});
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const origin = (t) => {
  const v = String(t || "").toLowerCase();
  if (v.includes("fb_pixel") || v.includes("offsite_conversion")) return "WEBSITE";
  if (v.includes("messag") || v.includes("lead")) return "META";
  return "UNKNOWN";
};
const raw = [];
for (let i = 0; i < items.length; i++) {
  const resp = items[i].json;
  const conta = $('Buscar contas Meta').itemMatching(i).json;
  for (const r of resp.data ?? []) {
    if (!r.date_start) continue;
    for (const a of r.actions ?? []) {
      if (!CONV.has(String(a.action_type).toLowerCase()) || num(a.value) <= 0) continue;
      raw.push({
        client_id: conta.client_id,
        account_external_id: String(conta.external_id),
        platform: "meta",
        date: r.date_start,
        campaign: r.campaign_name ?? r.campaign_id ?? "Sem campanha",
        action_name: String(a.action_type),
        action_category: String(a.action_type),
        origin: origin(a.action_type),
        conversions: num(a.value),
      });
    }
  }
}
const map = new Map();
for (const r of raw) {
  const k = r.date + "|" + r.account_external_id + "|" + r.campaign + "|" + r.action_name;
  const e = map.get(k);
  if (!e) { map.set(k, { ...r }); continue; }
  e.conversions += r.conversions;
}
const rows = [...map.values()];
if (!rows.length) return [];
return [{ json: { rows, total: rows.length } }];`;

const codeCampaigns = `// Status das campanhas. 1 item = resposta /campaigns de UMA conta.
const RANK = { ENABLED: 3, PAUSED: 2, REMOVED: 1, UNKNOWN: 0 };
const norm = (s) => {
  const v = String(s || "").toUpperCase();
  if (v === "ACTIVE") return "ENABLED";
  if (v === "PAUSED") return "PAUSED";
  if (v === "DELETED" || v === "ARCHIVED") return "REMOVED";
  return v || "UNKNOWN";
};
const map = new Map();
for (let i = 0; i < items.length; i++) {
  const resp = items[i].json;
  const conta = $('Buscar contas Meta').itemMatching(i).json;
  for (const c of resp.data ?? []) {
    const row = {
      client_id: conta.client_id,
      account_external_id: String(conta.external_id),
      platform: "meta",
      campaign: String(c.name ?? c.id ?? "Sem campanha"),
      status: norm(c.effective_status ?? c.status),
      updated_at: new Date().toISOString(),
    };
    const k = row.account_external_id + "|" + row.campaign;
    const e = map.get(k);
    if (!e || (RANK[row.status] ?? 0) > (RANK[e.status] ?? 0)) map.set(k, row);
  }
}
const rows = [...map.values()];
if (!rows.length) return [];
return [{ json: { rows, total: rows.length } }];`;

// ---- Helpers de node -------------------------------------------------------
const supaGet = (name, id, position, table, query) => ({
  parameters: {
    method: "GET",
    url: `${SUPABASE_URL}/rest/v1/${table}`,
    authentication: "predefinedCredentialType",
    nodeCredentialType: "supabaseApi",
    sendQuery: true,
    queryParameters: { parameters: query },
    options: {},
  },
  id,
  name,
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position,
  credentials: { supabaseApi: SUPABASE_CRED },
});

const supaUpsert = (name, id, position, table, onConflict) => ({
  parameters: {
    method: "POST",
    url: `${SUPABASE_URL}/rest/v1/${table}`,
    authentication: "predefinedCredentialType",
    nodeCredentialType: "supabaseApi",
    sendQuery: true,
    queryParameters: { parameters: [{ name: "on_conflict", value: onConflict }] },
    sendHeaders: true,
    headerParameters: { parameters: [{ name: "Prefer", value: "resolution=merge-duplicates,return=minimal" }] },
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={{ JSON.stringify($json.rows) }}",
    options: {},
  },
  id,
  name,
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position,
  // Nao aborta o workflow se uma tabela falhar
  onError: "continueRegularOutput",
  credentials: { supabaseApi: SUPABASE_CRED },
});

const metaGet = (name, id, position, endpoint, query) => ({
  parameters: {
    method: "GET",
    url: `=https://graph.facebook.com/${META_VERSION}/{{ $json.external_id }}/${endpoint}`,
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    sendQuery: true,
    queryParameters: { parameters: query },
    options: {},
  },
  id,
  name,
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position,
  credentials: { httpHeaderAuth: META_CRED },
});

const codeNode = (name, id, position, jsCode) => ({
  parameters: { mode: "runOnceForAllItems", jsCode },
  id,
  name,
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position,
});

// ---- Montagem do workflow --------------------------------------------------
const workflow = {
  name: "Meta Ads -> Supabase",
  nodes: [
    { parameters: {}, id: "trigger-manual", name: "Executar manualmente", type: "n8n-nodes-base.manualTrigger", typeVersion: 1, position: [0, 0] },
    {
      parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 7 * * *" }] } },
      id: "trigger-cron", name: "Agendar 07:00", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: [0, 200],
    },
    supaGet("Buscar contas Meta", "buscar-contas", [240, 100], "integration_accounts", [
      { name: "select", value: "client_id,external_id,account_name" },
      { name: "provider", value: "eq.meta_ads" },
      { name: "status", value: "neq.paused" },
    ]),
    metaGet("Meta Insights", "meta-insights", [680, -60], "insights", [
      { name: "fields", value: "campaign_id,campaign_name,date_start,date_stop,spend,impressions,clicks,reach,actions,action_values" },
      { name: "level", value: "campaign" },
      { name: "time_increment", value: "1" },
      { name: "date_preset", value: "last_30d" },
      { name: "limit", value: "500" },
    ]),
    codeNode("Montar ad_metrics", "code-metrics", [920, -160], codeMetrics),
    supaUpsert("Upsert ad_metrics", "up-metrics", [1160, -160], "ad_metrics", "client_id,account_external_id,date,platform,campaign"),
    codeNode("Montar ad_conversion_actions", "code-conv", [920, 20], codeConversions),
    supaUpsert("Upsert ad_conversion_actions", "up-conv", [1160, 20], "ad_conversion_actions", "client_id,account_external_id,date,campaign,action_name"),
    metaGet("Meta Campaigns", "meta-campaigns", [680, 240], "campaigns", [
      { name: "fields", value: "id,name,status,effective_status" },
      { name: "limit", value: "500" },
    ]),
    codeNode("Montar ad_campaigns", "code-camp", [920, 240], codeCampaigns),
    supaUpsert("Upsert ad_campaigns", "up-camp", [1160, 240], "ad_campaigns", "client_id,account_external_id,platform,campaign"),
  ],
  connections: {
    "Executar manualmente": { main: [[{ node: "Buscar contas Meta", type: "main", index: 0 }]] },
    "Agendar 07:00": { main: [[{ node: "Buscar contas Meta", type: "main", index: 0 }]] },
    "Buscar contas Meta": {
      main: [[
        { node: "Meta Insights", type: "main", index: 0 },
        { node: "Meta Campaigns", type: "main", index: 0 },
      ]],
    },
    "Meta Insights": {
      main: [[
        { node: "Montar ad_metrics", type: "main", index: 0 },
        { node: "Montar ad_conversion_actions", type: "main", index: 0 },
      ]],
    },
    "Montar ad_metrics": { main: [[{ node: "Upsert ad_metrics", type: "main", index: 0 }]] },
    "Montar ad_conversion_actions": { main: [[{ node: "Upsert ad_conversion_actions", type: "main", index: 0 }]] },
    "Meta Campaigns": { main: [[{ node: "Montar ad_campaigns", type: "main", index: 0 }]] },
    "Montar ad_campaigns": { main: [[{ node: "Upsert ad_campaigns", type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
};

writeFileSync(
  join(root, "n8n/meta-ads-supabase.workflow.json"),
  `${JSON.stringify(workflow, null, 2)}\n`,
);

console.log(`n8n/meta-ads-supabase.workflow.json gerado (${workflow.nodes.length} nos, padrao HTTP Request).`);
