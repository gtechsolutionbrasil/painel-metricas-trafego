# Ingestão de dados via n8n

O painel **apenas lê** do Supabase. Quem coleta de Meta Ads, Google Ads e GA4 e
grava no banco é o **n8n**, em workflows agendados. Este documento é o contrato
de escrita que os workflows devem respeitar.

Para a estratégia de autorização, tokens, MCC/Business Manager e GTM, veja
[integracoes-ads-analytics.md](integracoes-ads-analytics.md).

## Cadastro no painel x credenciais no n8n

A página **Clientes e integrações** não conecta as APIs sozinha. Ela salva o
mapa operacional:

- qual é o cliente;
- quais IDs externos pertencem a ele (`customer_id`, `act_...`, property GA4,
  container GTM);
- qual `client_id` o n8n deve usar ao gravar métricas no Supabase.

As credenciais reais ficam no n8n:

- Google Ads: OAuth/refresh token e Developer Token, preferencialmente usando o
  MCC da agência com acesso às contas dos clientes.
- Meta Ads: token de longa duração/System User ou OAuth com acesso ao Business
  Manager/conta de anúncios.
- GA4: OAuth ou service account com permissão na property.
- Supabase: `SUPABASE_SERVICE_ROLE_KEY` para gravar via upsert.

Fluxo: painel salva o mapeamento -> n8n lê clientes/integrações -> n8n chama as
APIs com as credenciais dele -> n8n grava métricas normalizadas -> painel exibe.

## Princípios

- **Autenticação:** o n8n grava usando a **SERVICE ROLE KEY** do Supabase
  (`SUPABASE_SERVICE_ROLE_KEY`). Ela ignora RLS — por isso nunca pode ir para o
  front-end. Guarde-a só nas credenciais do n8n.
- **Idempotência:** sempre usar **upsert** (não insert puro), para reprocessar
  um dia sem duplicar. As tabelas têm chaves únicas para isso.
- **Granularidade:** uma linha por **dia × cliente × (campanha | origem | evento)**.
  Métricas derivadas (CTR, CPC, CPL, ROAS) **não** são gravadas — o painel
  calcula a partir dos números brutos.
- **Janela:** reprocessar sempre os **últimos 3–7 dias** (as plataformas
  ajustam números retroativamente). Upsert resolve as atualizações.

## Tabelas e chaves de upsert

### `ad_metrics` — Meta Ads + Google Ads
Chave de conflito: `(client_id, account_external_id, date, platform, campaign)`

| coluna | tipo | origem |
|---|---|---|
| `client_id` | uuid | mapeie a conta de anúncio → cliente |
| `account_external_id` | text | ID da conta de anúncio (`customer_id` Google ou `act_...` Meta) |
| `date` | date (YYYY-MM-DD) | dia da métrica |
| `platform` | `'meta'` \| `'google'` | fixo por workflow |
| `campaign` | text | nome da campanha |
| `spend` | numeric | investimento |
| `impressions` | bigint | impressões |
| `clicks` | bigint | cliques |
| `conversions` | numeric | métrica bruta da plataforma |
| `revenue` | numeric | receita (purchase/conversion value) |

`ad_metrics.conversions` não é exibida como um total unificado de leads.

### `ad_conversion_actions` — resultados por ação

Chave de conflito:
`(client_id, account_external_id, date, campaign, action_name)`

| coluna | função |
|---|---|
| `conversions` | no Google, ações incluídas em “Conversões”/otimização |
| `all_conversions` | total reportado, incluindo ações secundárias/locais |
| `origin` | `WEBSITE`, `GOOGLE_HOSTED`, `CALL_FROM_ADS`, `META` etc. |
| `action_name` | nome original; a classificação comercial acontece no painel |

O workflow Google consulta `metrics.conversions` e
`metrics.all_conversions`. O painel separa contato principal (WhatsApp,
formulário confirmado e ligação), conversa Meta, intenção local (rota/visita)
e microconversão (visita ao site e ações intermediárias).

### `web_metrics` — GA4
Chave de conflito: `(client_id, account_external_id, date, source, medium)`

| coluna | tipo | origem (GA4) |
|---|---|---|
| `client_id` | uuid | property GA4 → cliente |
| `account_external_id` | text | ID da propriedade GA4 |
| `date` | date | `date` |
| `source` | text | `sessionSource` |
| `medium` | text | `sessionMedium` |
| `sessions` | bigint | `sessions` |
| `users` | bigint | `totalUsers` |
| `pageviews` | bigint | `screenPageViews` |
| `bounce_rate` | numeric (0..1) | `bounceRate` |
| `avg_duration` | numeric (segundos) | `averageSessionDuration` |

### `web_events` — eventos do site recebidos no GA4

Chave de conflito:
`(client_id, account_external_id, date, event_name, source, medium, campaign)`

| coluna | origem (GA4 Data API) |
|---|---|
| `event_name` | `eventName` |
| `source` / `medium` / `campaign` | `sessionSource`, `sessionMedium`, `sessionCampaignName` |
| `event_count` | `eventCount` |
| `key_events` | `keyEvents` |
| `users` | `totalUsers` |

Eventos esperados: `whatsapp_click`, `generate_lead`, `phone_click` e
`route_click`. O último aparece separadamente como intenção local.

### `tracking_checks` — saúde do tracking

Chave de conflito: `(client_id, provider, check_key)`. O workflow GA4 atualiza
um check por evento. Evento recebido na janela de sete dias fica `healthy`;
ausência fica `warning` e orienta testar no Tag Assistant.

### `leads` e `lead_status_history` — mini-CRM

O funil usa `new`, `contacted`, `qualified`, `quote`, `won`, `lost`. Toda
mudança de status gera histórico automaticamente no banco.

### `sync_runs` — log (opcional, recomendado)
Grave 1 linha ao fim de cada execução: `platform`, `client_id` (ou null),
`status` (`success`/`error`/`partial`), `rows`, `message`.

## Como gravar (Supabase REST / upsert)

`POST {SUPABASE_URL}/rest/v1/ad_metrics`

Headers:
```
apikey: {SERVICE_ROLE_KEY}
Authorization: Bearer {SERVICE_ROLE_KEY}
Content-Type: application/json
Prefer: resolution=merge-duplicates
```

Query: `?on_conflict=client_id,account_external_id,date,platform,campaign`
Body: array de objetos com as colunas acima (envie em lote).

> Atenção (Google Ads): a API retorna `cost_micros` — divida por 1.000.000
> antes de gravar em `spend`.

> No n8n dá para usar o **node Supabase** (operação upsert) ou um **HTTP
> Request** com os headers acima.

## Workflows sugeridos (1 por fonte)

1. **Meta Ads → Supabase** — agendado (ex.: a cada hora ou 1×/dia). Para cada
   cliente: Insights API por dia/campanha → mapeia → upsert em `ad_metrics`
   (`platform='meta'`, `account_external_id='act_...'`).
   - Workflow importável do projeto: `n8n/meta-ads-supabase.workflow.json`.
   - No n8n atual, preencher o node **Configurar segredos** com
     `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCESS_TOKEN`;
     opcionais:
     `META_GRAPH_API_VERSION` (padrão `v21.0`) e `META_DATE_PRESET` (padrão
     `last_30d`).
   - Se o plano do n8n tiver Variables liberado, o mesmo Code node tambem
     aceita essas chaves via `$vars`.
   - Também atualiza `ad_campaigns` para o filtro de campanhas e grava ações
     relevantes em `ad_conversion_actions` (lead, contato, mensagens/WhatsApp,
     compra).
   - Em `ad_metrics.conversions`, grava exclusivamente
     `onsite_conversion.messaging_conversation_started_7d`. Leads de Pixel e
     compras ficam no detalhamento e não entram no KPI “Conversas Meta”.
2. **Google Ads → Supabase** — idem, `platform='google'`,
   `account_external_id='<customer_id>'`. O ramo de ações grava
   `metrics.conversions` e `metrics.all_conversions` separadamente.
3. **GA4 → Supabase** — Data API (runReport) por dia/source/medium → upsert em
   `web_metrics`; outro relatório grava os quatro eventos esperados em
   `web_events` e atualiza `tracking_checks`.

Os JSONs locais só devem substituir/ativar workflows depois da aprovação do
gate em [plano-publicacao-tracking-madeireira.md](plano-publicacao-tracking-madeireira.md).
