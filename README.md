# Painel de Métricas de Tráfego — GTech Solution

Painel **multi-cliente** (agência) que consolida **tráfego pago (Meta Ads +
Google Ads)** e **analytics web (GA4)**, com login e separação por cliente.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4
- **Dados/Auth:** Supabase (Postgres + Auth + RLS)
- **Gráficos:** Recharts
- **Ingestão:** n8n grava no Supabase; o painel apenas lê (ver [docs/ingestao-n8n.md](docs/ingestao-n8n.md))
- **Deploy:** Vercel

## Rodando localmente

```bash
npm install
npm run dev          # http://localhost:3000
```

Sem `.env.local`, o painel sobe em **modo demonstração** (dados de exemplo,
sem login). Para usar dados reais, configure o Supabase:

```bash
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Banco (Supabase)

Aplique as migrations em `supabase/migrations/` no SQL Editor do projeto:

1. `0001_init.sql` — tabelas + RLS + policies + trigger de profile.
2. `0002_seed.sql` — clientes e 90 dias de métricas de exemplo (opcional, dev).

Depois de criar seu usuário em **Authentication → Users**, promova-o a admin:

```sql
update public.profiles set role = 'admin' where id = '<seu-user-id>';
```

## Estrutura

```
src/
  app/
    (auth)/login        # login (Supabase Auth)
    (dash)/             # shell + páginas protegidas
      page.tsx          # Visão geral
      trafego-pago/     # Meta + Google (tabela por campanha)
      analytics/        # GA4 (origens, sessões)
      clientes/         # cadastro de clientes e contas conectadas
  components/           # brand, ui, layout, charts
  lib/
    supabase/           # clients server/browser + refresh de sessão
    metrics/            # queries (Supabase|mock) + agregações
    mock/               # dados de demonstração determinísticos
  proxy.ts              # auth gating (Next 16: era "middleware")
supabase/migrations/    # schema + RLS + seed
docs/ingestao-n8n.md    # contrato de escrita para o n8n
```

## Scripts

| comando | o quê |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | sobe o build |
| `npm run lint` | ESLint |
