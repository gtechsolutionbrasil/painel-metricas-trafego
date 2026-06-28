import type { AdMetric, Client, DateRange, Platform, WebMetric } from "../types";

// ---------------------------------------------------------------------------
// Dados de demonstração determinísticos (mesma data => mesmos números).
// Usados quando o Supabase não está configurado (modo demonstração) e como
// base para o seed SQL de desenvolvimento.
// ---------------------------------------------------------------------------

export const MOCK_CLIENTS: Client[] = [
  { id: "cli-aurora", name: "Aurora Estética", slug: "aurora", status: "active" },
  { id: "cli-nova", name: "Nova Motors", slug: "nova", status: "active" },
  { id: "cli-vitta", name: "Vitta Saúde", slug: "vitta", status: "paused" },
];

const CAMPAigns: Record<Platform, string[]> = {
  meta: [
    "Conversão • Remarketing",
    "Tráfego • Topo de Funil",
    "Leads • Lookalike 1%",
    "Engajamento • Stories",
  ],
  google: [
    "Search • Marca",
    "Search • Genéricas",
    "Performance Max",
    "YouTube • Awareness",
  ],
};

const WEB_SOURCES: { source: string; medium: string }[] = [
  { source: "google", medium: "organic" },
  { source: "google", medium: "cpc" },
  { source: "facebook", medium: "cpc" },
  { source: "instagram", medium: "social" },
  { source: "(direct)", medium: "(none)" },
  { source: "whatsapp", medium: "referral" },
];

// Hash determinístico (FNV-1a) + PRNG (mulberry32).
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function eachDate(range: DateRange): string[] {
  const out: string[] = [];
  const d = new Date(`${range.from}T00:00:00`);
  const end = new Date(`${range.to}T00:00:00`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Fator por cliente para dar "tamanhos" diferentes às contas.
const CLIENT_SCALE: Record<string, number> = {
  "cli-aurora": 1,
  "cli-nova": 1.8,
  "cli-vitta": 0.55,
};

// Tendência de fim de semana (menos investimento) + leve crescimento ao longo do mês.
function dayFactor(iso: string): number {
  const d = new Date(`${iso}T00:00:00`);
  const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.7 : 1;
  const growth = 1 + (d.getDate() / 31) * 0.25;
  return weekend * growth;
}

export function generateAdMetrics(range: DateRange, clientId?: string): AdMetric[] {
  const clients = clientId ? [clientId] : MOCK_CLIENTS.map((c) => c.id);
  const dates = eachDate(range);
  const rows: AdMetric[] = [];

  for (const cid of clients) {
    const scale = CLIENT_SCALE[cid] ?? 1;
    for (const platform of ["meta", "google"] as Platform[]) {
      for (const campaign of CAMPAigns[platform]) {
        for (const date of dates) {
          const r = rng(hashSeed(`${cid}|${platform}|${campaign}|${date}`));
          const f = dayFactor(date) * scale;
          const spend = Math.round((60 + r() * 340) * f);
          const cpc = 0.6 + r() * 2.2; // custo por clique
          const clicks = Math.max(1, Math.round(spend / cpc));
          const ctr = 0.008 + r() * 0.03; // 0.8% a ~3.8%
          const impressions = Math.round(clicks / ctr);
          const cvr = 0.03 + r() * 0.08; // taxa de conversão
          const conversions = Math.max(0, Math.round(clicks * cvr));
          const ticket = 45 + r() * 120; // ticket médio (ROAS realista ~2-5x)
          const revenue = Math.round(conversions * ticket);
          rows.push({
            clientId: cid,
            date,
            platform,
            campaign,
            spend,
            impressions,
            clicks,
            conversions,
            revenue,
          });
        }
      }
    }
  }
  return rows;
}

export function generateWebMetrics(range: DateRange, clientId?: string): WebMetric[] {
  const clients = clientId ? [clientId] : MOCK_CLIENTS.map((c) => c.id);
  const dates = eachDate(range);
  const rows: WebMetric[] = [];

  for (const cid of clients) {
    const scale = CLIENT_SCALE[cid] ?? 1;
    for (const { source, medium } of WEB_SOURCES) {
      for (const date of dates) {
        const r = rng(hashSeed(`web|${cid}|${source}|${medium}|${date}`));
        const f = dayFactor(date) * scale;
        const sessions = Math.round((120 + r() * 900) * f);
        const users = Math.round(sessions * (0.7 + r() * 0.25));
        const pageviews = Math.round(sessions * (1.6 + r() * 2.4));
        const bounceRate = 0.28 + r() * 0.4;
        const avgDuration = Math.round(40 + r() * 220);
        rows.push({
          clientId: cid,
          date,
          source,
          medium,
          sessions,
          users,
          pageviews,
          bounceRate,
          avgDuration,
        });
      }
    }
  }
  return rows;
}
