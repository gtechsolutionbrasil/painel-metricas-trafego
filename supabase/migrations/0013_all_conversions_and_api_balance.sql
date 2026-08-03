-- ============================================================================
-- 1) Ações de conversão: guardar TODAS as ações, não só as metas de lance.
-- ============================================================================
-- metrics.conversions traz apenas as ações marcadas como meta de lance da
-- campanha. Ficavam de fora contatos reais (ligação pelo perfil na Busca,
-- rotas da Busca, visitas à loja, cliques no site pelo perfil), o que
-- subcontava os contatos praticamente pela metade. metrics.all_conversions
-- traz o total. Mantemos as duas colunas: conversions = meta de lance
-- (usada pelo algoritmo), all_conversions = ação total (usada no relatório).
-- ============================================================================

alter table public.ad_conversion_actions
  add column if not exists all_conversions numeric(10, 2) not null default 0;

-- ============================================================================
-- 2) Saldo das contas de anúncio direto da API (substitui a recarga manual).
-- ============================================================================
-- Ao contrário do que se supôs na 0012, as duas plataformas expõem saldo:
--   Google: GAQL em account_budget (approved_spending_limit x amount_served)
--   Meta:   /act_<id>?fields=balance,amount_spent,spend_cap
-- balance_recharge/balance_recharge_date continuam existindo como fallback
-- manual para contas sem esses dados.
-- ============================================================================

alter table public.integration_accounts
  add column if not exists balance_available numeric(14, 2),
  add column if not exists balance_limit     numeric(14, 2),
  add column if not exists balance_spent     numeric(14, 2),
  add column if not exists balance_synced_at timestamptz;
