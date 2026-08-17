# Specs de features

Uma spec por feature, gerada via `/grill-me` (entrevista) + `/to-spec` (síntese).
Cada spec é o **contrato da feature**: decisões tomadas, user stories, decisões de teste
e — importante — o que foi **recusado** (para ninguém repropor depois).

Regras:
- Sem código nem caminhos de arquivo dentro da spec (desatualizam rápido).
- Decisão que afeta o projeto inteiro sobe para o `REGRAS-PROJETO.md` (com link para cá).
- Decisão com trade-off de arquitetura vira/atualiza nota `Decisão - *.md` no `cerebro-painel-metricas-trafego/`.
- O ticket-pai no GitHub Issues referencia o caminho da spec.
