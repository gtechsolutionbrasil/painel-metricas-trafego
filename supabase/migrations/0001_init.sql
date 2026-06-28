-- ============================================================================
-- Painel GTech Solution — schema inicial (multi-tenant) + RLS
-- ============================================================================
-- Convenções:
--  * O painel (usuários autenticados) apenas LÊ as métricas, com recorte por
--    cliente via RLS.
--  * A escrita (ingestão) é feita pelo n8n usando a SERVICE ROLE KEY, que
--    ignora RLS — por isso não há policies de INSERT/UPDATE para usuários.
-- ============================================================================

-- Clientes da agência -------------------------------------------------------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  status     text not null default 'active' check (status in ('active', 'paused')),
  logo_url   text,
  created_at timestamptz not null default now()
);

-- Perfis (1:1 com auth.users) ----------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- Acesso por cliente (quem vê o quê) ---------------------------------------
create table if not exists public.client_access (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  client_id  uuid not null references public.clients (id) on delete cascade,
  primary key (profile_id, client_id)
);

-- Métricas de tráfego pago (Meta + Google) ----------------------------------
create table if not exists public.ad_metrics (
  id          bigint generated always as identity primary key,
  client_id   uuid not null references public.clients (id) on delete cascade,
  date        date not null,
  platform    text not null check (platform in ('meta', 'google')),
  campaign    text not null,
  spend       numeric(14, 2) not null default 0,
  impressions bigint not null default 0,
  clicks      bigint not null default 0,
  conversions bigint not null default 0,
  revenue     numeric(14, 2) not null default 0,
  created_at  timestamptz not null default now(),
  unique (client_id, date, platform, campaign)
);
create index if not exists ad_metrics_client_date_idx
  on public.ad_metrics (client_id, date);

-- Métricas de analytics web (GA4) -------------------------------------------
create table if not exists public.web_metrics (
  id           bigint generated always as identity primary key,
  client_id    uuid not null references public.clients (id) on delete cascade,
  date         date not null,
  source       text not null,
  medium       text not null,
  sessions     bigint not null default 0,
  users        bigint not null default 0,
  pageviews    bigint not null default 0,
  bounce_rate  numeric(5, 4) not null default 0,
  avg_duration numeric(10, 2) not null default 0,
  created_at   timestamptz not null default now(),
  unique (client_id, date, source, medium)
);
create index if not exists web_metrics_client_date_idx
  on public.web_metrics (client_id, date);

-- Log de sincronização (preenchido pelo n8n) --------------------------------
create table if not exists public.sync_runs (
  id        bigint generated always as identity primary key,
  platform  text not null,
  client_id uuid references public.clients (id) on delete set null,
  status    text not null check (status in ('success', 'error', 'partial')),
  rows      integer not null default 0,
  message   text,
  ran_at    timestamptz not null default now()
);

-- ============================================================================
-- Helpers de autorização (SECURITY DEFINER evita recursão nas policies)
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_client_access(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.client_access
        where profile_id = auth.uid() and client_id = cid
      );
$$;

-- Cria profile automaticamente ao criar usuário -----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.clients       enable row level security;
alter table public.profiles      enable row level security;
alter table public.client_access enable row level security;
alter table public.ad_metrics    enable row level security;
alter table public.web_metrics   enable row level security;
alter table public.sync_runs     enable row level security;

-- profiles: cada um vê/edita o próprio; admin vê todos
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- clients: visível se admin ou tem acesso
create policy "clients_select"
  on public.clients for select to authenticated
  using (public.has_client_access(id));

-- client_access: usuário vê os próprios; admin gerencia todos
create policy "client_access_select"
  on public.client_access for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "client_access_admin_manage"
  on public.client_access for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- métricas: leitura conforme acesso ao cliente
create policy "ad_metrics_select"
  on public.ad_metrics for select to authenticated
  using (public.has_client_access(client_id));
create policy "web_metrics_select"
  on public.web_metrics for select to authenticated
  using (public.has_client_access(client_id));

-- sync_runs: admin vê tudo; demais veem o que têm acesso
create policy "sync_runs_select"
  on public.sync_runs for select to authenticated
  using (public.is_admin() or (client_id is not null and public.has_client_access(client_id)));
