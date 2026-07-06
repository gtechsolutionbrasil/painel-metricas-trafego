-- ============================================================================
-- 0007: Origem da ação de conversão (site vs Google)
-- Distingue conversões disparadas pelo SITE do cliente (via GTM/tag de
-- conversão — origin=WEBSITE) das que acontecem dentro do Google sem tocar o
-- site (perfil da empresa/Maps, extensões de anúncio, loja). Pedido do
-- usuário pra "deixar claro o que é evento do Google Ads e o que é do site".
-- A categoria sozinha não distingue (ex.: CONTACT aparece dos dois lados).
-- Valores da API: WEBSITE, GOOGLE_HOSTED, CALL_FROM_ADS, STORE,
-- GOOGLE_ANALYTICS, APP, YOUTUBE_HOSTED, UNKNOWN.
-- ============================================================================

alter table public.ad_conversion_actions
  add column if not exists origin text not null default 'UNKNOWN';
