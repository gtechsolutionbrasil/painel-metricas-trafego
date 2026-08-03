# Graph Report - painel-metricas-trafego  (2026-08-03)

## Corpus Check
- 82 files · ~61,192 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 493 nodes · 987 edges · 36 communities (15 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a4ad9fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dependências (package.json)
- Login, Layout & ESLint
- Topbar & Camada de dados
- Gráficos (Recharts)
- TypeScript config
- Community 5
- Community 6
- Agregação de métricas
- Analytics web & métricas web
- Root layout (fontes)
- Componente Badge
- eslint.config.mjs
- Acesso Supabase (queries)
- Next config
- PostCSS/Tailwind config
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- pre-commit
- getClients
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `GoogleInsights()` - 30 edges
2. `ChannelPage()` - 24 edges
3. `getReportData()` - 19 edges
4. `getClients()` - 17 edges
5. `fmtInt()` - 16 edges
6. `rangeFromSearch()` - 16 edges
7. `compilerOptions` - 16 edges
8. `OverviewPage()` - 15 edges
9. `SitePage()` - 15 edges
10. `formatValue()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `ChannelSummary()` --indirect_call--> `key()`  [INFERRED]
  src/app/(dash)/page.tsx → src/lib/report/labels.ts
- `ExportReportButton()` --indirect_call--> `key()`  [INFERRED]
  src/components/layout/ExportReportButton.tsx → src/lib/report/labels.ts
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts
- `OverviewPage()` --calls--> `fmtInt()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/format.ts
- `OverviewPage()` --calls--> `webKpis`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/metrics/aggregate.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Flow** — n8n_workflow, google_ads_api, meta_marketing_api, ga4_data_api, supabase_migrations_0001_init [EXTRACTED 1.00]
- **Dashboard Pages** — src_app_dash_page, src_app_dash_trafego_pago, src_app_dash_analytics, src_app_dash_clientes [EXTRACTED 1.00]

## Communities (36 total, 21 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.06
Nodes (49): CampaignFilter(), adByCampaign(), adByDay(), AdDayPoint, AdGroupRow, byConversionActionGrouped(), CampaignRow, ClickTypeRow (+41 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.12
Nodes (33): SP, OverviewPage(), platformDetail(), SP, ChannelPage(), SP, Card(), CardBody() (+25 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.16
Nodes (13): refreshData(), WEBHOOKS, ExportReportButton(), buildMonth(), fmtBR(), iso(), MONTHS, parse() (+5 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 4 - "TypeScript config"
Cohesion: 0.04
Nodes (45): date-fns, eslint, eslint-config-next, lucide-react, next, dependencies, date-fns, lucide-react (+37 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (28): ChannelSummary(), getReportData(), PLATFORM_LABEL, ranked(), ReportBalance, ReportBar, ReportContactRow, ReportData (+20 more)

### Community 7 - "Agregação de métricas"
Cohesion: 0.18
Nodes (10): Acesso (dev), Convenções técnicas, Estado atual, Handoff original (contexto histórico, já resolvido), Histórico de iterações, O que é, Pendências / próximos passos, REGRAS-PROJETO — Painel de Métricas de Tráfego (GTech Solution) (+2 more)

### Community 13 - "Next config"
Cohesion: 0.08
Nodes (22): `ad_metrics` — Meta Ads + Google Ads, Cadastro no painel x credenciais no n8n, Como gravar (Supabase REST / upsert), Ingestão de dados via n8n, Princípios, `sync_runs` — log (opcional, recomendado), Tabelas e chaves de upsert, `web_metrics` — GA4 (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (28): SP, ACTION_NAME_LABEL, actionNameLabel(), CATEGORY_LABEL, categoryLabel(), CLICK_TYPE_LABEL, clickTypeLabel(), GoogleInsights() (+20 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (46): LoginForm(), safeNextPath(), AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), deleteClient(), FIELD_LABELS (+38 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (4): META_CRED, root, SUPABASE_CRED, workflow

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (20): actionOrigin(), CONVERSION_ACTION_TYPES, dedupeCampaigns(), int(), isConversion(), isRevenue(), mergeConversions(), mergeMetrics() (+12 more)

### Community 34 - "getClients"
Cohesion: 0.13
Nodes (28): cap(), friendlyOrigin(), SitePage(), SP, BarsChart(), ChartTooltip(), Item, DonutChart() (+20 more)

### Community 35 - "page.tsx"
Cohesion: 0.14
Nodes (21): Barras(), fmtMoneyPlain(), metadata, moneyPlain, RelatorioPage(), SP, PrintButton(), RelatorioControles() (+13 more)

## Knowledge Gaps
- **172 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Community 29` to `Dependências (package.json)`, `Login, Layout & ESLint`, `getClients`, `page.tsx`, `Community 28`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `Community 29` to `Dependências (package.json)`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `rangeFromSearch()` connect `Login, Layout & ESLint` to `Topbar & Camada de dados`, `getClients`, `page.tsx`, `Community 28`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getReportData()` (e.g. with `adGroupLabel()` and `adGroupNote()`) actually correct?**
  _`getReportData()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.06428571428571428 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.1191919191919192 - nodes in this community are weakly interconnected._