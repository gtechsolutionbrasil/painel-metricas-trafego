# Graph Report - .  (2026-06-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 217 nodes · 326 edges · 23 communities (13 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c422de12`
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
- [[_COMMUNITY_PostCSSTailwind config|PostCSS/Tailwind config]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `formatValue()` - 12 edges
3. `getClients()` - 12 edges
4. `getAdMetrics()` - 9 edges
5. `getWebMetrics()` - 9 edges
6. `OverviewPage()` - 7 edges
7. `resolveClient()` - 7 edges
8. `generateAdMetrics()` - 7 edges
9. `generateWebMetrics()` - 7 edges
10. `TrafegoPagoPage()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `n8n Workflows` --calls--> `ad_metrics`  [EXTRACTED]
  docs/ingestao-n8n.md → supabase/migrations/0001_init.sql
- `n8n Workflows` --calls--> `web_metrics`  [EXTRACTED]
  docs/ingestao-n8n.md → supabase/migrations/0001_init.sql
- `Tráfego Pago` --references--> `ad_metrics`  [INFERRED]
  src/app/(dash)/trafego-pago/page.tsx → supabase/migrations/0001_init.sql
- `Analytics` --references--> `web_metrics`  [INFERRED]
  src/app/(dash)/analytics/page.tsx → supabase/migrations/0001_init.sql
- `Clientes e Contas` --references--> `integration_accounts`  [EXTRACTED]
  src/app/(dash)/clientes/page.tsx → supabase/migrations/0004_client_integration_accounts.sql

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Pipeline** — n8n_workflow, supabase_table_ad_metrics, supabase_table_web_metrics, docs_ingestao_n8n [EXTRACTED 1.00]
- **Dashboard Protected Routes** — src_app_page, src_app_trafego_pago, src_app_analytics, src_app_clientes [EXTRACTED 1.00]

## Communities (23 total, 10 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.14
Nodes (25): AnalyticsPage(), SP, ClientesPage(), DashLayout(), OverviewPage(), platformLabel(), SP, platformLabel() (+17 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.11
Nodes (22): ChartTooltip(), Item, DonutSlice, AXIS, CHART_COLORS, SERIES_PALETTE, Series, brl (+14 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.15
Nodes (19): Topbar(), CAMPAigns, CLIENT_SCALE, dayFactor(), eachDate(), generateAdMetrics(), generateWebMetrics(), hashSeed() (+11 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "TypeScript config"
Cohesion: 0.11
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 5 - "Páginas dashboard & UI cards"
Cohesion: 0.18
Nodes (6): eslintConfig, LoginForm(), safeNextPath(), Logo(), createSupabaseBrowserClient(), isSupabaseConfigured

### Community 6 - "Visão geral/Tráfego & Formatação"
Cohesion: 0.17
Nodes (8): AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), normalizeSlug(), PROVIDER_LABEL, SP, IntegrationProvider

### Community 7 - "Agregação de métricas"
Cohesion: 0.20
Nodes (10): dependencies, date-fns, lucide-react, next, react, react-dom, recharts, @supabase/ssr (+2 more)

### Community 8 - "Analytics web & métricas web"
Cohesion: 0.42
Nodes (8): defaultRange(), fromIso(), iso(), isValidIsoDate(), previousRange(), RANGE_PRESETS, rangeDays(), rangeFromSearch()

### Community 9 - "Root layout (fontes)"
Cohesion: 0.40
Nodes (5): n8n Workflows, Analytics, Tráfego Pago, ad_metrics, web_metrics

## Knowledge Gaps
- **82 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Dependências (package.json)` to `Visão geral/Tráfego & Formatação`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `DateRange` connect `Topbar & Camada de dados` to `Dependências (package.json)`, `Analytics web & métricas web`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Agregação de métricas` to `TypeScript config`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Should `Gráficos (Recharts)` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._