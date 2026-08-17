# Issue tracker deste projeto

> Arquivo de configuração lido pelas skills `/to-spec`, `/to-tickets`, `/implement` e `/review-externo`.

## Tracker: GitHub Issues

Repositório: `gtechsolutionbrasil/painel-metricas-trafego` (privado). Usar o CLI `gh` (já autenticado).

- **Listar tickets abertos**: `gh issue list --state open`
- **Ler um ticket (corpo + comentários)**: `gh issue view <n> --comments`
- **Criar ticket**: `gh issue create --title "..." --body "..." --label ready-for-agent`
- **Fechar ticket concluído**: `gh issue close <n> --comment "resumo do que foi feito"`
- **Bloqueios**: GitHub Issues não tem blocking-link nativo — declarar no corpo do ticket
  uma seção `Blocked by: #<n>` listando os tickets que precisam vir antes.

## Labels de triagem

- `ready-for-agent` — ticket especificado, pronto para um agente executar.
- `bug` / `enhancement` — padrão do GitHub, usar quando couber.

## Specs

Specs de feature ficam em **`docs/specs/<feature>.md`** (versionadas no repo), e o ticket-pai
referencia o caminho da spec. Convenção de escopo (ver seção "Fluxo de features" no
`REGRAS-PROJETO.md`): decisão transversal do projeto → `REGRAS-PROJETO.md`; decisão interna
da feature → spec; lição/trade-off durável → nota no `cerebro-painel-metricas-trafego/`.

## Idioma

Specs, tickets e comentários em **português brasileiro**.
