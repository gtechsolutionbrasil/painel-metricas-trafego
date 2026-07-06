-- ============================================================================
-- 0006: Detalhamento do tráfego pago (fase 7)
-- Palavras-chave, regiões, tipos de clique e conversões por ação — pedidos
-- pelo usuário pra ter "visão clara de como tá a campanha". Também adiciona
-- a parcela de impressões (search_impression_share) em ad_metrics.
-- Escrita: n8n com service role (bypassa RLS). Leitura: RLS por acesso.
-- Coluna platform já preparada pra Meta (breakdowns futuros).
-- ============================================================================

-- Parcela de impressões da campanha (Search; 0..1, null quando não se aplica)
alter table public.ad_metrics
  add column if not exists search_impression_share numeric(5, 4);

-- Palavras-chave --------------------------------------------------------------
create table if not exists public.ad_keywords (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  platform            text not null default 'google' check (platform in ('meta', 'google')),
  date                date not null,
  campaign            text not null,
  keyword             text not null,
  match_type          text not null default '',
  impressions         bigint not null default 0,
  clicks              bigint not null default 0,
  spend               numeric(14, 2) not null default 0,
  conversions         numeric(10, 2) not null default 0,
  created_at          timestamptz not null default now(),
  constraint ad_keywords_upsert_key
    unique (client_id, account_external_id, date, campaign, keyword, match_type)
);
create index if not exists ad_keywords_client_date_idx
  on public.ad_keywords (client_id, date);

-- Regiões (nome já resolvido pelo n8n via geo_target_constant) ---------------
create table if not exists public.ad_geo (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  platform            text not null default 'google' check (platform in ('meta', 'google')),
  date                date not null,
  campaign            text not null,
  region              text not null,
  impressions         bigint not null default 0,
  clicks              bigint not null default 0,
  spend               numeric(14, 2) not null default 0,
  conversions         numeric(10, 2) not null default 0,
  created_at          timestamptz not null default now(),
  constraint ad_geo_upsert_key
    unique (client_id, account_external_id, date, campaign, region)
);
create index if not exists ad_geo_client_date_idx
  on public.ad_geo (client_id, date);

-- Tipos de clique (onde foi cada clique: site, ligação, rota no Maps...) -----
create table if not exists public.ad_click_types (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  platform            text not null default 'google' check (platform in ('meta', 'google')),
  date                date not null,
  campaign            text not null,
  click_type          text not null,
  clicks              bigint not null default 0,
  created_at          timestamptz not null default now(),
  constraint ad_click_types_upsert_key
    unique (client_id, account_external_id, date, campaign, click_type)
);
create index if not exists ad_click_types_client_date_idx
  on public.ad_click_types (client_id, date);

-- Conversões por ação (WhatsApp, formulário, ligação...) ---------------------
create table if not exists public.ad_conversion_actions (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  platform            text not null default 'google' check (platform in ('meta', 'google')),
  date                date not null,
  campaign            text not null,
  action_name         text not null,
  action_category     text not null default '',
  conversions         numeric(10, 2) not null default 0,
  created_at          timestamptz not null default now(),
  constraint ad_conversion_actions_upsert_key
    unique (client_id, account_external_id, date, campaign, action_name)
);
create index if not exists ad_conversion_actions_client_date_idx
  on public.ad_conversion_actions (client_id, date);

-- ============================================================================
-- Row Level Security (leitura conforme acesso ao cliente, como ad_metrics)
-- ============================================================================
alter table public.ad_keywords            enable row level security;
alter table public.ad_geo                 enable row level security;
alter table public.ad_click_types         enable row level security;
alter table public.ad_conversion_actions  enable row level security;

drop policy if exists "ad_keywords_select" on public.ad_keywords;
create policy "ad_keywords_select"
  on public.ad_keywords for select to authenticated
  using (public.has_client_access(client_id));

drop policy if exists "ad_geo_select" on public.ad_geo;
create policy "ad_geo_select"
  on public.ad_geo for select to authenticated
  using (public.has_client_access(client_id));

drop policy if exists "ad_click_types_select" on public.ad_click_types;
create policy "ad_click_types_select"
  on public.ad_click_types for select to authenticated
  using (public.has_client_access(client_id));

drop policy if exists "ad_conversion_actions_select" on public.ad_conversion_actions;
create policy "ad_conversion_actions_select"
  on public.ad_conversion_actions for select to authenticated
  using (public.has_client_access(client_id));
