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

**No ar em produção (aplicação ainda na versão anterior ao redesenho de
2026-08-09).** Projeto Supabase ref `oqsjdhrwpmpdrihgbgtx`, migrations
0001–0014 aplicadas. A migration 0014 foi publicada no Gate 1 em 2026-08-09;
as quatro tabelas novas, RLS, grants, índices, triggers e seeds foram validados.
O workflow GA4 de 17 nós foi publicado e ativado no Gate 2 e o Google Ads de
35 nós/API v25 foi publicado e ativado no Gate 3. O mini-CRM na aplicação, a
nova taxonomia visual e o workflow Meta atualizado continuam somente locais:
opção 3B do usuário, com aprovação obrigatória antes de cada publicação
externa.

**Estado local preparado:** Login, **Visão geral · Google Ads · Meta Ads ·
Sites · CRM · Integrações**; conversões separadas em contato principal,
conversa Meta, intenção local e microconversão; relatório sem somar Google +
Meta; saúde de tracking; eventos GA4 por origem/campanha; mini-CRM com RLS e
histórico. Build OK.
**Deploy:** Vercel — `painel-metricas-trafego.vercel.app` (Auth ativo em prod,
só 2 env vars `NEXT_PUBLIC_*`; service_role NÃO vai pro front). Subdomínio
`painelmetricas.gtechsolutionbrasil.com.br` aguardando propagação de DNS
(CNAME + TXT no Hostinger).
**Admin:** login `gabriel@gtechsolutionbrasil.com` (email+senha redefinidos nesta
sessão via Supabase Admin API; role admin preservada).

**Workflows n8n (`n8n.gtechsolutionbrasil.com`, tag `painel-metricas-trafego`):**
- **GA4 → Supabase** (id `oFVQoWFdstKOZcM4`): produção ✅ ATIVA na versão
  nova de 17 nós desde o Gate 2 (2026-08-09). Grava `web_metrics`,
  `web_pages`, `web_events`, `tracking_checks`, `sync_runs` e `last_sync_at`.
  Execuções manuais 12781 e 12783 passaram; a repetição manteve 18 linhas de
  eventos e zero duplicatas. Janela de 7 dias da Madeireira (property
  541643814): WhatsApp 49 e telefone 1 saudáveis; formulário 0 e rota 0 em
  alerta. Roda todo dia 06:00.
- **Google Ads → Supabase** (id `Ui5tKcvG1aRmWptS`): produção ✅ ATIVA na versão
  nova de **35 nós/API v25** desde o Gate 3 (2026-08-09), cron `30 6 * * *`.
  Coleta 11 consultas por conta: campanhas, palavras-chave, tipos de clique,
  conversões por ação + origem, regiões + nomes, termos de pesquisa, grupos,
  status de campanhas e saldo. A janela de `ad_conversion_actions` é
  reconciliada por conta: após resposta válida, remove apenas os últimos 30
  dias e faz upsert do retrato atual, evitando linhas obsoletas quando o Google
  ajusta uma ação para zero. Execuções 12799 e 12800 passaram, com repetição
  idempotente e zero duplicatas nas 8 tabelas Ads. Na Madeireira, API e banco
  fecharam em 249 linhas: `conversions` 444 e `all_conversions` 1.483,5; no
  painel isso representa 186 contatos principais, 466,5 intenções locais e 831
  microconversões. O workflow ficou ativo na versão
  `2e6a26a9-6f1a-4bac-b982-a5c5b1bc1415`.
- **Meta Ads → Supabase** (id `CHPOb8H46wVXjBDw`): produção ✅ ATIVA. O JSON
  local é gerado por `scripts/build-n8n-meta-workflow.mjs` e foi corrigido para
  gravar em `ad_metrics.conversions` somente conversa iniciada em 7 dias;
  leads/pixel/compras continuam separados em `ad_conversion_actions`.
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

## >>> RESOLVIDO 2026-07-07 (Claude): Meta Ads ligado

O bloqueio do token foi **resolvido** — o usuário criou o App Meta e gerou um
token **SYSTEM_USER long-lived (não expira)** com scopes `ads_read`,
`ads_management`, `read_insights`, `business_management`. O token lê **2 contas**
com uma credencial só: MADEIREIRA ADS (`act_1176296527286706`) e CA - Clínica
(`act_1343805573609263`).

**Feito nesta sessão:**
- Validado token via Graph API (permissões + contas + validade/debug_token).
- **Corrigida a lógica de conversão** do workflow: a regex do Codex somava vários
  tipos de `messaging` (dupla contagem). Trocada por **allowlist canônica** — a
  conversão de campanha de mensagem é `onsite_conversion.messaging_conversation_started_7d`
  ("Conversas iniciadas"), + leads/compras. Ver `CONVERSION_ACTION_TYPES` no
  Code node e em `scripts/meta-sync.mjs`.
- Criado **`scripts/meta-sync.mjs`** (mesma lógica do workflow, rodável local p/
  backfill/teste; lê env `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`META_ACCESS_TOKEN`).
- **Supabase populado (Madeireira, 30d):** R$ 289,97 · 83.009 impressões · 510
  cliques · **26 conversas** · 21 campanhas (2 ativas). Números batem 1:1 com a
  API Meta. `integration_accounts` da Madeireira → `connected`.
- Workflow n8n **`CHPOb8H46wVXjBDw`** ("Meta Ads -> Supabase"): **REFEITO e
  ATIVO, testado E2E (execução success).** O Code monolítico do Codex não rodava
  — esta instância n8n usa **task-runner isolado sem `fetch`/`$helpers`**. Refeito
  no padrão do Google Ads (HTTP Request nodes fazem HTTP; Code só transforma).
  Auth via credentials (`supabaseApi` + `httpHeaderAuth` do Meta). Roda 07:00
  diário sozinho — **sem ação pendente do usuário.** Fonte:
  `scripts/build-n8n-meta-workflow.mjs` → `npm run build:n8n:meta`.

**Pendências Meta:** cadastrar a conta **CA - Clínica** (criar `client` + linha
`integration_accounts` provider=meta_ads external_id `act_1343805573609263`) p/
o fluxo puxar ela também. Página `/meta` já renderiza (usa `ChannelPage`).

---

### Handoff original (contexto histórico, já resolvido)

**Objetivo em curso:** ligar a ingestão do **Meta Ads** (workflow n8n Meta →
Supabase, análogo ao Google Ads id `Ui5tKcvG1aRmWptS`). Codex já preparou o
workflow importável e cadastrou a conta Meta da Madeireira; falta gerar o
**token**, criar as variáveis no n8n, importar/ativar e testar E2E.

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

**Depois de ter o token (próximos passos):**
1. Importar o workflow e preencher o node **Configurar segredos** com
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCESS_TOKEN`;
   opcionais `META_GRAPH_API_VERSION` e `META_DATE_PRESET`. O Code node tambem
   aceita `$vars` se o plano do n8n liberar Variables no futuro.
2. Importar o workflow `n8n/meta-ads-supabase.workflow.json`: Schedule →
   buscar `integration_accounts` provider=`meta_ads` → Graph API
   `GET /v21.0/act_<id>/insights` (fields: spend, impressions, clicks, reach,
   actions, cost_per_action_type; level=campaign; time_increment=1;
   date_preset=last_30d) → Code mapeia → upsert `ad_metrics` (platform='meta').
   Meta TEM **reach/alcance** (Google não tem) e conversões de **mensagem/
   conversa** (WhatsApp/Direct) via `actions`.
3. Conta Meta já cadastrada em `integration_accounts` (provider `meta_ads`,
   external_id `act_1176296527286706`, client Madeireira
   `b304d378-ca60-42df-bdb3-57a77c025e5f`, status `pending`).
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
- [~] Fase 6: página **Sites** por evento/canal + mini-CRM + saúde de tracking
      implementados localmente em 2026-08-09; Gates 1, 2 e 3 concluídos,
      aguarda Gates 4–7.
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

- **2026-08-19 — Relatório redesenhado + métrica Visitas à loja incluída.** A
  página `/relatorio` passou do formato editorial impresso (serifado, cinza)
  para painel claro em cartões: fundo cinza-azul, cartão branco por bloco,
  sombra suave, ícone por métrica, Google azul `#2563eb` e Meta rosa `#db2777`.
  Todo número passou a carregar o par **O que é / De onde vem** (e uma ressalva
  quando a leitura ingênua erra), centralizado em `src/lib/report/glossario.ts`
  — o cliente lê o relatório sozinho, sem o gestor do lado.

  Decisão de dado: `Store visits` deixou de ser `ignore` em
  `src/lib/report/labels.ts` e virou o kind `storeVisit`, somando em
  `totals.storeVisits`. Ganhou seção própria (`visitas`, ligável/desligável no
  seletor) explicando o método do Google — amostra de aparelhos com histórico
  de localização, perímetro da loja por satélite/Street View, projeção
  estatística — e um comparativo lado a lado "rotas (observado) × visitas
  (estimado)". Todo número modelado carrega a etiqueta roxa `.tag-estimativa`,
  e nunca é somado aos contatos. Coleta, n8n, Supabase e as telas do painel não
  foram alterados.

- **2026-08-09 — Gate 3 concluído (n8n Google Ads, PRODUÇÃO).** Com aprovação
  explícita, o workflow `Ui5tKcvG1aRmWptS` foi atualizado de API v21 para v25,
  preservando credenciais e Developer Token somente no n8n. A primeira
  comparação detectou 2 visitas à loja obsoletas: o upsert não removia linhas
  que o Google deixava de retornar. Foi adicionada reconciliação segura por
  conta/janela de 30 dias, executada somente após resposta válida. Execuções
  12799 e 12800 terminaram `success`; as 11 consultas v25 passaram e API,
  Supabase e a função real do painel fecharam em 249 ações, 444 conversões de
  lance e 1.483,5 totais. Classificação: 186 principais, 466,5 intenções locais
  e 831 microconversões. A repetição manteve iguais as contagens das 8 tabelas
  Ads e zero duplicatas. Workflow final ativo com 35 nós, webhook autenticado e
  cron 06:30. Meta, GA4, GTM, aplicação, deploy e push não foram alterados.

- **2026-08-09 — Gate 2 concluído (n8n GA4, PRODUÇÃO).** Com aprovação
  explícita, a versão ativa anterior de 12 nós foi salva em
  `.agent/backups/n8n-ga4-before-gate2-2026-08-09T20-37-37-820Z.json` e o
  estado GA4 do banco também recebeu snapshot local. O workflow
  `oFVQoWFdstKOZcM4` foi desativado, atualizado para os 17 nós do JSON local e
  testado por webhook temporário aleatório, removido ao final (endpoint
  confirmado com HTTP 404). Execuções 12781 e 12783 terminaram `success`; a
  saída efetiva do GA4 fechou exatamente com `web_events` e os 4 checks. Na
  janela de 7 dias: `whatsapp_click` 49 (`healthy`), `phone_click` 1
  (`healthy`), `generate_lead` 0 (`warning`) e `route_click` 0 (`warning`). A
  segunda execução manteve 18 linhas de eventos, 0 chaves duplicadas, 190
  `web_metrics` e 110 `web_pages`; adicionou apenas o novo log esperado. O
  workflow final ficou ativo, 17 nós, cron `0 6 * * *`. Google Ads, Meta, GTM,
  aplicação, push e deploy não foram alterados neste gate.

- **2026-08-09 — Gate 1 concluído (Supabase, PRODUÇÃO).** Com aprovação
  explícita do usuário, foi criado backup lógico pré-migração em
  `.agent/backups/gate1-0014-before-2026-08-09T20-19-32-076Z.json` (arquivo
  local ignorado pelo Git; SHA-256
  `a94c37c42ef7f16b8e43fd04c654b4b87d40aada5bacfcad05759d4c56a30444`) e
  aplicada somente `0014_tracking_events_crm.sql`, dentro de transação. Foram
  confirmados: 4 tabelas com RLS, 5 índices, 8 policies, 5 triggers, grants,
  conta GTM e 4 checks GA4 iniciais. Os dados das 15 tabelas preexistentes
  foram comparados com o backup e preservados; testes funcionais de RLS,
  histórico de status, `updated_at` e proteção de identidade passaram dentro
  de transações revertidas, sem registros residuais. Nenhum workflow n8n, GTM,
  Ads, push ou deploy foi alterado neste gate.

- **2026-08-09 — Redesenho de tracking + mini-CRM (LOCAL, NÃO PUBLICADO).**
  Decisões do usuário: (1) contato principal = WhatsApp, formulário confirmado
  e ligação; rota/visita ficam em intenção local; (2) mini-CRM dentro do painel;
  (3) pedir aprovação antes de cada alteração externa. Criada migration 0014
  (`web_events`, `tracking_checks`, `leads`, `lead_status_history`, RLS,
  histórico e proteção de identidade). Visão geral, Sites, Google,
  Integrações, relatório e navegação foram refeitos para não somar fontes como
  pessoas únicas. Workflows locais: GA4 17 nós com eventos/checks; Google 31
  nós em API v25 com `conversions` + `all_conversions`; Meta com conversa
  iniciada como KPI canônico. Adicionados padrão UTM, plano de 7 gates e
  validador n8n. `tsc`, ESLint, build Next e estrutura/sintaxe dos 3 workflows
  verdes. Browser visual indisponível nesta sessão; smoke test autenticado
  permanece obrigatório no Gate 7. Nenhuma migration, workflow, tag, campanha,
  env de produção, deploy ou push foi publicada.

- **2026-08-03** — **Escolher o que sai no relatório.** Botão "Seções (n de m)"
  na barra do `/relatorio` abre a lista de caixas; o que for desmarcado some da
  tela e do PDF. Decisões que valem lembrar: (1) o servidor renderiza TUDO que
  tem dado e a ocultação é só CSS (`data-off` na raiz `.rel` + regras
  `[data-off~="id"] [data-secao="id"]`, fora de qualquer `@media`, para tela e
  papel baterem) — a primeira versão usava `router.replace` e cada clique
  re-executava as 5 queries do relatório; (2) guarda-se o que foi **desligado**
  (`?ocultar=meta,fundos`), nunca o que está ligado, senão uma seção sem dado
  hoje nasceria desmarcada quando o dado aparecesse; (3) a escolha persiste em
  `localStorage` por cliente (`relatorio:ocultas:<clientId>`), lida por
  `useSyncExternalStore` e com um script inline aplicando antes do primeiro
  paint — a URL sempre vence o navegador; (4) a quebra de página do PDF migra
  por JS para a próxima seção visível, senão desligar "Semana a semana" levava
  a quebra junto; (5) `placar` e `contatos` dividem a mesma `<section>`, marcada
  com `data-grupo`, que só some quando as duas saem. Nada no Supabase.

- **2026-08-03** — **Exportar relatório do cliente pelo painel.** Botão
  "Relatório" na topbar (`ExportReportButton`) abre `/relatorio` em nova aba
  levando o cliente e o período selecionados; lá um botão "Baixar PDF" chama
  `window.print()`. Escolhido no lugar de gerar PDF no servidor: Chromium
  serverless pesa ~50 MB e arrisca timeout na Vercel Hobby, com resultado
  igual. A rota fica FORA do grupo `(dash)` (sem sidebar/topbar) mas continua
  protegida pelo `proxy.ts`, que roda em tudo. `src/lib/report/labels.ts`
  traduz campanha, grupo, ação e tipo de clique para linguagem de cliente por
  padrão de nome (funciona para qualquer cliente, não só a Madeireira);
  `src/lib/report/data.ts` monta as seções; `src/app/relatorio/report.css`
  tem o visual do documento e o `@media print` (A4, sem quebrar bloco no meio,
  barra de ações escondida). Seções: capa, investido/contatos/rotas, divisão
  entre plataformas, semana a semana, campanhas de cada canal, caminho do
  cliente em etapas, placar, detalhamento de contatos e fundos disponíveis —
  cada uma some sozinha quando não há dado. Sem custo por clique nem por
  contato (decisão do usuário). `getAdConversionActions` passou a devolver
  `platform`, usado para separar as colunas Google/Meta.

- **2026-08-03** — Duas correções de dado, descobertas ao montar um relatório
  de cliente (Madeireira). **(1) Contatos subcontados:** a coleta do Google
  gravava só `metrics.conversions` (metas de lance), deixando de fora ligação
  pelo perfil na Busca, rotas da Busca, visitas à loja e cliques no site pelo
  perfil — 103 contatos no painel contra 204 reais no período 26/06–03/08.
  Migration **0013** (`ad_conversion_actions.all_conversions`), node "GAQL
  Conversões por ação" passa a pedir `metrics.all_conversions`, e o painel
  mostra a ação total (`bidConversions` guarda a meta de lance). O workflow do
  Meta espelha `all_conversions = conversions`. **(2) Saldo pela API:** ao
  contrário do que a 0012 supôs, as duas plataformas expõem saldo — Google via
  GAQL `account_budget`, Meta via `/act_<id>?fields=balance,amount_spent,
  spend_cap`. Migration 0013 também criou `integration_accounts.balance_
  available/limit/spent/synced_at`, e os dois workflows ganharam o trio
  "Saldo da conta → Montar saldo → Atualizar saldo". A recarga manual continua
  como fallback. Testado E2E pelos webhooks de refresh: Google R$ 323,30
  disponíveis, Meta Madeireira R$ 0,00 (a conta bateu o `spend_cap`, e foi por
  isso que parou de veicular em 27/07), Meta Clínica R$ 319,62.

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
- **2026-07-07 (Meta Ads prep Codex)** — Conta Meta da Madeireira
  (`act_1176296527286706`) cadastrada no Supabase em `integration_accounts`
  com status `pending`. Criado pacote n8n para Meta Ads:
  `n8n/meta-ads-sync-code.js` (Code node com leitura de contas, Graph API
  Insights/Campaigns, upsert em `ad_metrics`, `ad_campaigns`,
  `ad_conversion_actions`, atualização de status e `sync_runs`),
  `scripts/build-n8n-meta-workflow.mjs`, `n8n/meta-ads-supabase.workflow.json`
  e `n8n/README.md`. Documentado em `docs/ingestao-n8n.md`; comando
  `npm run build:n8n:meta`. Validações: `npm run lint` e `npm run build`
  verdes. Pendente: gerar/guardar token, preencher o node **Configurar
  segredos**, importar/ativar workflow e testar E2E.
- **2026-07-07 (n8n Meta sem Variables)** — O plano atual do n8n mostrou
  **Environments/Variables** como recurso Enterprise. Ajustado o workflow Meta
  para não depender de `$vars`: o JSON importável agora inclui o node
  **Configurar segredos** antes do Code node, e `n8n/meta-ads-sync-code.js`
  lê `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCESS_TOKEN`,
  `META_GRAPH_API_VERSION` e `META_DATE_PRESET` primeiro do input e depois de
  `$vars` como fallback. Atualizados `n8n/README.md` e
  `docs/ingestao-n8n.md`.
- **2026-07-20 (linhas ocultas + saldo pré-pago)** — Pedido do usuário: (1)
  ocultar "por enquanto" 3 linhas do painel Google Ads — "WhatsApp - Clique"
  (site), "Ligou pelo anúncio (chamada feita)" (Calls from ads) e "Pediu rota
  no Maps" (GET_DIRECTIONS) — via `HIDDEN_ACTION_NAMES`/`HIDDEN_CLICK_TYPES`
  no `GoogleInsights.tsx`, filtradas ANTES da agregação (totais e % recalculam;
  pra reexibir é só tirar do Set). (2) **Card "Saldo disponível na conta"**:
  a API do Google Ads não expõe saldo de conta pré-paga (boleto/pix), então o
  admin registra a recarga (valor + data) na coluna nova "Recarga (saldo)" da
  tabela de Integrações (`setAccountRecharge`, só admin); o `ChannelPage`
  (Google e Meta) mostra saldo = recarga − gasto do `ad_metrics` desde a data
  (independe do período do topo) + estimativa "dura ~N dias no ritmo atual".
  **Migration 0012 APLICADA em produção** (`integration_accounts.
  balance_recharge` numeric + `balance_recharge_date` date). tsc/eslint/build
  verdes. `.gitignore` ganhou `.mcp.json`. Também removidos os subtítulos dos
  cards "Contatos gerados" e "Pra onde foram os cliques", e a coluna
  "Conversões" das tabelas "Grupos de anúncios" e "Palavras-chave"
  (pedidos do usuário).
  **Deploy RESOLVIDO no mesmo dia:** os pushes não deployavam porque o
  projeto na Vercel estava **sem repo Git conectado** (desconectou sozinho
  após 10/07; Overview mostrava botão "Connect Git"). Usuário reconectou em
  Settings → Git → Connect no repo; commit vazio disparou o build e o deploy
  `614b947` saiu com **success**. Se voltar a acontecer: conferir o botão
  "Connect Git" no Overview do projeto (conta `guedesints-projects`).
- **2026-07-07 (guia de cadastro de integrações)** — Página Integrações
  (`/clientes`) ganhou checklist operacional para cliente novo: Google Ads
  (vínculo MCC → Customer ID), Meta Ads (Business/conta compartilhada →
  System User/token → `act_...`) e GA4/GTM (Property ID, domínio e container).
  Formulário recebeu textos de apoio nos campos e reforço de que ID não é
  credencial; tokens ficam no n8n. Server action passou a normalizar Meta Ad
  Account ID numérico para `act_<id>`. Validações: `npm run lint` e
  `npm run build` verdes.
- **2026-08-17 (redesign: spec + tickets + T1 fundação visual)** — Fluxo de
  features instalado (`cerebro-painel-metricas-trafego/`, `docs/specs/`,
  `docs/agents/issue-tracker.md`, label `ready-for-agent`). Spec do redesign
  em `docs/specs/redesign-painel.md` (escopo: visual + hierarquia nas 6 telas
  internas, tema claro "admin premium" mantido, 3 features novas — seletor de
  base de comparação, sparklines, modo apresentação; sem testes automatizados,
  decisão no cerebro). Tickets #2–#8 no GitHub Issues (#1 = pai). **T1 (#2)
  implementado**: tokens de estado danger/warning (soft/border/ink), sombras
  em camadas mais sutis, headings 700/-0.02em, `tabular-nums` em toda tabela,
  `.btn-secondary`/`.btn-ghost` neutros (verde fica só no primary), badges via
  tokens, `.input` 40px alinhado ao `.btn`, classe `.table` base (th uppercase,
  hover, `.num` à direita) pra adoção no T6/T7; KpiCard 28px/bold, TrendPill e
  alerts de clientes/login/DeleteClientButton migrados pros tokens. Lint/build
  verdes. Vercel reconectada ao repo → push na `main` deploya sozinho.
  **T2 (#4)**: paleta dos gráficos validada com o validador da skill dataviz —
  teal→`#0d9488`, sky→`#0284c7`, amber→`#d97706` (chroma e contraste ≥3:1;
  identidade por canal preservada: sky=Google, indigo=Meta); `SERIES_PALETTE`
  reordenada intercalada (slate = balde neutro "outros" por último); wrappers
  padronizados — área com stroke 2px, activeDot com anel de surface, cursor
  compartilhado no `theme.ts`, legenda automática quando ≥2 séries, barras
  `radius 4` + `maxBarSize 32`, `tabular-nums` em tooltip/donut. Lint/build
  verdes. **T4 (#6)**: componente `Sparkline` (área mini sem eixo/tooltip,
  `aria-hidden`, 1 dia vira linha reta) + prop `spark` no `KpiCard` (cor segue
  o `tone`); ligado nos 5 KPIs da Visão geral (investimento, conversas Meta,
  contatos Google, eventos do site via novo `byDay` do `summarizeWebEvents`,
  leads por dia via `occurredAt`) e nos 4 números dos canais (investimento,
  resultados, custo/resultado e CTR diários — `AdDayPoint` ganhou
  `impressions`). MiniStats/secundários sem sparkline. Lint/build verdes.
  **T3 (#3)**: base de comparação global — `?compare=` na URL (`prev` default
  · `yoy` mesmas datas −1 ano · `none`), `compareFromSearch`/`comparisonRange`
  irmãs de `previousRange` em `range.ts`, `ComparePicker` (select no Topbar ao
  lado do período); `none` pula as buscas do período anterior e remove todas
  as pílulas; tooltip da pílula reflete a base (`COMPARE_TITLES`). Tela Site
  ganhou pílulas nos 6 KPIs de GA4 (busca de `webPrev`/`eventsPrev`; rejeição
  com `positiveIsGood: false`; pílula omitida se o período comparado não tem
  dados). Lint/build verdes.
  **T5 (#5)**: modo apresentação — registro central `lib/presentation.ts`
  (sensível = custo por resultado, CPC, saldo; investimento SEMPRE visível),
  estado `?apresentacao=1` na URL, `PresentationToggle` no Topbar (botão
  preenchido = indicador de ativo). Esconde: card Custo por contato/conversa
  (grid 4→3), MiniStat CPC, card Saldo, colunas CPC e Custo/resultado da
  tabela de campanhas, coluna CPC dos Grupos de anúncios (GoogleInsights).
  ComparePicker alinhado a h-14 com os demais controles do topo. Lint/build
  verdes. **T6 (#7) + T7 (#8)**: todas as tabelas do painel (campanhas, 4 do
  GoogleInsights, eventos/origens do Site, integrações) adotaram a classe
  `.table`; aviso metodológico da Visão geral movido pra baixo dos KPIs;
  emerald hardcoded → tokens brand (SignalCard, status saudável/Ganho);
  vermelho do saldo esgotado → `danger-ink`; `font-extrabold` → `font-bold`
  em todo o painel (relatório intocado). Lint/build verdes. **Redesign
  completo: tickets #2–#8 fechados.** `/review-externo` (2 eixos, desde
  71a919a) achou e o fix aplicou: (1) modo apresentação não escondia a coluna
  "Recarga (saldo)" em Integrações — agora esconde via `hideMetric`; (2)
  sparklines sem zero-fill comprimiam o eixo temporal — novo `eachDayIso()`
  em `range.ts`, dia sem dado vale 0 (Visão geral e canais); (3) hex do rose
  movido do KpiCard pra `CHART_COLORS.rose`. Julgamentos registrados sem
  ação: trio compare duplicado em 3 telas, paleta Tailwind crua remanescente
  em CRM/Integrações (candidatos a refactor futuro). **Conferência visual do
  usuário (3 ajustes pós-spec):** (1) card "Custo por contato/conversa" saiu
  do topo dos canais — campanhas com objetivos ≠ contato inflavam o custo
  agregado; custo por resultado fica SÓ na tabela de campanhas (espinha agora
  é 3 números: Investimento, Contatos/Conversas, CTR); (2) `HelpTip` extraído
  pra `ui/HelpTip.tsx` e adicionado por linha nas listas "Ações atribuídas
  pelo Google" e "Pra onde foram os cliques" (`ACTION_TIP`/`CLICK_TIP` em
  GoogleInsights explicam o caminho da pessoa em cada ação — incl. que
  "Visitou a loja" é ESTIMATIVA de presença física do Google, por isso >
  "Pediu rota"); (3) dúvida do usuário sobre 218 visitas × 25 rotas resolvida
  por esses tooltips.
- **2026-08-17 (fix "Atualizado parcialmente — GA4 não configurado")** — O
  botão Atualizar avisava GA4 pulado porque o workflow GA4 do n8n nunca teve
  o webhook de refresh (só o gatilho diário 06:00) e `N8N_REFRESH_GA4_URL`
  não existia. Corrigido: nó "Webhook atualizar (painel)" adicionado ao
  workflow `oFVQoWFdstKOZcM4` via n8n-mcp (path
  `painel-refresh-ga4-k7m2p9w4`, mesma credencial header-auth "Painel
  Refresh"), espelhado em `n8n/ga4-supabase.workflow.json`, env adicionada ao
  `.env.local` e webhook testado (HTTP 200, coleta rodou). **PENDENTE (só o
  usuário pode): adicionar `N8N_REFRESH_GA4_URL=https://n8n.
  gtechsolutionbrasil.com/webhook/painel-refresh-ga4-k7m2p9w4` na Vercel
  (Settings → Environment Variables → Production) e redeployar** — até lá o
  aviso continua em produção.
## Fluxo de features (skills do Matt Pocock) — roteamento

Skills globais (`~/.agents/skills/`, valem pros 3 agentes): `/grill-me` (+`grilling`), `/to-spec`, `/to-tickets`, `/implement` (+`tdd`) e `/review-externo`.

**Roteamento (neste projeto, usar SEMPRE estas; as antigas equivalentes ficam mudas aqui):**

| Tarefa | Usar | NÃO usar |
|---|---|---|
| Especificar feature nova / levantar requisitos | `/grill-me` | `brainstorming` |
| Congelar decisões da conversa em documento | `/to-spec` | — |
| Quebrar spec em tarefas | `/to-tickets` | `plan-writing` |
| Implementar um ticket | `/implement` | — |
| TDD (quando houver infra de teste) | `tdd` | `tdd-workflow` |
| Revisão de conformidade com a spec (sessão limpa) | `/review-externo` | — |
| Caça a bug no diff | `/code-review` nativo | — |

**Fluxo de uma feature:** `/grill-me` → `/to-spec` → `/to-tickets` → `/implement` (1 ticket por vez) → `/review-externo` em sessão/subagent limpo.

**Circuito cerebro⇄specs (obrigatório):**
1. **Antes** de `/grill-me` ou `/to-spec`: grep no `cerebro-painel-metricas-trafego/` pelas palavras-chave do tema e carregar as notas relevantes como contexto — a entrevista NÃO re-pergunta o que já foi decidido nem repropõe o que já foi descartado.
2. **Depois** de `/to-spec`: se alguma decisão da spec tem trade-off de arquitetura (vale além da feature), criar/atualizar `Decisão - *.md` no cerebro com o caminho da spec como referência.

**Separação de escopo (nunca duplicar conteúdo):** decisão transversal do projeto → este REGRAS (com link de 1 linha pra spec); decisão interna da feature → `docs/specs/<feature>.md`; lição/trade-off durável → `cerebro-painel-metricas-trafego/`. Objetivo: este REGRAS **para de crescer** — detalhe fino de feature não entra mais aqui.

**Tracker:** GitHub Issues do repo (config em `docs/agents/issue-tracker.md`; label `ready-for-agent`). Specs em `docs/specs/`.

## Memória técnica (cerebro-painel-metricas-trafego/)

A pasta `cerebro-painel-metricas-trafego/` na raiz é o vault Obsidian de memória técnica do projeto (convenções completas em `cerebro-painel-metricas-trafego/COMO-USAR.md`; templates em `cerebro-painel-metricas-trafego/_templates/`). Guarda SÓ conhecimento que não está no código.

**CONSULTAR antes de agir:**
- Ao investigar bug não-trivial → antes, buscar por palavras-chave em `cerebro-painel-metricas-trafego/` (grep/glob, ler só as notas relevantes — economia de tokens).
- Antes de decisão de arquitetura → conferir se já existe nota `Decisão - *` sobre o tema — **não repropor o que já foi descartado**.

**ALIMENTAR depois de agir:**
- Resolveu bug cuja causa raiz não era óbvia (race condition, dependência, ambiente) → criar `Bug - <descrição>.md`.
- Tomou decisão técnica com trade-off real → criar `Decisão - <tema>.md`.
- Descobriu quirk de dependência/ambiente/deploy → criar `Contexto - <tema>.md`.
- Sempre criar a partir dos templates em `cerebro-painel-metricas-trafego/_templates/`.

**Qualidade:** nada genérico (que o modelo já sabe ou que código/git já mostram), frontmatter sempre preenchido, notas relacionadas linkadas com `[[wikilinks]]` (é o que forma o grafo), notas curtas e diretas.
