# Graph Report - .  (2026-06-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 205 nodes · 392 edges · 17 communities (11 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ce3c25e1`
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
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `OverviewPage()` - 15 edges
3. `TrafegoPagoPage()` - 14 edges
4. `AnalyticsPage()` - 12 edges
5. `formatValue()` - 12 edges
6. `getClients()` - 10 edges
7. `rangeFromSearch()` - 10 edges
8. `fmtInt()` - 8 edges
9. `resolveClient()` - 7 edges
10. `fmtCurrency()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `REGRAS-PROJETO — Painel de Métricas de Tráfego` --references--> `Ingestão de dados via n8n`  [EXTRACTED]
  REGRAS-PROJETO.md → docs/ingestao-n8n.md
- `AnalyticsPage()` --calls--> `webByDay()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/metrics/aggregate.ts
- `AnalyticsPage()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/metrics/queries.ts
- `AnalyticsPage()` --calls--> `rangeFromSearch()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/range.ts
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Pipeline** — n8n_workflow_meta, n8n_workflow_google, n8n_workflow_ga4, supabase_ad_metrics, supabase_web_metrics [EXTRACTED 1.00]
- **Multi-tenant Architecture** — regras_projeto, supabase_ad_metrics, supabase_web_metrics, docs_integracoes_ads_analytics [INFERRED 0.80]

## Communities (17 total, 6 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.14
Nodes (34): AnalyticsPage(), SP, OverviewPage(), SP, SP, TrafegoPagoPage(), Card(), CardBody() (+26 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.07
Nodes (27): dependencies, date-fns, lucide-react, next, react, react-dom, recharts, @supabase/ssr (+19 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.10
Nodes (17): GA4 -> Supabase Workflow, Google Ads -> Supabase Workflow, Meta Ads -> Supabase Workflow, Badge(), CLASS, Variant, AdDayPoint, adKpis (+9 more)

### Community 4 - "TypeScript config"
Cohesion: 0.20
Nodes (12): BarsChart(), ChartTooltip(), Item, DonutChart(), DonutSlice, AXIS, CHART_COLORS, SERIES_PALETTE (+4 more)

### Community 5 - "Páginas dashboard & UI cards"
Cohesion: 0.21
Nodes (15): CAMPAigns, CLIENT_SCALE, dayFactor(), eachDate(), generateAdMetrics(), generateWebMetrics(), hashSeed(), MOCK_CLIENTS (+7 more)

### Community 6 - "Visão geral/Tráfego & Formatação"
Cohesion: 0.19
Nodes (8): DashLayout(), Logo(), NAV, NavItem, Sidebar(), Topbar(), getClients(), RANGE_PRESETS

### Community 7 - "Agregação de métricas"
Cohesion: 0.22
Nodes (5): eslintConfig, isSupabaseConfigured, updateSession(), config, proxy()

### Community 8 - "Analytics web & métricas web"
Cohesion: 0.22
Nodes (8): Ingestão de dados via n8n, Integrações: Google Ads, Meta Ads, GA4 e GTM, Banco (Supabase), Estrutura, Painel de Métricas de Tráfego — GTech Solution, Rodando localmente, Scripts, REGRAS-PROJETO — Painel de Métricas de Tráfego

### Community 9 - "Root layout (fontes)"
Cohesion: 0.61
Nodes (7): defaultRange(), fromIso(), iso(), isValidIsoDate(), previousRange(), rangeDays(), rangeFromSearch()

## Knowledge Gaps
- **82 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Visão geral/Tráfego & Formatação` to `Dependências (package.json)`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `REGRAS-PROJETO — Painel de Métricas de Tráfego` connect `Analytics web & métricas web` to `Páginas dashboard & UI cards`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.13847780126849896 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Topbar & Camada de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Gráficos (Recharts)` be split into smaller, more focused modules?**
  _Cohesion score 0.09941520467836257 - nodes in this community are weakly interconnected._