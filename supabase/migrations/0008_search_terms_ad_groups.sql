-- ============================================================================
-- 0008: Termos de pesquisa e grupos de anúncios (Google Ads)
-- Pedido do usuário (prints do Google Ads):
--  - search terms = o que as pessoas REALMENTE digitaram (search_term_view)
--    (diferente de ad_keywords = palavras-chave que o anunciante configurou)
--  - ad groups = desempenho por grupo de anúncios
-- Escrita: n8n service role. Leitura: RLS por acesso ao cliente.
-- ============================================================================

-- Termos de pesquisa reais --------------------------------------------------
create table if not exists public.ad_search_terms (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  platform            text not null default 'google' check (platform in ('meta', 'google')),
  date                date not null,
  campaign            text not null,
  search_term         text not null,
  impressions         bigint not null default 0,
  clicks              bigint not null default 0,
  spend               numeric(14, 2) not null default 0,
  conversions         numeric(10, 2) not null default 0,
  created_at          timestamptz not null default now(),
  constraint ad_search_terms_upsert_key
    unique (client_id, account_external_id, date, campaign, search_term)
);
create index if not exists ad_search_terms_client_date_idx
  on public.ad_search_terms (client_id, date);

-- Grupos de anúncios --------------------------------------------------------
create table if not exists public.ad_groups (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  platform            text not null default 'google' check (platform in ('meta', 'google')),
  date                date not null,
  campaign            text not null,
  ad_group            text not null,
  impressions         bigint not null default 0,
  clicks              bigint not null default 0,
  spend               numeric(14, 2) not null default 0,
  conversions         numeric(10, 2) not null default 0,
  created_at          timestamptz not null default now(),
  constraint ad_groups_upsert_key
    unique (client_id, account_external_id, date, campaign, ad_group)
);
create index if not exists ad_groups_client_date_idx
  on public.ad_groups (client_id, date);

-- RLS (leitura conforme acesso ao cliente) ----------------------------------
alter table public.ad_search_terms enable row level security;
alter table public.ad_groups       enable row level security;

drop policy if exists "ad_search_terms_select" on public.ad_search_terms;
create policy "ad_search_terms_select"
  on public.ad_search_terms for select to authenticated
  using (public.has_client_access(client_id));

drop policy if exists "ad_groups_select" on public.ad_groups;
create policy "ad_groups_select"
  on public.ad_groups for select to authenticated
  using (public.has_client_access(client_id));
