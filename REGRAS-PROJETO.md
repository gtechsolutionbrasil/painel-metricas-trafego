# REGRAS-PROJETO — Painel de Métricas de Tráfego (GTech Solution)

> Regras específicas deste projeto. Complementam as regras globais
> (`~/.claude/CLAUDE.md`). `CLAUDE.md`/`AGENTS.md` na raiz são atalhos
> (o `AGENTS.md`/`CLAUDE.md` gerados pelo create-next-app contêm avisos úteis
> sobre breaking changes do Next 16 — manter).

## O que é

Painel **multi-cliente de agência** que consolida **tráfego pago (Meta Ads +
Google Ads)** e **GA4/sites**, com login e recorte por cliente
(cada usuário vê só os clientes a que tem acesso).

## Stack e decisões

- **Front:** Next.js 16 (App Router) · React 19 · TypeScript · **Tailwind v4** (CSS-first, tokens em `globals.css`).
- **Banco/Auth:** **Supabase** (Postgres + Auth + RLS), multi-tenant.
- **Gráficos:** Recharts. Ícones: lucide-react.
- **Ingestão:** **n8n** coleta de Meta/Google/GA4 (workflows agendados) e grava
  no Supabase via service role; **o painel só lê**. Contrato em `docs/ingestao-n8n.md`.
- **Deploy:** Vercel.
- **Identidade visual:** tema **claro/admin premium** (NÃO o tema escuro neon
  padrão da skill `id-gtech2`) — decisão explícita do usuário. Verde principal
  `#16A34A`, fundo `#F8FAFC`, cards brancos, sombras suaves. Logo real da GTech
  em `public/brand/` (ícone oficial + wordmark; cor do logo ≠ cor de UI).

## Convenções técnicas

- **Next 16:** `middleware` virou **`proxy.ts`**; `params`/`searchParams`/`cookies()`
  são **assíncronos** (await). Docs locais em `node_modules/next/dist/docs/`.
- **Server → Client:** não passar funções como prop (não serializa). Gráficos
  recebem **chaves de formato** (`FmtKey`), resolvidas via `formatValue` no client.
- **Modo demonstração:** sem env do Supabase, o painel usa `src/lib/mock/data.ts`
  (determinístico) e libera as rotas sem login. Com env, ativa Auth + RLS.
- **Métricas derivadas** (CTR, CPC, CPL, ROAS) são calculadas no painel
  (`src/lib/metrics/aggregate.ts`), nunca gravadas.

## Estado atual

**Supabase no ar com dados reais.** Projeto ref `oqsjdhrwpmpdrihgbgtx`. Migrations
0001+0002 aplicadas (clients=3, ad_metrics=2160, web_metrics=1620). Auth + RLS
validados: usuário admin `guedesint@gmail.com` (role admin), login OK, RLS
liberando os 3 clientes e as métricas. `.env.local` configurado (gitignored).
Telas: Login, Visão geral, Tráfego pago, GA4 / Sites. Build OK.

## Pendências / próximos passos

- [ ] **Rotacionar segredos** expostos no chat (anon ok; rotacionar service_role,
      sb_secret e senha do banco em Settings → API/Database).
- [ ] Trocar a senha temporária do admin.
- [ ] Aplicar no Supabase a migration `0003_harden_profile_updates.sql`
      (hardening contra update de `role` pelo próprio usuário).
- [ ] Aplicar no Supabase a migration `0004_client_integration_accounts.sql`
      (integrações/fontes + `account_external_id` nas métricas).
- [ ] Fase 5: construir os 3 workflows n8n (Meta, Google, GA4) → Supabase
      preenchendo `account_external_id` (usar `SUPABASE_SERVICE_ROLE_KEY`;
      contrato em `docs/ingestao-n8n.md`; credenciais ficam no n8n, não no painel).
- [ ] Fase 6 sugerida: página **Conversões do site** por evento/canal
      (ver `docs/integracoes-ads-analytics.md`).
- [ ] Deploy na Vercel (configurar as 3 env vars; lembrar que `NEXT_PUBLIC_*`
      são embutidas no build).
- [ ] (Opcional) seletor de período custom (datas), export de relatório/PDF.

## Acesso (dev)

- Supabase URL: `https://oqsjdhrwpmpdrihgbgtx.supabase.co`
- Chaves no `.env.local` (não versionado). `.env.example` documenta os campos.
- Rodar migration nova: não há psql/CLI local — usar SQL Editor do Supabase,
  ou `node` + `pg` com a connection string (Settings → Database).

## Histórico de iterações

- **2026-06-28** — Setup inicial. Scaffold Next.js 16 + Tailwind v4. Design
  system tema claro GTech (verde #16A34A). Componentes (sidebar, topbar com
  seletor de cliente + período, KPI cards, cards, badges, tabelas) e gráficos
  Recharts (área, barras, donut). 3 dashboards lendo de Supabase|mock. Camada
  Supabase (SSR client, `proxy.ts` de auth, RLS). Migrations `0001_init.sql`
  (schema+RLS) e `0002_seed.sql`. Doc de ingestão n8n. Build verde, smoke test
  e screenshots OK.
- **2026-06-28** — Supabase conectado. Projeto real criado pelo usuário;
  migrations aplicadas via `node`+`pg` (sem psql local); seed populado
  (2160 ad + 1620 web). `.env.local` configurado. Usuário admin criado e
  promovido; auth + RLS validados de ponta a ponta. App passou a exigir login.
- **2026-06-28** — Hardening e planejamento de integrações. Corrigido `next`
  do login para aceitar apenas caminhos internos, datas passaram a usar fuso
  local e aceitar `from/to`, Topbar ganhou seletor de período no mobile, queries
  Supabase passaram a logar erros. Criada migration `0003_harden_profile_updates`
  para impedir update de `role` pelo próprio usuário. Adicionado guia
  `docs/integracoes-ads-analytics.md` explicando Google Ads/MCC, Meta Business,
  GA4/GTM e recomendando páginas de Integrações + Conversões do site.
- **2026-06-28** — Layout de filtros e cadastro de integrações. Topbar virou barra
  operacional com seleção de cliente, fonte de dados, origem paga
  (Google/Meta) e período. Criada página `/clientes` para cadastrar cliente e
  IDs de Google Ads, Meta Ads, GA4 e GTM. Adicionada migration
  `0004_client_integration_accounts` com tabela `integration_accounts`,
  policies admin e `account_external_id` em `ad_metrics`/`web_metrics`.
- **2026-06-29** — Ajuste de nomenclatura e UX de integrações. Página
  `/clientes` renomeada visualmente para **Clientes e integrações**, com copy
  separando mapeamento de IDs das credenciais do n8n. Topbar trocou "contas"
  por "fontes de dados" e simplificou o filtro Google/Meta sem ícones de moeda.
  Docs reforçam que o cadastro não coleta métricas sozinho: n8n lê
  `integration_accounts`, usa OAuth/tokens próprios e grava no Supabase.
- **2026-06-29** — GA4 e GTM no fluxo operacional. Aba `/analytics` renomeada
  visualmente para **GA4 / Sites**. Documentado que GA4 mede pós-clique
  (sessões, origem/mídia, eventos) e não substitui Google/Meta Ads para custo,
  impressões e campanhas. GTM fica como fonte de auditoria/tracking: dispara
  eventos que aparecem em GA4, Google Ads e Meta quando as tags estão corretas.
- **2026-07-02** — Setup Google Ads API (lado Google). Usuário criou o **MCC
  267-295-5792** e emitiu o **developer token** na Central de API (nível
  "Acesso às Análises" = Explorer Access: 2.880 ops/dia contra contas de
  produção, leitura — **já dá pra construir o workflow n8n sem esperar
  aprovação**). Aplicação de Acesso básico em andamento; gerado
  `docs/google-ads-api-design-doc.pdf` (design doc exigido no formulário).
  Contas a vincular ao MCC: 999-534-2886 (Madeireira Adrianna), 274-181-7052
  (Casa das Unhas Gravataí), 573-813-6627 (GTech). Token guardado só no n8n;
  rotacionar via "Redefinir token" após o setup (apareceu em screenshot).
- **2026-07-02** — Fase A (hardening pré-ingestão). Migration
  `0005_upsert_key_with_account.sql`: chave de upsert de `ad_metrics`/
  `web_metrics` passa a incluir `account_external_id` (evita mesclar dados de
  duas contas da mesma plataforma com campanhas homônimas). `queries.ts`:
  removido o fallback `isMissingIntegrationShape` (dívida da 0004 não aplicada)
  e adicionado `.range(0, 49_999)` — sem isso o PostgREST truncava em 1.000
  linhas e os KPIs saíam errados silenciosamente. `clientes/actions.ts`:
  `safeParse` + redirect com `?error=` (banner na página) no lugar de erro 500.
  `docs/ingestao-n8n.md`: chaves de conflito atualizadas + aviso `cost_micros`.
  Build verde. **Migrations 0003/0004/0005 ainda pendentes de aplicar no
  Supabase** (aguardando SUPABASE_DB_URL no `.env.local`). n8n acessível via
  MCP (`n8n.gtechsolutionbrasil.com`).
