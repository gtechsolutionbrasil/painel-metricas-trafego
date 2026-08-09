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

## Gate 2 — n8n GA4 ✅ concluído em 2026-08-09

- [x] atualizar/importar `n8n/ga4-supabase.workflow.json` inativo;
- [x] executar manualmente para a Madeireira;
- [x] conferir `web_events`, checks e `last_sync_at`;
- [x] comparar os quatro eventos com a saída efetiva da GA4 Data API;
- [x] repetir a execução e só então ativar o agendamento.

Critério: eventos por origem/campanha e checks coerentes, sem duplicação ao
repetir a execução.

Resultado: critério atendido. A versão anterior de 12 nós foi preservada em
`.agent/backups/n8n-ga4-before-gate2-2026-08-09T20-37-37-820Z.json`. As
execuções manuais 12781 e 12783 terminaram com sucesso e a segunda manteve 18
linhas de `web_events`, zero chaves duplicadas, 190 linhas de `web_metrics` e
110 de `web_pages`. O webhook temporário foi removido e o workflow final de 17
nós ficou ativo no cron `0 6 * * *` (06:00, America/Sao_Paulo).

Leitura dos últimos 7 dias: `whatsapp_click` 49 e `phone_click` 1 estão
`healthy`; `generate_lead` 0 e `route_click` 0 estão `warning`. Esses dois
alertas são ausência de evento no GA4, não falha da sincronização, e devem ser
investigados no Gate 4 com Preview/Tag Assistant.

## Gate 3 — n8n Google Ads ✅ concluído em 2026-08-09

- [x] preservar o workflow e os dados anteriores em backups locais;
- [x] atualizar/importar `n8n/google-ads-supabase.workflow.json` inativo;
- [x] executar manualmente para a Madeireira;
- [x] validar todas as 11 consultas na API v25 (upgrade de v21);
- [x] comparar `conversions` e `all_conversions` por ação com o Ads;
- [x] confirmar a classificação pela função real do painel;
- [x] repetir a execução, validar idempotência e ativar o agendamento.

Critério: contatos, intenções locais e microconversões fechando com o Google
Ads, sem tratar rota/visita como lead.

Resultado: critério atendido. A versão anterior e o snapshot do banco foram
preservados em `.agent/backups/`. A validação inicial revelou duas linhas
obsoletas de visita à loja, pois upsert não remove ações que o Google deixa de
retornar. O workflow final reconcilia `ad_conversion_actions` por conta e
janela de 30 dias somente depois de uma resposta válida. Nas execuções 12799 e
12800, as 11 consultas v25 passaram; API e banco fecharam exatamente em 249
linhas, 444 `conversions` e 1.483,5 `all_conversions`. A função do painel
classificou 186 contatos principais, 466,5 intenções locais e 831
microconversões. A repetição manteve iguais as contagens das oito tabelas Ads e
zero duplicatas. Workflow ativo com 35 nós, webhook autenticado e cron
`30 6 * * *` (06:30, America/Sao_Paulo).

Achado para o Gate 4: 326 conversões de lance ainda pertencem a intenção local
(228 rotas e 98 visitas à loja). A exibição do painel está correta, mas os
objetivos do Google Ads precisam ser revisados para que rota/visita não orientem
o lance como lead comercial.

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
