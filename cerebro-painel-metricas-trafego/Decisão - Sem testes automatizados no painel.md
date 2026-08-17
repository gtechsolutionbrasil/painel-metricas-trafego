---
tipo: decisao
data: 2026-08-17
tags: [testes, qualidade]
---

# Decisão - Sem testes automatizados no painel

## Contexto

Na spec do redesign do painel (`docs/specs/redesign-painel.md`), as funcionalidades novas
(cálculo do período de comparação, registro de métricas sensíveis do modo apresentação)
tinham lógica pura testável em uma única costura (`src/lib`). Foi proposto introduzir
Vitest só para essas funções — seria a primeira infra de teste do projeto.

## Decisão

O projeto **não terá testes automatizados** por ora. Gates de qualidade: `npm run lint` +
`npm run build` verdes em cada mudança, mais conferência manual por checklist no navegador.

## Alternativas descartadas

- Vitest só para funções puras de `src/lib` — descartado pelo usuário: não quer carregar
  infra de teste neste projeto.
- Playwright/testes de UI — nem chegou a ser proposto: custo-benefício ruim para redesign visual.

## Consequências

- Mudanças em lógica de datas/comparação e no vocabulário de métricas sensíveis dependem de
  conferência manual — regressões silenciosas são possíveis; checklist manual da spec é o guarda.
- Nenhum ticket deve criar arquivos de teste nem adicionar dependências de teste sem nova
  decisão explícita do usuário.

## Relacionado

- Spec: `docs/specs/redesign-painel.md` (seção Testing Decisions)
