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

**No ar em produção.** Projeto Supabase ref `oqsjdhrwpmpdrihgbgtx`,
migrations 0001–0005 aplicadas. Auth + RLS validados. `.env.local` configurado.
Telas: Login, **Visão geral · Google · Meta · Site · Integrações** (nav por canal
com linguagem simples). Build OK.
**Deploy:** Vercel — `painel-metricas-trafego.vercel.app` (Auth ativo em prod,
só 2 env vars `NEXT_PUBLIC_*`; service_role NÃO vai pro front). Subdomínio
`painelmetricas.gtechsolutionbrasil.com.br` aguardando propagação de DNS
(CNAME + TXT no Hostinger).
**Admin:** login `gabriel@gtechsolutionbrasil.com` (email+senha redefinidos nesta
sessão via Supabase Admin API; role admin preservada).

**Workflows n8n (`n8n.gtechsolutionbrasil.com`, tag `painel-metricas-trafego`):**
- **GA4 → Supabase** (id `oFVQoWFdstKOZcM4`): ✅ ATIVO e testado com dado real —
  gravou 25 linhas reais da Madeireira (property 541643814) em `web_metrics`.
  Roda todo dia 06:00.
- **Google Ads → Supabase** (id `Ui5tKcvG1aRmWptS`): ✅ ATIVO, pipeline
  100% correto (OAuth + developer-token + GAQL validados). **Bloqueado só pelo
  vínculo MCC**: retorna `USER_PERMISSION_DENIED` até as contas dos clientes
  serem vinculadas ao MCC 267-295-5792 e o convite aceito. Roda 06:30.
- Credenciais n8n: `Supabase - Painel Métricas` (sfp0d2ZkWr7zz5wM),
  `Google Analytics account` (I8evqpJf7UDmKsGB),
  `Google Ads account` (tcBb8A3FKBjc2nOt). OAuth client reaproveitado
  `n8n-app-googlecloud` (Google Cloud project-90820b4a-ac18-4f5d-914,
  publicado/Em produção).

**Clientes reais cadastrados** (via SQL, autorizado): Madeireira Adrianna
(GA4 541643814 + Ads 999-534-2886), Casa das Unhas Gravataí (Ads 274-181-7052).
Os 3 do seed (Aurora, Nova, Vitta) permanecem como demonstração.

**Aprendizados Google Ads API (HTTP Request genérico):** (1) o header
`developer-token` NÃO é injetado automaticamente pelo predefinedCredentialType —
adicionar manualmente; (2) `googleAds:search` NÃO aceita `pageSize` no body
(fixo 10.000); (3) `cost_micros` ÷ 1.000.000; (4) `login-customer-id` = MCC sem
hífens.

## Pendências / próximos passos

- [x] ~~Aplicar migrations 0003/0004/0005~~ (aplicadas em 2026-07-03 via
      node+pg; senha do banco foi resetada = rotacionada).
- [x] ~~Trocar senha temporária do admin~~ (feito 2026-07-05: email →
      `gabriel@gtechsolutionbrasil.com`, senha redefinida via Admin API).
- [ ] **Rotacionar segredos restantes**: service_role e sb_secret
      (Settings → API) — expostos em chat; rotacionar antes de uso amplo.
- [ ] **DNS do subdomínio**: criar no Hostinger CNAME `painelmetricas` →
      `3709d20de58b6c30.vercel-dns-017.com` + TXT `_vercel` (verificação). Depois
      Refresh na Vercel e conferir SSL.
- [ ] **Supabase Auth URL config** (pós-DNS): Site URL + Redirect URL =
      `https://painelmetricas.gtechsolutionbrasil.com.br`.
- [ ] Rotacionar o **developer token** do Google Ads ("Redefinir token" na
      Central de API) depois que o n8n estiver configurado (apareceu em chat).
- [ ] Fase 5 (EM ANDAMENTO): 3 workflows n8n (GA4 → Google → Meta) → Supabase
      preenchendo `account_external_id` (contrato em `docs/ingestao-n8n.md`;
      credenciais ficam no n8n, não no painel).
- [ ] Google Cloud: projeto + OAuth client (Google Ads/n8n) + service account
      (GA4). Redirect OAuth do n8n:
      `https://n8n.gtechsolutionbrasil.com/rest/oauth2-credential/callback`.
- [ ] Vincular **Casa das Unhas** (274-181-7052) ao MCC 267-295-5792 e aceitar
      o convite (Madeireira já vinculada e gravando). Entra sozinha no próximo
      06:30 após o vínculo — workflow já resiliente.
- [ ] (histórico) Vincular contas ao MCC e cadastrar os IDs
      na página /clientes.
- [ ] Fase 6 sugerida: página **Conversões do site** por evento/canal
      (ver `docs/integracoes-ads-analytics.md`).
- [ ] Deploy na Vercel (configurar as 3 env vars; lembrar que `NEXT_PUBLIC_*`
      são embutidas no build).
- [ ] (Opcional) seletor de período custom (datas), export de relatório/PDF.

## Acesso (dev)

- Supabase URL: `https://oqsjdhrwpmpdrihgbgtx.supabase.co`
- Chaves no `.env.local` (não versionado). `.env.example` documenta os campos.
- Rodar migration nova: não há psql/CLI local — usar `node` + `pg` com a
  `SUPABASE_DB_URL` do `.env.local` (Session pooler `aws-1-sa-east-1`;
  o host direto `db.<ref>.supabase.co` não resolve em IPv4). Alternativa:
  SQL Editor do Supabase.
- n8n da agência: `https://n8n.gtechsolutionbrasil.com` (acessível via MCP
  `n8n-mcp` — MCP essencial permanente deste projeto para a fase de ingestão).

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
- **2026-07-03** — Migrations 0003/0004/0005 APLICADAS no Supabase de produção
  (autorizado pelo usuário; senha do banco resetada e salva como
  `SUPABASE_DB_URL` no `.env.local`). Validação pós-aplicação: tabela
  `integration_accounts` criada, `account_external_id` em ad/web_metrics,
  constraints `ad_metrics_upsert_key`/`web_metrics_upsert_key` ativas, policy
  `profiles_update_own_full_name` no lugar da antiga, dados intactos
  (3 clients / 2160 ad / 1620 web). Região do pooler: `aws-1-sa-east-1`.
  Aplicação de Acesso básico da Google Ads API submetida (form + design doc).
- **2026-07-03** — Workflows n8n criados via MCP (inativos, aguardando
  credenciais): **GA4 → Supabase** (`oFVQoWFdstKOZcM4`, diário 06:00) e
  **Google Ads → Supabase** (`Ui5tKcvG1aRmWptS`, diário 06:30, API v21,
  `login-customer-id` = MCC 2672955792). Padrão dos dois: Schedule →
  busca `integration_accounts` por provider → API do Google por conta →
  Code mapeia (GA4: YYYYMMDD→ISO, bounce 0..1; Ads: cost_micros/1e6,
  conversions arredondado) → upsert com `on_conflict` incluindo
  `account_external_id` → log em `sync_runs`. Retry 3x nos nós HTTP.
  Ambos validados (0 erros). Falta: credencial Supabase no n8n (criação via
  MCP bloqueada pelo classificador — criar na UI ou autorizar), OAuth client
  no Google Cloud, credenciais GA4/Google Ads no n8n, anexar aos nós, testar
  e ativar. Workflow Meta fica pra depois (precisa token do Business Manager).
- **2026-07-04** — Credencial `Supabase - Painel Métricas (service role)` criada
  no n8n via MCP (id `sfp0d2ZkWr7zz5wM`, autorizada pelo usuário) e anexada aos
  6 nós Supabase dos 2 workflows. Tag `painel-metricas-trafego` nos dois
  (pasta é só UI — usuário arrasta). Google Cloud: usuário no projeto
  `project-90820b4a-ac18-4f5d-914` (trial), próximo passo = ativar APIs +
  OAuth client. Falta: credenciais Google no n8n → anexar → testar → ativar.
- **2026-07-05** — Ingestão real ligada. Aplicadas migrations 0003/0004/0005 e
  cadastrados clientes reais (Madeireira, Casa das Unhas) + integrações via SQL.
  Criadas credenciais Google (GA4 + Ads) no n8n e anexadas aos 2 workflows.
  **GA4 testado E2E com dado real (25 linhas da Madeireira em web_metrics)** e
  ativado (06:00). Google Ads: corrigidos 3 erros de API (developer-token header,
  pageSize, formato) — pipeline OK; ativo mas retorna USER_PERMISSION_DENIED até
  vincular as contas ao MCC 267-295-5792. Ambos com schedule diário ativo.
- **2026-07-05 (cont.)** — Google Ads também gravando REAL. Tornado o nó GAQL
  resiliente (`onError: continueRegularOutput`, maxTries 2): conta sem vínculo MCC
  falha sem derrubar as demais. Madeireira (999-534-2886) gravou 14 linhas reais
  em ad_metrics (R$ 254,12 / 383 cliques / 7 dias). Casa das Unhas (274-181-7052)
  ainda NÃO vinculada ao MCC (não aparece na lista de contas do MCC) — entra
  sozinha assim que o vínculo for aceito. GA4 + Google Ads ativos e validados E2E.
- **2026-07-05 (UI)** — Reorganização por canal com linguagem simples (pedido do
  usuário). Nav nova: **Visão geral · Google · Meta · Site** (+ Integrações).
  Criado `src/components/pages/ChannelPage.tsx` (compartilhado Google/Meta, com
  empty state e comparativo vs período anterior); `/site` substitui `/analytics`;
  `/trafego-pago` e `/analytics` viram redirects. Topbar perdeu o filtro de
  plataforma (separação agora é por página). Nomes simples: Impressões→"Vezes
  exibido", Conversões→"Contatos gerados", CPC/CPL→"Custo por clique/contato",
  ROAS→"Retorno", Sessões→"Visitas no site", Rejeição→"Saíram sem interagir";
  origens do GA4 traduzidas ("Busca no Google", "Anúncio", "Acesso direto").
  Visão geral ganhou cards-resumo clicáveis por canal. Deploy: push → Vercel.
- **2026-07-05 (fecho)** — Painel publicado + credenciais. Deploy na **Vercel**
  (`painel-metricas-trafego.vercel.app`) com as 2 env vars `NEXT_PUBLIC_*`;
  confirmado modo produção (rotas protegidas → 307 /login). Subdomínio
  `painelmetricas.gtechsolutionbrasil.com.br` adicionado na Vercel; falta criar
  CNAME+TXT no Hostinger. Admin do painel migrado para
  `gabriel@gtechsolutionbrasil.com` + senha nova (Supabase Admin API, role
  preservada, login validado E2E). Reorganização de UI por canal já commitada
  (06b9fd3). Ambos os workflows n8n seguem ativos e gravando (GA4 + Google Ads
  da Madeireira).
