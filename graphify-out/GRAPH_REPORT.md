# Graph Report - .  (2026-06-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 194 nodes · 259 edges · 24 communities (12 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f39953d5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Dependências (package.json)|Dependências (package.json)]]
- [[_COMMUNITY_Login, Layout & ESLint|Login, Layout & ESLint]]
- [[_COMMUNITY_Topbar & Camada de dados|Topbar & Camada de dados]]
- [[_COMMUNITY_Gráficos (Recharts)|Gráficos (Recharts)]]
- [[_COMMUNITY_TypeScript config|TypeScript config]]
- [[_COMMUNITY_Páginas dashboard & UI cards|Páginas dashboard & UI cards]]
- [[_COMMUNITY_Visão geralTráfego & Formatação|Visão geral/Tráfego & Formatação]]
- [[_COMMUNITY_Agregação de métricas|Agregação de métricas]]
- [[_COMMUNITY_Analytics web & métricas web|Analytics web & métricas web]]
- [[_COMMUNITY_Root layout (fontes)|Root layout (fontes)]]
- [[_COMMUNITY_Componente Badge|Componente Badge]]
- [[_COMMUNITY_Acesso Supabase (queries)|Acesso Supabase (queries)]]
- [[_COMMUNITY_Next config|Next config]]
- [[_COMMUNITY_PostCSSTailwind config|PostCSS/Tailwind config]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `formatValue()` - 12 edges
3. `createSupabaseServerClient()` - 8 edges
4. `isSupabaseConfigured` - 6 edges
5. `scripts` - 5 edges
6. `logQueryError()` - 5 edges
7. `getClients()` - 5 edges
8. `getIntegrationAccounts()` - 5 edges
9. `getAdMetrics()` - 5 edges
10. `getWebMetrics()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `n8n Workflows` --calls--> `Migration 0001: Init`  [EXTRACTED]
  docs/ingestao-n8n.md → supabase/migrations/0001_init.sql
- `Clientes e Integrações` --references--> `Migration 0004: Integration Accounts`  [EXTRACTED]
  src/app/(dash)/clientes/page.tsx → supabase/migrations/0004_client_integration_accounts.sql
- `createClientWithAccounts()` --calls--> `createSupabaseServerClient()`  [EXTRACTED]
  src/app/(dash)/clientes/actions.ts → src/lib/supabase/server.ts
- `Tráfego Pago` --calls--> `Metrics Aggregator`  [INFERRED]
  src/app/(dash)/trafego-pago/page.tsx → src/lib/metrics/aggregate.ts
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Pipeline** — n8n_workflow, supabase_db, src_app_clientes, docs_ingestao_n8n [EXTRACTED 0.95]
- **Data Ingestion Flow** — n8n_workflow, google_ads_api, meta_marketing_api, ga4_data_api, supabase_migrations_0001_init [EXTRACTED 1.00]
- **Dashboard Pages** — src_app_dash_page, src_app_dash_trafego_pago, src_app_dash_analytics, src_app_dash_clientes [EXTRACTED 1.00]

## Communities (24 total, 12 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.10
Nodes (26): DashLayout(), NAV, NavItem, Sidebar(), PLATFORM_OPTIONS, Topbar(), AdMetricRow, filterAdMetrics() (+18 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.11
Nodes (22): ChartTooltip(), Item, DonutSlice, AXIS, CHART_COLORS, SERIES_PALETTE, Series, brl (+14 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.14
Nodes (12): eslintConfig, LoginForm(), safeNextPath(), AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), normalizeSlug() (+4 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "TypeScript config"
Cohesion: 0.11
Nodes (18): dependencies, date-fns, lucide-react, next, react, react-dom, recharts, @supabase/ssr (+10 more)

### Community 5 - "Páginas dashboard & UI cards"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 6 - "Visão geral/Tráfego & Formatação"
Cohesion: 0.50
Nodes (7): defaultRange(), fromIso(), iso(), isValidIsoDate(), previousRange(), rangeDays(), rangeFromSearch()

### Community 7 - "Agregação de métricas"
Cohesion: 0.33
Nodes (5): Visão Geral, Tráfego Pago, Metrics Aggregator, Supabase Client, Auth Proxy

### Community 8 - "Analytics web & métricas web"
Cohesion: 0.40
Nodes (5): GA4 Data API, Google Ads API, Meta Marketing API, n8n Workflows, Migration 0001: Init

## Knowledge Gaps
- **78 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `isSupabaseConfigured` connect `Topbar & Camada de dados` to `Dependências (package.json)`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Páginas dashboard & UI cards` to `TypeScript config`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.09841269841269841 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Should `Topbar & Camada de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._
- **Should `Gráficos (Recharts)` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._