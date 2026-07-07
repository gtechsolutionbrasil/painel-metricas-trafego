# Workflows n8n do painel

## Meta Ads -> Supabase

Arquivo importavel: `n8n/meta-ads-supabase.workflow.json`.

Depois de importar o workflow, abra o node **Configurar segredos** e substitua
os placeholders pelos valores reais:

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role do Supabase.
- `META_ACCESS_TOKEN`: token de System User da Meta com `ads_read`.
- `META_GRAPH_API_VERSION`: opcional; padrao `v21.0`.
- `META_DATE_PRESET`: opcional; padrao `last_30d`.

O Code node tambem aceita as mesmas chaves em `$vars` se o plano do n8n tiver
Variables liberado. No n8n atual do projeto, o caminho pratico e preencher o
node **Configurar segredos**.

O workflow:

1. Le `integration_accounts` com `provider=meta_ads` e status `pending`,
   `connected` ou `error`.
2. Consulta `/act_<id>/insights` em nivel de campanha, diario, nos ultimos 30
   dias.
3. Consulta `/act_<id>/campaigns` para status atual das campanhas.
4. Faz upsert em `ad_metrics`, `ad_campaigns` e `ad_conversion_actions`.
5. Atualiza `integration_accounts.status` para `connected` ou `error` e grava
   uma linha em `sync_runs`.

Para regenerar o JSON depois de editar o Code node:

```bash
npm run build:n8n:meta
```

Notas:

- Nenhum token deve ser commitado. No plano atual do n8n, os valores ficam no
  node **Configurar segredos** do workflow importado.
- O filtro de campanhas do painel considera campanha Meta `ACTIVE` como
  `ENABLED`, para reaproveitar a UI de ativas/pausadas.
