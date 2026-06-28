-- ============================================================================
-- Seed de desenvolvimento — clientes + 90 dias de métricas de exemplo.
-- Gera dados pseudo-aleatórios direto no Postgres (sem literais gigantes).
-- Idempotente: rode quantas vezes quiser (ON CONFLICT DO NOTHING).
-- ============================================================================

insert into public.clients (id, name, slug, status) values
  ('11111111-1111-1111-1111-111111111111', 'Aurora Estética', 'aurora', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Nova Motors',     'nova',   'active'),
  ('33333333-3333-3333-3333-333333333333', 'Vitta Saúde',     'vitta',  'paused')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- tráfego pago
insert into public.ad_metrics
  (client_id, date, platform, campaign, spend, impressions, clicks, conversions, revenue)
select c.id, dd.d, cc.platform, cc.campaign,
       s.spend, s.impressions, s.clicks, s.conversions, s.revenue
from (
  select id, case slug when 'nova' then 1.8 when 'vitta' then 0.55 else 1.0 end as scale
  from public.clients
) c
cross join generate_series(0, 89) as gs(n)
cross join lateral (select (current_date - gs.n)::date as d) dd
cross join (
  select 'meta'::text as platform, unnest(array[
    'Conversão • Remarketing','Tráfego • Topo de Funil',
    'Leads • Lookalike 1%','Engajamento • Stories']) as campaign
  union all
  select 'google', unnest(array[
    'Search • Marca','Search • Genéricas',
    'Performance Max','YouTube • Awareness'])
) cc
cross join lateral (
  select
    (60 + random() * 340)
      * (case when extract(dow from dd.d) in (0, 6) then 0.7 else 1 end)
      * c.scale                       as spend,
    0.6 + random() * 2.2              as cpc,
    0.008 + random() * 0.03           as ctr,
    0.03 + random() * 0.08            as cvr,
    45 + random() * 120               as ticket
) r
cross join lateral (
  select round(r.spend::numeric, 2) as spend,
         greatest(1, round(r.spend / r.cpc)) as clicks
) a
cross join lateral (
  select a.spend, a.clicks,
         round(a.clicks / r.ctr)         as impressions,
         greatest(0, round(a.clicks * r.cvr)) as conversions
) b
cross join lateral (
  select b.spend, b.impressions, b.clicks, b.conversions,
         round(b.conversions * r.ticket)::numeric as revenue
) s
on conflict (client_id, date, platform, campaign) do nothing;

-- ----------------------------------------------------------------- analytics web
insert into public.web_metrics
  (client_id, date, source, medium, sessions, users, pageviews, bounce_rate, avg_duration)
select c.id, dd.d, src.source, src.medium,
       w.sessions, w.users, w.pageviews, w.bounce_rate, w.avg_duration
from (
  select id, case slug when 'nova' then 1.8 when 'vitta' then 0.55 else 1.0 end as scale
  from public.clients
) c
cross join generate_series(0, 89) as gs(n)
cross join lateral (select (current_date - gs.n)::date as d) dd
cross join (
  values ('google','organic'), ('google','cpc'), ('facebook','cpc'),
         ('instagram','social'), ('(direct)','(none)'), ('whatsapp','referral')
) as src(source, medium)
cross join lateral (
  select
    round((120 + random() * 900)
      * (case when extract(dow from dd.d) in (0, 6) then 0.7 else 1 end)
      * c.scale)                       as sessions,
    0.7 + random() * 0.25              as users_ratio,
    1.6 + random() * 2.4               as ppv,
    round((0.28 + random() * 0.40)::numeric, 4) as bounce_rate,
    round((40 + random() * 220)::numeric, 2)    as avg_duration
) base
cross join lateral (
  select base.sessions,
         round(base.sessions * base.users_ratio) as users,
         round(base.sessions * base.ppv)         as pageviews,
         base.bounce_rate, base.avg_duration
) w
on conflict (client_id, date, source, medium) do nothing;

-- ============================================================================
-- Pós-seed (manual): depois de criar seu usuário em Authentication > Users,
-- promova-o a admin para enxergar todos os clientes:
--
--   update public.profiles set role = 'admin' where id = '<seu-user-id>';
--
-- Ou conceda acesso a clientes específicos (viewer):
--
--   insert into public.client_access (profile_id, client_id)
--   select '<seu-user-id>', id from public.clients where slug in ('aurora','nova');
-- ============================================================================
