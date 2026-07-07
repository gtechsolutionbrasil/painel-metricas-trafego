// Tipos compartilhados do painel — espelham o schema do Supabase.

export type Platform = "meta" | "google";

export type IntegrationProvider = "google_ads" | "meta_ads" | "ga4" | "gtm";

export type IntegrationStatus = "pending" | "connected" | "error" | "paused";

export type Client = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "paused";
  logoUrl?: string | null;
};

export type IntegrationAccount = {
  id: string;
  clientId: string;
  provider: IntegrationProvider;
  accountName: string;
  externalId: string;
  status: IntegrationStatus;
  websiteUrl?: string | null;
  lastSyncAt?: string | null;
};

export type AdMetric = {
  clientId: string;
  accountExternalId?: string;
  date: string; // YYYY-MM-DD
  platform: Platform;
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  // Parcela de impressões da rede de pesquisa (0..1; null quando não se aplica)
  searchImpressionShare?: number | null;
};

// ------------------ Detalhamento do Google Ads (fase 7) ------------------

export type AdKeywordMetric = {
  clientId: string;
  date: string;
  campaign: string;
  keyword: string;
  matchType: string; // EXACT | PHRASE | BROAD
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
};

export type AdGeoMetric = {
  clientId: string;
  date: string;
  campaign: string;
  region: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
};

export type AdClickTypeMetric = {
  clientId: string;
  date: string;
  campaign: string;
  clickType: string; // CALLS | GET_DIRECTIONS | URL_CLICKS | ...
  clicks: number;
};

// Status atual de uma campanha (pro filtro ativas/pausadas).
export type AdCampaign = {
  campaign: string;
  status: string; // ENABLED | PAUSED | UNKNOWN
};

export type AdSearchTermMetric = {
  clientId: string;
  date: string;
  campaign: string;
  searchTerm: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
};

export type AdGroupMetric = {
  clientId: string;
  date: string;
  campaign: string;
  adGroup: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
};

export type AdConversionActionMetric = {
  clientId: string;
  date: string;
  campaign: string;
  actionName: string;
  actionCategory: string; // PHONE_CALL_LEAD | SUBMIT_LEAD_FORM | ...
  // Origem da ação: WEBSITE (site do cliente, via GTM) vs GOOGLE_HOSTED /
  // CALL_FROM_ADS / STORE / ... (dentro do Google, sem tocar o site).
  origin: string;
  conversions: number;
};

// Grupo de origem simplificado pra UI: o que é do site vs do Google.
export type ConversionSource = "site" | "google";

export type WebMetric = {
  clientId: string;
  accountExternalId?: string;
  date: string; // YYYY-MM-DD
  source: string;
  medium: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number; // 0..1
  avgDuration: number; // segundos
};

// Janela de período selecionada no topo do painel.
export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};
