# Graph Report - painel-metricas-trafego  (2026-07-06)

## Corpus Check
- 56 files · ~35,794 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 318 nodes · 625 edges · 30 communities (12 shown, 18 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bedc7c1e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Dependências (package.json)|Dependências (package.json)]]
- [[_COMMUNITY_Login, Layout & ESLint|Login, Layout & ESLint]]
- [[_COMMUNITY_Topbar & Camada de dados|Topbar & Camada de dados]]
- [[_COMMUNITY_Gráficos (Recharts)|Gráficos (Recharts)]]
- [[_COMMUNITY_TypeScript config|TypeScript config]]
- [[_COMMUNITY_Páginas dashboard & UI cards|Páginas dashboard & UI cards]]
- [[_COMMUNITY_Community 6|Community 6]]
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

## God Nodes (most connected - your core abstractions)
1. `ChannelPage()` - 16 edges
2. `compilerOptions` - 16 edges
3. `getClients()` - 15 edges
4. `OverviewPage()` - 14 edges
5. `rangeFromSearch()` - 14 edges
6. `GoogleInsights()` - 13 edges
7. `SitePage()` - 12 edges
8. `formatValue()` - 12 edges
9. `fmtInt()` - 10 edges
10. `createSupabaseServerClient()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `DashLayout()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/layout.tsx → src/lib/metrics/queries.ts
- `OverviewPage()` --calls--> `getClients()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/metrics/queries.ts
- `OverviewPage()` --calls--> `getWebMetrics()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/metrics/queries.ts
- `OverviewPage()` --calls--> `previousRange()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/range.ts
- `OverviewPage()` --calls--> `rangeFromSearch()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/range.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Pipeline** — n8n_workflow, supabase_db, src_app_clientes, docs_ingestao_n8n [EXTRACTED 0.95]
- **Data Ingestion Flow** — n8n_workflow, google_ads_api, meta_marketing_api, ga4_data_api, supabase_migrations_0001_init [EXTRACTED 1.00]
- **Dashboard Pages** — src_app_dash_page, src_app_dash_trafego_pago, src_app_dash_analytics, src_app_dash_clientes [EXTRACTED 1.00]

## Communities (30 total, 18 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.09
Nodes (37): AdDayPoint, adKpis, CampaignRow, ClickTypeRow, ConversionActionRow, GeoRow, KeywordRow, PLATFORM_LABEL (+29 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.11
Nodes (30): cap(), friendlyOrigin(), SitePage(), SP, BarsChart(), ChartTooltip(), Item, DonutChart() (+22 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.33
Nodes (10): iso(), Topbar(), defaultRange(), fromIso(), iso(), isValidIsoDate(), previousRange(), RANGE_PRESETS (+2 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "TypeScript config"
Cohesion: 0.07
Nodes (27): dependencies, date-fns, lucide-react, next, react, react-dom, recharts, @supabase/ssr (+19 more)

### Community 5 - "Páginas dashboard & UI cards"
Cohesion: 0.23
Nodes (7): LoginForm(), safeNextPath(), Logo(), NAV, NavItem, Sidebar(), createSupabaseBrowserClient()

### Community 7 - "Agregação de métricas"
Cohesion: 0.22
Nodes (8): Acesso (dev), Convenções técnicas, Estado atual, Histórico de iterações, O que é, Pendências / próximos passos, REGRAS-PROJETO — Painel de Métricas de Tráfego (GTech Solution), Stack e decisões

### Community 11 - "Componente KpiCard"
Cohesion: 0.13
Nodes (24): SP, OverviewPage(), platformDetail(), SP, CampaignFilter(), ChannelPage(), SP, Card() (+16 more)

### Community 13 - "Next config"
Cohesion: 0.08
Nodes (22): `ad_metrics` — Meta Ads + Google Ads, Cadastro no painel x credenciais no n8n, Como gravar (Supabase REST / upsert), Ingestão de dados via n8n, Princípios, `sync_runs` — log (opcional, recomendado), Tabelas e chaves de upsert, `web_metrics` — GA4 (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (18): SP, CATEGORY_LABEL, categoryLabel(), CLICK_TYPE_LABEL, clickTypeLabel(), GoogleInsights(), MATCH_LABEL, prettyEnum() (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (26): eslintConfig, AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), deleteClient(), FIELD_LABELS, normalizeSlug() (+18 more)

## Knowledge Gaps
- **126 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+121 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Community 29` to `Dependências (package.json)`, `Login, Layout & ESLint`, `Componente KpiCard`, `Community 28`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `Community 29` to `Dependências (package.json)`, `Páginas dashboard & UI cards`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `rangeFromSearch()` connect `Topbar & Camada de dados` to `Login, Layout & ESLint`, `Componente KpiCard`, `Community 28`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _126 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.08943089430894309 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.11095305832147938 - nodes in this community are weakly interconnected._
- **Should `Gráficos (Recharts)` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._