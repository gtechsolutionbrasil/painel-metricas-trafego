-- ============================================================================
-- Chave de upsert passa a incluir account_external_id.
-- ============================================================================
-- Sem isso, um cliente com DUAS contas na mesma plataforma e campanhas com o
-- mesmo nome (ex.: "Remarketing" nas duas) teria os dados mesclados: o upsert
-- do n8n sobrescreveria a linha da outra conta em vez de criar uma nova.
-- Requer a 0004 (coluna account_external_id) aplicada antes.
-- ============================================================================

-- Nomes gerados automaticamente pelo Postgres para os "unique (...)" da 0001.
alter table public.ad_metrics
  drop constraint if exists ad_metrics_client_id_date_platform_campaign_key;

alter table public.web_metrics
  drop constraint if exists web_metrics_client_id_date_source_medium_key;

alter table public.ad_metrics
  add constraint ad_metrics_upsert_key
  unique (client_id, account_external_id, date, platform, campaign);

alter table public.web_metrics
  add constraint web_metrics_upsert_key
  unique (client_id, account_external_id, date, source, medium);
