# Graph Report - painel-metricas-trafego  (2026-08-09)

## Corpus Check
- 91 files · ~70,287 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 587 nodes · 1201 edges · 47 communities (26 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3598288e`
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
- Plano de publicação — tracking da Madeireira Adrianna
- Tabelas e chaves de upsert
- Plano — tracking confiável + mini CRM
- Ingestão de dados via n8n
- Padrão de UTMs — Madeireira Adrianna
- Painel de Métricas de Tráfego — GTech Solution
- validate-n8n-workflows.mjs
- page.tsx
- Sidebar.tsx
- results.ts

## God Nodes (most connected - your core abstractions)
1. `GoogleInsights()` - 29 edges
2. `ChannelPage()` - 26 edges
3. `OverviewPage()` - 24 edges
4. `createSupabaseServerClient()` - 21 edges
5. `SitePage()` - 19 edges
6. `fmtInt()` - 19 edges
7. `getClients()` - 19 edges
8. `getReportData()` - 19 edges
9. `rangeFromSearch()` - 18 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `buildReturnTo()` --indirect_call--> `key()`  [INFERRED]
  src/app/(dash)/crm/page.tsx → src/lib/report/labels.ts
- `SignalCard()` --calls--> `fmtInt()`  [EXTRACTED]
  src/app/(dash)/page.tsx → src/lib/format.ts
- `ChannelSummary()` --indirect_call--> `key()`  [INFERRED]
  src/app/(dash)/page.tsx → src/lib/report/labels.ts
- `ExportReportButton()` --indirect_call--> `key()`  [INFERRED]
  src/components/layout/ExportReportButton.tsx → src/lib/report/labels.ts
- `SourceHeader()` --calls--> `fmtInt()`  [EXTRACTED]
  src/components/pages/GoogleInsights.tsx → src/lib/format.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Ingestion Flow** — n8n_workflow, google_ads_api, meta_marketing_api, ga4_data_api, supabase_migrations_0001_init [EXTRACTED 1.00]
- **Dashboard Pages** — src_app_dash_page, src_app_dash_trafego_pago, src_app_dash_analytics, src_app_dash_clientes [EXTRACTED 1.00]

## Communities (47 total, 21 thin omitted)

### Community 0 - "Dependências (package.json)"
Cohesion: 0.06
Nodes (45): CampaignFilter(), adByPlatform(), AdDayPoint, AdGroupRow, byConversionActionGrouped(), CampaignRow, ClickTypeRow, ConversionActionGroup (+37 more)

### Community 1 - "Login, Layout & ESLint"
Cohesion: 0.13
Nodes (29): SP, buildMonth(), fmtBR(), iso(), MONTHS, parse(), PeriodPicker(), WEEK (+21 more)

### Community 2 - "Topbar & Camada de dados"
Cohesion: 0.09
Nodes (23): AccountInput, buildAccounts(), clientSchema, createClientWithAccounts(), deleteClient(), FIELD_LABELS, normalizeMetaAdAccountId(), normalizeSlug() (+15 more)

### Community 3 - "Gráficos (Recharts)"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 4 - "TypeScript config"
Cohesion: 0.04
Nodes (46): date-fns, eslint, eslint-config-next, lucide-react, next, dependencies, date-fns, lucide-react (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (28): ChannelSummary(), getReportData(), PLATFORM_LABEL, ranked(), ReportBalance, ReportBar, ReportContactRow, ReportPlatform (+20 more)

### Community 7 - "Agregação de métricas"
Cohesion: 0.18
Nodes (10): Acesso (dev), Convenções técnicas, Estado atual, Handoff original (contexto histórico, já resolvido), Histórico de iterações, O que é, Pendências / próximos passos, REGRAS-PROJETO — Painel de Métricas de Tráfego (GTech Solution) (+2 more)

### Community 13 - "Next config"
Cohesion: 0.25
Nodes (8): Camada operacional preparada, Como conectar cada fonte, Estado implementado no painel, Fluxo recomendado no n8n, GA4 e sites com GTM, Google Ads, Integrações: Google Ads, Meta Ads, GA4 e GTM, Meta Ads

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (28): SP, ACTION_NAME_LABEL, actionNameLabel(), CATEGORY_LABEL, categoryLabel(), CLICK_TYPE_LABEL, clickTypeLabel(), GoogleInsights() (+20 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (41): refreshData(), WEBHOOKS, ClientesPage(), createLead(), createLeadSchema, parseCurrencyBR(), parseSaoPauloDateTime(), redirectWithFeedback() (+33 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (4): META_CRED, root, SUPABASE_CRED, workflow

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (5): GA4 -> Supabase, Google Ads -> Supabase, Meta Ads -> Supabase, Segurança, Workflows n8n do painel

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (22): actionOrigin(), CONVERSION_ACTION_TYPES, dedupeCampaigns(), int(), isConversation(), isDetailAction(), isRevenue(), mergeConversions() (+14 more)

### Community 34 - "getClients"
Cohesion: 0.12
Nodes (34): cap(), first(), friendlyOrigin(), PageList(), SitePage(), SP, unknownTrafficShare(), BarsChart() (+26 more)

### Community 35 - "page.tsx"
Cohesion: 0.09
Nodes (26): buildReturnTo(), CHANNEL_LABEL, CrmPage(), first(), LeadForm(), saoPauloDateTimeLocal(), SOURCE_LABEL, SP (+18 more)

### Community 36 - "Plano de publicação — tracking da Madeireira Adrianna"
Cohesion: 0.22
Nodes (9): Gate 1 — Supabase, Gate 2 — n8n GA4, Gate 3 — n8n Google Ads, Gate 4 — GTM, GA4 e Google Ads, Gate 5 — Meta Pixel/CAPI, Gate 6 — UTMs, Gate 7 — aplicação, Plano de publicação — tracking da Madeireira Adrianna (+1 more)

### Community 37 - "Tabelas e chaves de upsert"
Cohesion: 0.25
Nodes (8): `ad_conversion_actions` — resultados por ação, `ad_metrics` — Meta Ads + Google Ads, `leads` e `lead_status_history` — mini-CRM, `sync_runs` — log (opcional, recomendado), Tabelas e chaves de upsert, `tracking_checks` — saúde do tracking, `web_events` — eventos do site recebidos no GA4, `web_metrics` — GA4

### Community 39 - "Plano — tracking confiável + mini CRM"
Cohesion: 0.33
Nodes (5): Critérios de aceite, Entregas locais, Gates de publicação (opção 3B), Objetivo, Plano — tracking confiável + mini CRM

### Community 40 - "Ingestão de dados via n8n"
Cohesion: 0.40
Nodes (5): Cadastro no painel x credenciais no n8n, Como gravar (Supabase REST / upsert), Ingestão de dados via n8n, Princípios, Workflows sugeridos (1 por fonte)

### Community 41 - "Padrão de UTMs — Madeireira Adrianna"
Cohesion: 0.40
Nodes (5): Campos obrigatórios, Google Ads, Meta Ads, Padrão de UTMs — Madeireira Adrianna, Regras de qualidade

### Community 42 - "Painel de Métricas de Tráfego — GTech Solution"
Cohesion: 0.40
Nodes (5): Banco (Supabase), Estrutura, Painel de Métricas de Tráfego — GTech Solution, Rodando localmente, Scripts

### Community 44 - "page.tsx"
Cohesion: 0.14
Nodes (20): LeadCard(), Barras(), fmtMoneyPlain(), metadata, moneyPlain, RelatorioPage(), SP, PrintButton() (+12 more)

### Community 45 - "Sidebar.tsx"
Cohesion: 0.17
Nodes (10): LoginForm(), safeNextPath(), GoogleAdsIcon(), IconProps, MetaAdsIcon(), Logo(), NAV, NavIcon (+2 more)

### Community 46 - "results.ts"
Cohesion: 0.17
Nodes (15): ClassifiedResult, classifyAdAction(), classifyWebEvent(), emptyKinds(), HealthStatus, normalized(), RESULT_LABELS, ResultBucket (+7 more)

## Knowledge Gaps
- **216 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+211 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getClients()` connect `Community 29` to `Login, Layout & ESLint`, `Topbar & Camada de dados`, `page.tsx`, `getClients`, `page.tsx`, `Community 28`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `Community 29` to `Topbar & Camada de dados`, `Sidebar.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `rangeFromSearch()` connect `Login, Layout & ESLint` to `getClients`, `page.tsx`, `page.tsx`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.05877551020408163 - nodes in this community are weakly interconnected._
- **Should `Login, Layout & ESLint` be split into smaller, more focused modules?**
  _Cohesion score 0.13109243697478992 - nodes in this community are weakly interconnected._
- **Should `Topbar & Camada de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._