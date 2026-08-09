# Workflows n8n do painel

Estes arquivos são versões locais preparadas. Importar, testar com dados reais
ou ativar um workflow é uma publicação externa e depende de aprovação.

## Meta Ads -> Supabase

Arquivo importável: `n8n/meta-ads-supabase.workflow.json`.

Depois de importar, abra **Configurar segredos** e substitua os placeholders:

- `SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `META_ACCESS_TOKEN` com `ads_read`;
- `META_GRAPH_API_VERSION` (opcional, padrão do workflow);
- `META_DATE_PRESET` (opcional, padrão `last_30d`).

O workflow lê `integration_accounts`, consulta Insights/Campaigns, faz upsert
em `ad_metrics`, `ad_campaigns` e `ad_conversion_actions`, atualiza o status da
integração e grava `sync_runs`.

O KPI `ad_metrics.conversions` usa somente conversa iniciada em até sete dias
(`onsite_conversion.messaging_conversation_started_7d`). Leads de Pixel,
compras e outros eventos permanecem no detalhamento, sem serem somados.

Para regenerar o JSON Meta depois de editar o Code node:

```bash
npm run build:n8n:meta
```

Para backfill/teste local controlado, `scripts/meta-sync.mjs` aceita
`META_DAYS` (padrão 30; no gate inicial usar 90). As chaves devem vir somente
do ambiente seguro, nunca da linha de comando salva no histórico.

## Google Ads -> Supabase

Arquivo importável: `n8n/google-ads-supabase.workflow.json`.

Os endpoints locais estão em Google Ads API **v25**. A versão anterior do
workflow usava v21, com desativação prevista para agosto de 2026.

O ramo **Conversões por ação** consulta e grava:

- `metrics.conversions`: ações incluídas em “Conversões”/otimização;
- `metrics.all_conversions`: total reportado, inclusive ações secundárias.

Isso permite separar contatos, intenção local e microconversões sem perder
ações fora da meta principal da campanha.

## GA4 -> Supabase

Arquivo importável: `n8n/ga4-supabase.workflow.json`.

Além de sessões e páginas, coleta `whatsapp_click`, `generate_lead`,
`phone_click` e `route_click`, com origem/mídia/campanha. Grava `web_events`,
atualiza um `tracking_check` por evento e registra a última sincronização.

## Segurança

- nunca commitar tokens ou substituir placeholders nos JSONs versionados;
- guardar a service role somente na credencial protegida do n8n;
- importar primeiro como inativo, executar manualmente e comparar com a fonte;
- ativar apenas depois do teste de idempotência.

Ordem e critérios completos:
[`docs/plano-publicacao-tracking-madeireira.md`](../docs/plano-publicacao-tracking-madeireira.md).
