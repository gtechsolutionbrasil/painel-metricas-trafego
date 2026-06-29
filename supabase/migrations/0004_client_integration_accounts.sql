-- ============================================================================
-- Contas conectadas por cliente + filtros por conta externa.
-- ============================================================================
-- Permite cadastrar IDs de Google Ads, Meta Ads, GA4 e GTM por cliente.
-- O n8n deve gravar account_external_id nas métricas para o painel filtrar
-- uma conta específica quando houver mais de uma conta por cliente.
-- ============================================================================

create table if not exists public.integration_accounts (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id) on delete cascade,
  provider     text not null check (provider in ('google_ads', 'meta_ads', 'ga4', 'gtm')),
  account_name text not null,
  external_id  text not null,
  status       text not null default 'pending' check (status in ('pending', 'connected', 'error', 'paused')),
  website_url  text,
  last_sync_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (client_id, provider, external_id)
);

create index if not exists integration_accounts_client_idx
  on public.integration_accounts (client_id);

alter table public.ad_metrics
  add column if not exists account_external_id text not null default '';

alter table public.web_metrics
  add column if not exists account_external_id text not null default '';

create index if not exists ad_metrics_account_idx
  on public.ad_metrics (client_id, platform, account_external_id, date);

create index if not exists web_metrics_account_idx
  on public.web_metrics (client_id, account_external_id, date);

alter table public.integration_accounts enable row level security;

drop policy if exists "clients_admin_insert" on public.clients;
drop policy if exists "clients_admin_update" on public.clients;
drop policy if exists "clients_admin_delete" on public.clients;

create policy "clients_admin_insert"
  on public.clients for insert to authenticated
  with check (public.is_admin());

create policy "clients_admin_update"
  on public.clients for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "clients_admin_delete"
  on public.clients for delete to authenticated
  using (public.is_admin());

create policy "integration_accounts_select"
  on public.integration_accounts for select to authenticated
  using (public.has_client_access(client_id));

create policy "integration_accounts_admin_manage"
  on public.integration_accounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.integration_accounts to authenticated;
grant select on public.ad_metrics, public.web_metrics to authenticated;
