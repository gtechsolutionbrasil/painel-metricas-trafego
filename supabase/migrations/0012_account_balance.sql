-- ============================================================================
-- Recarga manual por conta de anúncio (pré-pago).
-- ============================================================================
-- A API do Google Ads não expõe o saldo de contas com pagamento manual
-- (boleto/pix), então o valor entra manualmente na página Integrações.
-- O painel calcula: saldo = balance_recharge - soma(ad_metrics.spend)
-- desde balance_recharge_date. Escrita restrita a admin pela policy
-- integration_accounts_admin_manage (já existente).
-- ============================================================================

alter table public.integration_accounts
  add column if not exists balance_recharge numeric(12, 2),
  add column if not exists balance_recharge_date date;
