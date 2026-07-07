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
Telas: Login, **Visão geral · Google Ads · Meta Ads · Sites · Integrações**
(nav por canal; métricas com nomes padrão de tráfego + hints; filtro de
campanha por página de canal; período com datas livres De/Até + atalhos;
exclusão de cliente na página Integrações). Build OK.
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
- **Google Ads → Supabase** (id `Ui5tKcvG1aRmWptS`): ✅ ATIVO, 20 nós, coleta
  **5 relatórios por conta** (fan-out após "Buscar contas"): campanhas
  (`ad_metrics`, agora com `search_impression_share`), palavras-chave
  (`ad_keywords` via keyword_view), tipos de clique (`ad_click_types` via
  segments.click_type), conversões por ação (`ad_conversion_actions` via
  segments.conversion_action_*) e regiões (`ad_geo` via geographic_view, com
  tradução de geoTargetConstants → nome em 2 passos). Testado E2E 2026-07-06
  (execução 3136: 165 keywords + 33 click types + 13 ações + 14 regiões da
  Madeireira). Contas sem vínculo MCC não derrubam o fluxo (onError continue).
  Roda 06:30.
- Credenciais n8n: `Supabase - Painel Métricas` (sfp0d2ZkWr7zz5wM),
  `Google Analytics account` (I8evqpJf7UDmKsGB),
  `Google Ads account` (tcBb8A3FKBjc2nOt). OAuth client reaproveitado
  `n8n-app-googlecloud` (Google Cloud project-90820b4a-ac18-4f5d-914,
  publicado/Em produção).

**Clientes reais cadastrados** (via SQL, autorizado): Madeireira Adrianna
(GA4 541643814 + Ads 999-534-2886), Casa das Unhas Gravataí (Ads 274-181-7052).
Os 3 do seed (Aurora, Nova, Vitta) foram **excluídos do banco em 2026-07-06**
a pedido do usuário (2.160 ad_metrics + 1.620 web_metrics removidas). Atenção:
`0002_seed.sql` recriaria os fakes se aplicada num banco novo — não reaplicar
em produção.

**Aprendizados Google Ads API (HTTP Request genérico):** (1) o header
`developer-token` NÃO é injetado automaticamente pelo predefinedCredentialType —
adicionar manualmente; (2) `googleAds:search` NÃO aceita `pageSize` no body
(fixo 10.000); (3) `cost_micros` ÷ 1.000.000; (4) `login-customer-id` = MCC sem
hífens.

## >>> HANDOFF 2026-07-07 (Claude → Codex): onde parou o Meta Ads

**Objetivo em curso:** ligar a ingestão do **Meta Ads** (workflow n8n Meta →
Supabase, análogo ao Google Ads id `Ui5tKcvG1aRmWptS`). Falta só o **token**.

**Estado do token (parou aqui):** no Meta Business Settings da BM
**madeireiraadriana** (business_id `765350283972003`) → Usuários do sistema, o
System User **"Conversions API System User"** (ID `61586340577589`) JÁ tem
acesso total à conta **MADEIREIRA ADS** (`act_1176296527286706`) e ao app
**"Conversions API Application"**. Ao clicar **Gerar token** → Selecionar app →
Definir expiração → **Atribuir permissões**, aparece **"Nenhuma permissão
disponível — Atribua uma função do app ao usuário do sistema ou selecione outro
app"**.
  - **CAUSA:** o System User não tem *função (role)* no app selecionado, então
    não há scopes (ex.: `ads_read`) pra conceder.
  - **FIX:** Configurações → **Apps** → "Conversions API Application" →
    adicionar o System User (61586340577589) como usuário do app com função
    (Admin/Desenvolvedor). Depois voltar em Gerar token → o app → marcar
    **`ads_read`** (e `read_insights` se aparecer) → expiração "Nunca" → Gerar.
    Alternativa: selecionar outro app onde o system user já tenha função.

**Depois de ter o token (próximos passos do Codex):**
1. Criar credencial no n8n (NÃO colar token em chat): tipo HTTP Header Auth ou
   Facebook Graph API, com o access token. Anotar o id da credencial.
2. Montar workflow n8n "Meta Ads → Supabase" (espelhar o do Google): Schedule →
   buscar `integration_accounts` provider=`meta_ads` → Graph API
   `GET /v21.0/act_<id>/insights` (fields: spend, impressions, clicks, reach,
   actions, cost_per_action_type; level=campaign; time_increment=1;
   date_preset=last_30d) → Code mapeia → upsert `ad_metrics` (platform='meta').
   Meta TEM **reach/alcance** (Google não tem) e conversões de **mensagem/
   conversa** (WhatsApp/Direct) via `actions`.
3. Cadastrar a conta Meta em `integration_accounts` (provider `meta_ads`,
   external_id `act_1176296527286706`, client Madeireira `b304d378-...`).
4. Testar E2E (webhook temp), validar no banco, ativar schedule.
5. UI: página `/meta` já existe (usa `ChannelPage platform="meta"`) — quando
   houver dado real de meta em `ad_metrics`, aparece sozinha.

**IDs úteis:** BM madeireiraadriana `765350283972003`; System User
`61586340577589`; conta MADEIREIRA ADS `act_1176296527286706`; cliente
Madeireira no Supabase `b304d378-ca60-42df-bdb3-57a77c025e5f`. O Gabriel tem 4
BMs (madeireiraadriana, Dra Claudineia Tomasi, GTech Solution, BM Clínica) —
1 System User por BM (ou centralizar na BM da agência depois).

**O que JÁ está pronto nesta sessão (Google Ads 100%, não mexer sem pedir):**
backfill 30d (números batem c/ Google Ads), ROAS fora da UI, cidade no lugar de
estado, ícones de marca, conversões site×Google, termos de pesquisa, grupos de
anúncios, período estilo Meta (`PeriodPicker`), filtro de campanha multi c/
status (`CampaignFilter` + `ad_campaigns`). Migrations até **0009**. Workflow
Google Ads = 30 nós, coleta **LAST_30_DAYS**. Último commit `1a3d4d1`.

**Deploy (#7) ainda pendente do usuário:** `painelmetricas.gtech...` está numa
conta Vercel fora do CLI (team `gtech-solution1` só tem `digax-crm`); o projeto
não tem git integration → push não atualiza. Usuário deve conectar o repo no
dashboard Vercel + Redeploy. O dev local (localhost:3000) reflete tudo.

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
- [x] ~~Seletor de período custom (datas)~~ (feito 2026-07-06: De/Até na Topbar).
- [ ] (Opcional) export de relatório/PDF.
- [x] ~~Fase 7 — métricas ricas do Google Ads~~ (FEITA 2026-07-06: migration
      0006 aplicada, workflow expandido pra 5 relatórios, UI `GoogleInsights`
      na página Google Ads, dado real validado E2E).
- [ ] **Redeploy Vercel** com as mudanças de 2026-07-06 (usuário viu versão
      antiga no ar — prints com nav velha e dados de seed).
- [ ] **ROAS/receita**: removidos da UI a pedido do usuário (2026-07-06).
      As colunas `revenue`/cálculo `roas` continuam no banco/agregadores —
      NÃO recolocar na UI sem o usuário pedir.
- [~] **GTM Madeireira — conversão WhatsApp** — RESOLVIDO pelo usuário
      2026-07-06: publicou a **Tag do Google `AW-17595319336`** no container
      GTM-P42MLWHK (o ID de conversão do Ads que faltava). Tag Assistant
      confirmou AO VIVO `Ads - WhatsApp` + `Tag do Google AW-` disparando no
      clique do WhatsApp. Falta só a **contabilização** aparecer (delay do
      Google 24-48h) — validar via API depois (esperar origin=WEBSITE > 0 em
      ad_conversion_actions). Pendente ainda: promover "Formulário - Orçamento"
      a principal; ver os "2 issues" de qualidade do contêiner.
      Diagnóstico original (2026-07-06 via API, execuções 3137/3138): o evento
      `whatsapp_click` DISPARA no site (GA4: 68x/30d) e a ação
      "WhatsApp - Clique" existe ENABLED+primária no Ads, mas TODAS as 4
      conversões WEBPAGE via GTM (WhatsApp, Formulário, Rota, Ligação) =
      0 conversões em 30d, enquanto as GOOGLE_HOSTED registram normal.
      Causa provável = banner do GTM "tag do Google ausente" (falta a tag
      AW- do Ads no container). **Fix: GTM → Corrigir (adiciona a Tag do
      Google) → Enviar/publicar → testar com Visualizar**. Bônus:
      "Formulário - Orçamento" está como conversão SECUNDÁRIA (não conta
      em metrics.conversions) — promover a principal se formulário deve
      contar como conversão. NOTA: essas 2 ações (GTM + promover) são no
      GTM/Google Ads (interfaces web do Google) — o agente NÃO tem conector
      pra fazer; usuário faz manual (~2 cliques cada).
- [x] ~~Distinguir conversão do site vs do Google no painel~~ (FEITO
      2026-07-06): migration 0007 (`ad_conversion_actions.origin`), workflow
      coleta `conversion_action.origin` (nó "GAQL Origem das ações" encadeado
      antes de "GAQL Conversões por ação", cruzado por resource_name), UI
      agrupa em "No site do cliente" (origin=WEBSITE) vs "No Google" (resto).

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
- **2026-07-06** — Ajustes do painel a partir de 9 feedbacks do usuário (prints
  eram de versão antiga no ar + dados de seed; parte já estava resolvida no
  código). Feito: **seeds excluídos do banco** (Aurora/Nova/Vitta + 3.780
  linhas de métricas — só Madeireira e Casa das Unhas ficaram); nav renomeada
  (**Google Ads · Meta Ads · Sites**); Topbar sem o seletor "Fonte de dados" e
  com **período de datas livres** (De/Até + atalhos 7/14/30/90 no select);
  métricas de volta aos **nomes técnicos** (Impressões, Cliques, CTR, CPC,
  Conversões, Custo por conversão, ROAS) com hints em linguagem simples e
  trends também na linha de eficiência; **filtro de campanha** (?campaign=)
  nas páginas de canal via `CampaignFilter` (nome desconhecido = ignora, pra
  navegação Google↔Meta não zerar); coluna CTR na tabela de campanhas;
  componente `EmptyState` reutilizável (Visão geral, canal e Sites);
  **exclusão de cliente** na página Integrações (server action `deleteClient`
  com checagem admin + RLS `clients_admin_delete` + cascade limpa métricas,
  botão com confirm). tsc/eslint/build verdes; rotas protegidas 307 OK.
  Pendente do feedback: fase 7 (métricas ricas Google Ads — precisa n8n+schema)
  e redeploy Vercel.
- **2026-07-06 (fase 7)** — Métricas ricas do Google Ads no ar, ponta a ponta.
  **ROAS removido de toda a UI** a pedido do usuário (KPIs, tabela de
  campanhas, cards de canal — cards agora mostram custo/conversão).
  **Migration 0006** (autorizada): tabelas `ad_keywords`, `ad_geo`,
  `ad_click_types`, `ad_conversion_actions` (RLS select por acesso, escrita
  service role, platform pronto pra Meta) + coluna
  `ad_metrics.search_impression_share`. **Workflow n8n expandido** 6→20 nós:
  fan-out de "Buscar contas" pra 4 ramos novos de GAQL (keyword_view;
  segments.click_type; segments.conversion_action_name/category;
  geographic_view com 2º passo geo_target_constant pra traduzir ID→nome);
  query principal ganhou search_impression_share. Validação 0 erros; teste via
  webhook temporário (removido): execução 3136 success 12s, dado real da
  Madeireira nas 4 tabelas (top keyword "material de construção são leopoldo"
  163 cliques/5 conv; 55 ligações, 170 cliques no local/Maps, 16 rotas;
  ações: 40 rotas Maps, 8 ligações; share 34-45%). **UI**: `GoogleInsights`
  (só na página Google Ads, via prop `extra` do ChannelPage) com "Onde foram
  os cliques", "Conversões por tipo de contato", "Palavras-chave" (top 15) e
  "Desempenho por região", enums traduzidos pra PT; KPI "Parcela de
  impressões" no Google. Respeita filtro de campanha. tsc/eslint/build verdes.
- **2026-07-06 (origem das conversões)** — Diagnóstico via API (execs
  3137/3138): conversão WhatsApp do GTM dispara no site (GA4 68x/30d) mas
  registra 0 no Google Ads — falta a Tag do Google (AW) no container GTM
  (banner "tag ausente"); as 4 ações WEBPAGE do site = 0, só as GOOGLE_HOSTED
  contam. Orientado usuário a Corrigir→Enviar no GTM (ação dele; agente não
  tem conector GTM/Ads). Pra "deixar claro o que é do site vs do Google":
  migration 0007 (`ad_conversion_actions.origin`); workflow ganhou nó "GAQL
  Origem das ações" (SELECT conversion_action.origin, encadeado ANTES de
  "GAQL Conversões por ação" pra garantir ordem; cruzado por resource_name
  global, não por índice — robusto a onError); UI reescrita: "Conversões por
  tipo de contato" agora em 2 grupos lado a lado — "No site do cliente"
  (WEBSITE/GTM) e "No Google" (perfil/Maps/anúncio), com participação dentro
  de cada grupo. Testado E2E (Madeireira: tudo GOOGLE_HOSTED/CALL_FROM_ADS,
  0 WEBSITE — confirma o GTM quebrado). Também: ROAS já removido antes.
