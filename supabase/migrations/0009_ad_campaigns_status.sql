-- ============================================================================
-- 0009: Status das campanhas (metadata)
-- Guarda o status ATUAL de cada campanha (ENABLED / PAUSED) pra o painel poder
-- filtrar por ativas/pausadas — pedido do usuário no seletor de campanha.
-- Uma linha por campanha (não por dia). Atualizada a cada coleta do n8n.
-- ============================================================================

create table if not exists public.ad_campaigns (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  platform            text not null default 'google' check (platform in ('meta', 'google')),
  campaign            text not null,
  status              text not null default 'UNKNOWN',
  updated_at          timestamptz not null default now(),
  constraint ad_campaigns_upsert_key
    unique (client_id, account_external_id, platform, campaign)
);
create index if not exists ad_campaigns_client_idx
  on public.ad_campaigns (client_id);

alter table public.ad_campaigns enable row level security;

drop policy if exists "ad_campaigns_select" on public.ad_campaigns;
create policy "ad_campaigns_select"
  on public.ad_campaigns for select to authenticated
  using (public.has_client_access(client_id));
