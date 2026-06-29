# Ingestão de dados via n8n

O painel **apenas lê** do Supabase. Quem coleta de Meta Ads, Google Ads e GA4 e
grava no banco é o **n8n**, em workflows agendados. Este documento é o contrato
de escrita que os workflows devem respeitar.

Para a estratégia de autorização, tokens, MCC/Business Manager e GTM, veja
[integracoes-ads-analytics.md](integracoes-ads-analytics.md).

## Princípios

- **Autenticação:** o n8n grava usando a **SERVICE ROLE KEY** do Supabase
  (`SUPABASE_SERVICE_ROLE_KEY`). Ela ignora RLS — por isso nunca pode ir para o
  front-end. Guarde-a só nas credenciais do n8n.
- **Idempotência:** sempre usar **upsert** (não insert puro), para reprocessar
  um dia sem duplicar. As tabelas têm chaves únicas para isso.
- **Granularidade:** uma linha por **dia × cliente × (campanha | origem)**.
  Métricas derivadas (CTR, CPC, CPL, ROAS) **não** são gravadas — o painel
  calcula a partir dos números brutos.
- **Janela:** reprocessar sempre os **últimos 3–7 dias** (as plataformas
  ajustam números retroativamente). Upsert resolve as atualizações.

## Tabelas e chaves de upsert

### `ad_metrics` — Meta Ads + Google Ads
Chave de conflito: `(client_id, date, platform, campaign)`

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
| `conversions` | bigint | conversões/leads |
| `revenue` | numeric | receita (purchase/conversion value) |

### `web_metrics` — GA4
Chave de conflito: `(client_id, date, source, medium)`

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

Query: `?on_conflict=client_id,date,platform,campaign`
Body: array de objetos com as colunas acima (envie em lote).

> No n8n dá para usar o **node Supabase** (operação upsert) ou um **HTTP
> Request** com os headers acima.

## Workflows sugeridos (1 por fonte)

1. **Meta Ads → Supabase** — agendado (ex.: a cada hora ou 1×/dia). Para cada
   cliente: Insights API por dia/campanha → mapeia → upsert em `ad_metrics`
   (`platform='meta'`, `account_external_id='act_...'`).
2. **Google Ads → Supabase** — idem, `platform='google'`,
   `account_external_id='<customer_id>'`.
3. **GA4 → Supabase** — Data API (runReport) por dia/source/medium → upsert em
   `web_metrics` com `account_external_id` igual ao property ID.

Construir com as skills `n8n-*` quando esta fase for executada.
