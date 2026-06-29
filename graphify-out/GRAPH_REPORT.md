# Graph Report - .  (2026-06-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 206 nodes · 342 edges · 23 communities (10 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e70615dd`
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
- [[_COMMUNITY_Componente KpiCard|Componente KpiCard]]
- [[_COMMUNITY_Acesso Supabase (queries)|Acesso Supabase (queries)]]
- [[_COMMUNITY_Next config|Next config]]
- [[_COMMUNITY_PostCSSTailwind config|PostCSS/Tailwind config]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `TrafegoPagoPage()` - 13 edges
3. `formatValue()` - 12 edges
4. `AnalyticsPage()` - 10 edges
5. `getClients()` - 9 edges
6. `rangeFromSearch()` - 8 edges
7. `createSupabaseServerClient()` - 8 edges
8. `getAdMetrics()` - 7 edges
9. `getWebMetrics()` - 7 edges
10. `fmtInt()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `n8n Workflows` --calls--> `Supabase Postgres`  [EXTRACTED]
  docs/ingestao-n8n.md → README.md
- `AnalyticsPage()` --calls--> `rangeFromSearch()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/range.ts
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts
- `TrafegoPagoPage()` --calls--> `getAdMetrics()`  [EXTRACTED]
  src/app/(dash)/trafego-pago/page.tsx → src/lib/metrics/queries.ts
- `TrafegoPagoPage()` --calls--> `rangeFromSearch()`  [EXTRACTED]
  src/app/(dash)/trafego-pago/page.tsx → src/lib/range.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Pipeline** — n8n_workflow, supabase_db, src_app_clientes, docs_ingestao_n8n [EXTRACTED 0.95]
- **Authentication & Authorization** — src_proxy, src_app_login, src_lib_supabase, supabase_migrations_0001_init [EXTRACTED 0.90]
- **Metrics Visualization Layer** — src_app_dash_page, src_app_trafego_pago, src_app_analytics, src_lib_metrics_aggregate [INFERRED 0.85]

## Communities (23 total, 13 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.13
Nodes (29): AnalyticsPage(), SP, platformLabel(), SP, TrafegoPagoPage(), Card(), CardBody(), CardHeader() (+21 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.07
Nodes (27): dependencies, date-fns, lucide-react, next, react, react-dom, recharts, @supabase/ssr (+19 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.14
Nodes (13): eslintConfig, LoginForm(), safeNextPath(), AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), normalizeSlug() (+5 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "TypeScript config"
Cohesion: 0.20
Nodes (11): ChartTooltip(), Item, DonutChart(), DonutSlice, AXIS, CHART_COLORS, SERIES_PALETTE, Series (+3 more)

### Community 5 - "Páginas dashboard & UI cards"
Cohesion: 0.19
Nodes (13): AdMetricRow, filterAdMetrics(), filterWebMetrics(), getAdMetrics(), isMissingIntegrationShape(), WebMetricRow, AdMetric, Client (+5 more)

### Community 6 - "Visão geral/Tráfego & Formatação"
Cohesion: 0.21
Nodes (7): DashLayout(), NAV, NavItem, Sidebar(), PLATFORM_OPTIONS, Topbar(), getIntegrationAccounts()

### Community 8 - "Analytics web & métricas web"
Cohesion: 0.42
Nodes (8): defaultRange(), fromIso(), iso(), isValidIsoDate(), previousRange(), RANGE_PRESETS, rangeDays(), rangeFromSearch()

### Community 9 - "Root layout (fontes)"
Cohesion: 0.40
Nodes (5): Visão Geral, Metrics Aggregation, Mock Data, Supabase Client, Auth Proxy (Middleware)

## Knowledge Gaps
- **77 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Dependências (package.json)` to `Topbar & Camada de dados`, `Páginas dashboard & UI cards`, `Visão geral/Tráfego & Formatação`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `Topbar & Camada de dados` to `Páginas dashboard & UI cards`, `Visão geral/Tráfego & Formatação`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Metrics Aggregation` connect `Root layout (fontes)` to `Dependências (package.json)`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.13363363363363365 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Topbar & Camada de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._