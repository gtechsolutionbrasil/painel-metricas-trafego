# Graph Report - painel-metricas-trafego  (2026-07-07)

## Corpus Check
- 66 files · ~43,571 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 401 nodes · 770 edges · 31 communities (12 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e72e26c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Dependências (package.json)|Dependências (package.json)]]
- [[_COMMUNITY_Login, Layout & ESLint|Login, Layout & ESLint]]
- [[_COMMUNITY_Topbar & Camada de dados|Topbar & Camada de dados]]
- [[_COMMUNITY_Gráficos (Recharts)|Gráficos (Recharts)]]
- [[_COMMUNITY_TypeScript config|TypeScript config]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Agregação de métricas|Agregação de métricas]]
- [[_COMMUNITY_Analytics web & métricas web|Analytics web & métricas web]]
- [[_COMMUNITY_Root layout (fontes)|Root layout (fontes)]]
- [[_COMMUNITY_Componente Badge|Componente Badge]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Acesso Supabase (queries)|Acesso Supabase (queries)]]
- [[_COMMUNITY_Next config|Next config]]
- [[_COMMUNITY_PostCSSTailwind config|PostCSS/Tailwind config]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `ChannelPage()` - 18 edges
2. `GoogleInsights()` - 18 edges
3. `compilerOptions` - 16 edges
4. `getClients()` - 15 edges
5. `OverviewPage()` - 14 edges
6. `rangeFromSearch()` - 14 edges
7. `SitePage()` - 12 edges
8. `formatValue()` - 12 edges
9. `fmtInt()` - 11 edges
10. `createSupabaseServerClient()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts
- `SourceHeader()` --calls--> `fmtInt()`  [EXTRACTED]
  src/components/pages/GoogleInsights.tsx → src/lib/format.ts
- `createClientWithAccounts()` --calls--> `createSupabaseServerClient()`  [EXTRACTED]
  src/app/(dash)/clientes/actions.ts → src/lib/supabase/server.ts
- `deleteClient()` --calls--> `createSupabaseServerClient()`  [EXTRACTED]
  src/app/(dash)/clientes/actions.ts → src/lib/supabase/server.ts
- `OverviewPage()` --calls--> `previousRange()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/range.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Pipeline** — n8n_workflow, supabase_db, src_app_clientes, docs_ingestao_n8n [EXTRACTED 0.95]
- **Data Ingestion Flow** — n8n_workflow, google_ads_api, meta_marketing_api, ga4_data_api, supabase_migrations_0001_init [EXTRACTED 1.00]
- **Dashboard Pages** — src_app_dash_page, src_app_dash_trafego_pago, src_app_dash_analytics, src_app_dash_clientes [EXTRACTED 1.00]

## Communities (31 total, 19 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.10
Nodes (31): CampaignFilter(), AdMetricRow, BreakdownRow, filterAdMetrics(), filterWebMetrics(), WebMetricRow, CAMPAigns, CLIENT_SCALE (+23 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.07
Nodes (60): ClientesPage(), SP, OverviewPage(), platformDetail(), SP, cap(), friendlyOrigin(), SitePage() (+52 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.09
Nodes (26): DashLayout(), GoogleAdsIcon(), IconProps, MetaAdsIcon(), buildMonth(), fmtBR(), iso(), MONTHS (+18 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "TypeScript config"
Cohesion: 0.07
Nodes (28): dependencies, date-fns, lucide-react, next, react, react-dom, recharts, @supabase/ssr (+20 more)

### Community 7 - "Agregação de métricas"
Cohesion: 0.20
Nodes (9): Acesso (dev), Convenções técnicas, Estado atual, >>> HANDOFF 2026-07-07 (Claude → Codex): onde parou o Meta Ads, Histórico de iterações, O que é, Pendências / próximos passos, REGRAS-PROJETO — Painel de Métricas de Tráfego (GTech Solution) (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (32): buildUrl(), campaignName(), collectAccount(), configValue(), conversionTotal(), fetchMetaAccounts(), inputConfig(), insertSyncRun() (+24 more)

### Community 13 - "Next config"
Cohesion: 0.08
Nodes (22): `ad_metrics` — Meta Ads + Google Ads, Cadastro no painel x credenciais no n8n, Como gravar (Supabase REST / upsert), Ingestão de dados via n8n, Princípios, `sync_runs` — log (opcional, recomendado), Tabelas e chaves de upsert, `web_metrics` — GA4 (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (40): SP, ACTION_NAME_LABEL, CATEGORY_LABEL, categoryLabel(), CLICK_TYPE_LABEL, clickTypeLabel(), GoogleInsights(), MATCH_LABEL (+32 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (25): eslintConfig, LoginForm(), safeNextPath(), AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), deleteClient() (+17 more)

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (3): code, root, workflow

## Knowledge Gaps
- **150 isolated node(s):** `eslintConfig`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCESS_TOKEN`, `META_GRAPH_API_VERSION` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Login, Layout & ESLint` to `Dependências (package.json)`, `Topbar & Camada de dados`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `rangeFromSearch()` connect `Topbar & Camada de dados` to `Login, Layout & ESLint`, `Community 28`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `Community 29` to `Dependências (package.json)`, `Topbar & Camada de dados`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` to the rest of the system?**
  _150 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.1036036036036036 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.07140538786108407 - nodes in this community are weakly interconnected._
- **Should `Topbar & Camada de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.09411764705882353 - nodes in this community are weakly interconnected._