-- ============================================================================
-- 0014: Tracking confiável + mini CRM
--
-- Separa eventos do site, saúde das integrações e leads comerciais. Nenhuma
-- tabela abaixo substitui as métricas brutas de Ads/GA4: elas acrescentam a
-- camada operacional necessária para não tratar rota, visita e contato como a
-- mesma coisa.
-- ============================================================================

-- Eventos GA4 por origem/campanha --------------------------------------------
create table if not exists public.web_events (
  id                  bigint generated always as identity primary key,
  client_id           uuid not null references public.clients (id) on delete cascade,
  account_external_id text not null default '',
  date                date not null,
  event_name          text not null,
  source              text not null default '(not set)',
  medium              text not null default '(not set)',
  campaign            text not null default '(not set)',
  event_count         bigint not null default 0 check (event_count >= 0),
  key_events          numeric(12, 2) not null default 0 check (key_events >= 0),
  users               bigint not null default 0 check (users >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint web_events_upsert_key unique (
    client_id,
    account_external_id,
    date,
    event_name,
    source,
    medium,
    campaign
  )
);

create index if not exists web_events_client_date_event_idx
  on public.web_events (client_id, date, event_name);

-- Checks operacionais escritos pelos workflows -------------------------------
create table if not exists public.tracking_checks (
  id         bigint generated always as identity primary key,
  client_id  uuid not null references public.clients (id) on delete cascade,
  provider   text not null check (provider in ('google_ads', 'meta_ads', 'ga4', 'gtm')),
  check_key  text not null,
  status     text not null default 'pending'
    check (status in ('healthy', 'warning', 'error', 'pending')),
  value      text,
  message    text,
  metadata   jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tracking_checks_upsert_key unique (client_id, provider, check_key)
);

create index if not exists tracking_checks_client_provider_idx
  on public.tracking_checks (client_id, provider, status);

-- Mini CRM -------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  occurred_at      timestamptz not null default now(),
  name             text,
  phone            text,
  email            text,
  channel          text not null default 'manual'
    check (channel in ('whatsapp', 'meta_conversation', 'form', 'phone_call', 'manual')),
  source           text not null default 'manual'
    check (source in ('google_ads', 'meta_ads', 'site', 'organic', 'direct', 'referral', 'manual', 'other')),
  status           text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'quote', 'won', 'lost')),
  campaign         text,
  external_id      text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  value            numeric(14, 2) check (value is null or value >= 0),
  notes            text,
  owner_profile_id uuid references public.profiles (id) on delete set null,
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint leads_has_contact check (
    nullif(btrim(coalesce(name, '')), '') is not null
    or nullif(btrim(coalesce(phone, '')), '') is not null
    or nullif(btrim(coalesce(email, '')), '') is not null
  ),
  constraint leads_text_limits check (
    char_length(coalesce(name, '')) <= 200
    and char_length(coalesce(phone, '')) <= 60
    and char_length(coalesce(email, '')) <= 320
    and char_length(coalesce(campaign, '')) <= 500
    and char_length(coalesce(external_id, '')) <= 500
    and char_length(coalesce(utm_source, '')) <= 500
    and char_length(coalesce(utm_medium, '')) <= 500
    and char_length(coalesce(utm_campaign, '')) <= 500
    and char_length(coalesce(notes, '')) <= 5000
  )
);

create index if not exists leads_client_status_occurred_idx
  on public.leads (client_id, status, occurred_at desc);

create unique index if not exists leads_external_id_unique_idx
  on public.leads (client_id, channel, external_id)
  where external_id is not null;

create table if not exists public.lead_status_history (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references public.leads (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references auth.users (id) on delete set null,
  changed_at  timestamptz not null default now()
);

create index if not exists lead_status_history_lead_date_idx
  on public.lead_status_history (lead_id, changed_at desc);

-- updated_at e histórico automático -----------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists web_events_touch_updated_at on public.web_events;
create trigger web_events_touch_updated_at
  before update on public.web_events
  for each row execute function public.touch_updated_at();

drop trigger if exists tracking_checks_touch_updated_at on public.tracking_checks;
create trigger tracking_checks_touch_updated_at
  before update on public.tracking_checks
  for each row execute function public.touch_updated_at();

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

create or replace function public.protect_lead_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.client_id is distinct from old.client_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Lead identity fields cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_protect_identity on public.leads;
create trigger leads_protect_identity
  before update on public.leads
  for each row execute function public.protect_lead_identity();

create or replace function public.record_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_status_history (
      lead_id, client_id, from_status, to_status, changed_by
    ) values (
      new.id, new.client_id, null, new.status, auth.uid()
    );
  elsif old.status is distinct from new.status then
    insert into public.lead_status_history (
      lead_id, client_id, from_status, to_status, changed_by
    ) values (
      new.id, new.client_id, old.status, new.status, auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists leads_record_status_change on public.leads;
create trigger leads_record_status_change
  after insert or update of status on public.leads
  for each row execute function public.record_lead_status_change();

-- RLS ------------------------------------------------------------------------
alter table public.web_events         enable row level security;
alter table public.tracking_checks    enable row level security;
alter table public.leads              enable row level security;
alter table public.lead_status_history enable row level security;

drop policy if exists "web_events_select" on public.web_events;
create policy "web_events_select"
  on public.web_events for select to authenticated
  using (public.has_client_access(client_id));

drop policy if exists "tracking_checks_select" on public.tracking_checks;
create policy "tracking_checks_select"
  on public.tracking_checks for select to authenticated
  using (public.has_client_access(client_id));

drop policy if exists "tracking_checks_admin_manage" on public.tracking_checks;
create policy "tracking_checks_admin_manage"
  on public.tracking_checks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leads_select" on public.leads;
create policy "leads_select"
  on public.leads for select to authenticated
  using (public.has_client_access(client_id));

drop policy if exists "leads_insert" on public.leads;
create policy "leads_insert"
  on public.leads for insert to authenticated
  with check (
    public.has_client_access(client_id)
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "leads_update" on public.leads;
create policy "leads_update"
  on public.leads for update to authenticated
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

drop policy if exists "leads_delete_admin" on public.leads;
create policy "leads_delete_admin"
  on public.leads for delete to authenticated
  using (public.is_admin());

drop policy if exists "lead_status_history_select" on public.lead_status_history;
create policy "lead_status_history_select"
  on public.lead_status_history for select to authenticated
  using (public.has_client_access(client_id));

grant select on public.web_events, public.tracking_checks,
  public.lead_status_history to authenticated;
grant select, insert, update, delete on public.leads to authenticated;

grant all privileges on table public.web_events, public.tracking_checks,
  public.leads, public.lead_status_history to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Mapeamento conhecido da Madeireira. É idempotente e não publica nada no GTM;
-- apenas registra o container para a auditoria quando esta migration for
-- explicitamente aprovada e aplicada.
insert into public.integration_accounts (
  client_id,
  provider,
  account_name,
  external_id,
  status,
  website_url
)
select
  c.id,
  'gtm',
  'Madeireira Adrianna - GTM',
  'GTM-P42MLWHK',
  'pending',
  'https://madeireiraadrianna.com.br'
from public.clients c
where c.slug = 'madeireira-adrianna'
on conflict (client_id, provider, external_id) do update
set account_name = excluded.account_name,
    website_url = excluded.website_url,
    updated_at = now();

insert into public.tracking_checks (
  client_id, provider, check_key, status, message
)
select
  c.id,
  'ga4',
  event_name,
  'pending',
  'Aguardando a primeira coleta de eventos do workflow GA4.'
from public.clients c
cross join (
  values
    ('event:whatsapp_click'),
    ('event:generate_lead'),
    ('event:phone_click'),
    ('event:route_click')
) as expected(event_name)
where c.slug = 'madeireira-adrianna'
on conflict (client_id, provider, check_key) do nothing;
