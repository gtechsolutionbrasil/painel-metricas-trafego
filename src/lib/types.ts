// Tipos compartilhados do painel — espelham o schema do Supabase.

export type Platform = "meta" | "google";

export type Client = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "paused";
  logoUrl?: string | null;
};

export type AdMetric = {
  clientId: string;
  date: string; // YYYY-MM-DD
  platform: Platform;
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
};

export type WebMetric = {
  clientId: string;
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
