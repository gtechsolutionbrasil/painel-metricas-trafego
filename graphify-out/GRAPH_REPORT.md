# Graph Report - .  (2026-06-28)

## Corpus Check
- Corpus is ~24,504 words - fits in a single context window. You may not need a graph.

## Summary
- 183 nodes · 391 edges · 15 communities (11 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `OverviewPage()` - 15 edges
3. `TrafegoPagoPage()` - 14 edges
4. `AnalyticsPage()` - 12 edges
5. `formatValue()` - 12 edges
6. `getClients()` - 10 edges
7. `fmtInt()` - 8 edges
8. `rangeFromSearch()` - 8 edges
9. `getAdMetrics()` - 7 edges
10. `getWebMetrics()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts
- `AnalyticsPage()` --calls--> `fmtCompact()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/format.ts
- `AnalyticsPage()` --calls--> `fmtInt()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/format.ts
- `AnalyticsPage()` --calls--> `fmtPercent()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/format.ts
- `AnalyticsPage()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/analytics/page.tsx → src/lib/metrics/queries.ts

## Import Cycles
- None detected.

## Communities (15 total, 4 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.07
Nodes (27): dependencies, date-fns, lucide-react, next, react, react-dom, recharts, @supabase/ssr (+19 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.12
Nodes (12): eslintConfig, DashLayout(), Logo(), NAV, NavItem, Sidebar(), Topbar(), createSupabaseBrowserClient() (+4 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.17
Nodes (19): CAMPAigns, CLIENT_SCALE, dayFactor(), eachDate(), generateAdMetrics(), generateWebMetrics(), hashSeed(), MOCK_CLIENTS (+11 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.18
Nodes (13): BarsChart(), ChartTooltip(), Item, DonutSlice, AXIS, SERIES_PALETTE, Series, brl (+5 more)

### Community 4 - "TypeScript config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 5 - "Páginas dashboard & UI cards"
Cohesion: 0.31
Nodes (9): SP, SP, DonutChart(), CHART_COLORS, TrendAreaChart(), Card(), CardBody(), CardHeader() (+1 more)

### Community 6 - "Visão geral/Tráfego & Formatação"
Cohesion: 0.32
Nodes (12): OverviewPage(), TrafegoPagoPage(), fmtCompact(), fmtCurrency(), fmtCurrencyCents(), fmtInt(), fmtMultiplier(), fmtPercent() (+4 more)

### Community 7 - "Agregação de métricas"
Cohesion: 0.18
Nodes (10): adByCampaign(), AdDayPoint, adKpis, CampaignRow, PLATFORM_LABEL, PlatformBreak, SourceRow, WebDayPoint (+2 more)

### Community 8 - "Analytics web & métricas web"
Cohesion: 0.36
Nodes (9): AnalyticsPage(), SP, fmtDecimal(), fmtDuration(), webByDay(), webBySource(), getWebMetrics(), resolveClient() (+1 more)

### Community 10 - "Componente Badge"
Cohesion: 0.50
Nodes (3): Badge(), CLASS, Variant

### Community 12 - "Acesso Supabase (queries)"
Cohesion: 0.67
Nodes (3): getAdMetrics(), getClients(), createSupabaseServerClient()

## Knowledge Gaps
- **71 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+66 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Acesso Supabase (queries)` to `Login, Layout & ESLint`, `Topbar & Camada de dados`, `Páginas dashboard & UI cards`, `Visão geral/Tráfego & Formatação`, `Analytics web & métricas web`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `Login, Layout & ESLint` to `Topbar & Camada de dados`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _71 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._
- **Should `TypeScript config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._