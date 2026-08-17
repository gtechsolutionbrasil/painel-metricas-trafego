# Como usar este vault (cerebro-painel-metricas-trafego/)

Memória técnica do projeto **painel-metricas-trafego**, compartilhada entre agentes (Claude Code, Antigravity, Codex) e humanos. Abrir esta pasta como vault do Obsidian.

## O que guardar aqui

**SÓ conhecimento que não está no código:**
- Bugs cabeludos já resolvidos (causa raiz não óbvia: race condition, dependência, ambiente)
- Decisões técnicas com trade-off real (o que foi escolhido, o que foi descartado e por quê)
- Contexto de ambiente/dependências (quirk de deploy, particularidade de API, comportamento inesperado de ferramenta)

## O que NUNCA documentar

- Conhecimento genérico que qualquer modelo já sabe
- O que o código ou o histórico do git já mostram

## Convenções

**Nomes de nota:**
- `Bug - <descrição>.md`
- `Decisão - <tema>.md`
- `Contexto - <tema>.md`

**Toda nota:**
- Tem frontmatter preenchido (`tipo`, `data`, `tags`)
- Linka notas relacionadas com `[[wikilinks]]` — é o que forma o grafo
- É curta e direta; base bagunçada não escala

**Criar sempre a partir dos templates** em `_templates/`.
