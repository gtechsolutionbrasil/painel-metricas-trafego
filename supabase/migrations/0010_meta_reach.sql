-- ============================================================================
-- 0010: Alcance (reach) do Meta em ad_metrics
-- Meta informa "alcance" = nº de pessoas distintas que viram o anúncio (Google
-- não tem). Guardamos o reach diário; o painel soma por dia — o que difere um
-- pouco do alcance único do período no Gerenciador (lá desconta quem viu em
-- mais de um dia). Só se aplica a platform='meta'; no Google fica 0.
-- ============================================================================

alter table public.ad_metrics
  add column if not exists reach bigint not null default 0;
