-- ============================================================================
-- 0011: Páginas do site (GA4) — por onde o visitante ENTROU e o que ele VIU.
-- Pedido do usuário: "quero saber o trajeto que o cliente fez no site e por
-- onde entrou". O GA4 agregado não dá o passo-a-passo individual, mas dá as
-- duas pontas: página de entrada (landing) e páginas vistas (views).
-- kind='landing' → sessões que começaram naquela página.
-- kind='view'    → visualizações de cada página no período.
-- Escrita: n8n (service role). Leitura: RLS por acesso ao cliente.
-- ============================================================================

create table if not exists public.web_pages (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  date                date not null,
  kind                text not null check (kind in ('landing', 'view')),
  page                text not null,
  sessions            bigint not null default 0,
  views               bigint not null default 0,
  created_at          timestamptz not null default now(),
  constraint web_pages_upsert_key
    unique (client_id, account_external_id, date, kind, page)
);

create index if not exists web_pages_client_date_idx
  on public.web_pages (client_id, date, kind);

alter table public.web_pages enable row level security;

drop policy if exists "web_pages_select" on public.web_pages;
create policy "web_pages_select"
  on public.web_pages for select to authenticated
  using (public.has_client_access(client_id));

grant select on public.web_pages to authenticated;
