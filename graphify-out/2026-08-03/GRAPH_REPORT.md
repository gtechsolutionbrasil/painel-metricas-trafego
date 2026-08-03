# Graph Report - painel-metricas-trafego  (2026-08-03)

## Corpus Check
- 75 files · ~55,538 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 440 nodes · 849 edges · 36 communities (14 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd83f1a9`
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
3. `compilerOptions` - 16 edges
4. `OverviewPage()` - 15 edges
5. `SitePage()` - 15 edges
6. `formatValue()` - 15 edges
7. `getClients()` - 15 edges
8. `syncAccount()` - 14 edges
9. `rangeFromSearch()` - 14 edges
10. `fmtInt()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ClientesPage()` --calls--> `getIntegrationAccounts()`  [EXTRACTED]
  src/app/(dash)/clientes/page.tsx → src/lib/metrics/queries.ts
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts
- `OverviewPage()` --calls--> `fmtCurrency()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/format.ts
- `OverviewPage()` --calls--> `fmtCurrencyCents()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/format.ts
- `OverviewPage()` --calls--> `fmtInt()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/format.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Flow** — n8n_workflow, google_ads_api, meta_marketing_api, ga4_data_api, supabase_migrations_0001_init [EXTRACTED 1.00]
- **Dashboard Pages** — src_app_dash_page, src_app_dash_trafego_pago, src_app_dash_analytics, src_app_dash_clientes [EXTRACTED 1.00]

## Communities (36 total, 22 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.07
Nodes (48): CampaignFilter(), adByCampaign(), adByDay(), AdDayPoint, AdGroupRow, byConversionActionGrouped(), CampaignRow, ClickTypeRow (+40 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.10
Nodes (33): OverviewPage(), SP, cap(), friendlyOrigin(), SitePage(), SP, BarsChart(), ChartTooltip() (+25 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.14
Nodes (24): refreshData(), WEBHOOKS, buildMonth(), fmtBR(), iso(), MONTHS, parse(), PeriodPicker() (+16 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 4 - "TypeScript config"
Cohesion: 0.07
Nodes (26): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (19): date-fns, lucide-react, next, dependencies, date-fns, lucide-react, next, react (+11 more)

### Community 7 - "Agregação de métricas"
Cohesion: 0.18
Nodes (10): Acesso (dev), Convenções técnicas, Estado atual, Handoff original (contexto histórico, já resolvido), Histórico de iterações, O que é, Pendências / próximos passos, REGRAS-PROJETO — Painel de Métricas de Tráfego (GTech Solution) (+2 more)

### Community 13 - "Next config"
Cohesion: 0.08
Nodes (22): `ad_metrics` — Meta Ads + Google Ads, Cadastro no painel x credenciais no n8n, Como gravar (Supabase REST / upsert), Ingestão de dados via n8n, Princípios, `sync_runs` — log (opcional, recomendado), Tabelas e chaves de upsert, `web_metrics` — GA4 (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.08
Nodes (46): SP, platformDetail(), ChannelPage(), ACTION_NAME_LABEL, actionNameLabel(), CATEGORY_LABEL, categoryLabel(), CLICK_TYPE_LABEL (+38 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (30): AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), deleteClient(), FIELD_LABELS, normalizeMetaAdAccountId(), normalizeSlug() (+22 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (4): META_CRED, root, SUPABASE_CRED, workflow

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (20): actionOrigin(), CONVERSION_ACTION_TYPES, dedupeCampaigns(), int(), isConversion(), isRevenue(), mergeConversions(), mergeMetrics() (+12 more)

### Community 34 - "getClients"
Cohesion: 0.10
Nodes (19): LoginForm(), safeNextPath(), ClientesPage(), DashLayout(), GoogleAdsIcon(), IconProps, MetaAdsIcon(), Logo() (+11 more)

## Knowledge Gaps
- **157 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `getClients` to `Dependências (package.json)`, `Login, Layout & ESLint`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `getClients` to `Dependências (package.json)`, `Community 29`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `rangeFromSearch()` connect `Topbar & Camada de dados` to `Login, Layout & ESLint`, `Community 28`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.06599326599326599 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.09795918367346938 - nodes in this community are weakly interconnected._
- **Should `Topbar & Camada de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.135632183908046 - nodes in this community are weakly interconnected._