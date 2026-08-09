# Plano de publicação — tracking da Madeireira Adrianna

Decisão: preparar localmente e pedir aprovação antes de cada alteração externa.
Um gate só começa depois do “ok” explícito do usuário.

## Gate 1 — Supabase ✅ concluído em 2026-08-09

- [x] gerar backup lógico recuperável do schema `public`;
- [x] aplicar somente `supabase/migrations/0014_tracking_events_crm.sql`;
- [x] validar tabelas, índices, triggers, RLS e grants;
- [x] confirmar que dados existentes continuam intactos.

Critério: `web_events`, `tracking_checks`, `leads` e `lead_status_history`
disponíveis e isolados por cliente.

Resultado: critério atendido. Backup local em
`.agent/backups/gate1-0014-before-2026-08-09T20-19-32-076Z.json`, SHA-256
`a94c37c42ef7f16b8e43fd04c654b4b87d40aada5bacfcad05759d4c56a30444`.
Validados 4 tabelas com RLS, 5 índices, 8 policies, 5 triggers, grants e seeds.
As 15 tabelas preexistentes foram comparadas com o backup; nenhum dado anterior
foi removido ou alterado. Testes funcionais usaram rollback e não deixaram
registros residuais.

## Gate 2 — n8n GA4

- atualizar/importar `n8n/ga4-supabase.workflow.json` inativo;
- executar manualmente para a Madeireira;
- conferir `web_events`, checks e `last_sync_at`;
- comparar os quatro eventos com GA4;
- só então ativar o agendamento.

Critério: eventos por origem/campanha e checks coerentes, sem duplicação ao
repetir a execução.

## Gate 3 — n8n Google Ads

- atualizar/importar `n8n/google-ads-supabase.workflow.json` inativo;
- executar manualmente para a Madeireira;
- validar todas as consultas na API v25 (upgrade local de v21);
- comparar `conversions` e `all_conversions` por ação com o Ads;
- confirmar a classificação do painel e só então ativar.

Critério: contatos, intenções locais e microconversões fechando com o Google
Ads, sem tratar rota/visita como lead.

## Gate 4 — GTM, GA4 e Google Ads

- testar no Preview/Tag Assistant `whatsapp_click`, `generate_lead`,
  `phone_click` e `route_click`, verificando ausência de duplicidade;
- conferir IDs e gatilhos das tags GA4/Ads;
- no GA4, marcar como evento principal somente ações comerciais aprovadas;
- no Google Ads, manter WhatsApp, formulário e ligação como objetivos
  principais; rota, visita à loja e visita ao site como secundários;
- publicar o container apenas depois da comparação antes/depois.

Critério: um gesto do usuário gera um evento no destino correto.

## Gate 5 — Meta Pixel/CAPI

- atualizar o workflow Meta com conversa iniciada como KPI canônico;
- executar backfill de 90 dias com `META_DAYS=90 node scripts/meta-sync.mjs` em
  ambiente seguro e comparar a conversa iniciada com o Gerenciador de Anúncios;
- testar PageView, Contact e Lead no Events Manager;
- confirmar Pixel ID, domínio e priorização;
- se houver Pixel + CAPI, validar `event_id`/deduplicação;
- alinhar conversa iniciada como métrica principal da Meta;
- publicar somente após teste real.

## Gate 6 — UTMs

- aplicar `docs/utm-padrao.md` nas campanhas Google e Meta;
- testar parâmetros, redirects e persistência até formulário/WhatsApp;
- acompanhar `(not set)` por sete dias.

## Gate 7 — aplicação

- definir `N8N_REFRESH_GA4_URL` em produção;
- fazer build e smoke test autenticado;
- revisar mobile/desktop e permissões do CRM;
- publicar o painel;
- monitorar syncs e diferenças de totais por 48 horas.

## Rollback

- n8n: desativar a nova versão e reativar a anterior;
- GTM: republicar a versão anterior do container;
- aplicação: promover o deploy anterior;
- banco: as tabelas são aditivas; interromper a escrita e investigar antes de
  qualquer rollback SQL destrutivo.
