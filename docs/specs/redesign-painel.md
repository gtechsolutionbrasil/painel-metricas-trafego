# Spec — Redesign do painel (visual + hierarquia)

> Gerada via `/grill-me` + `/to-spec` em 2026-08-17. Ticket-pai no GitHub Issues referencia esta spec.

## Problem Statement

O painel funciona e a informação certa existe, mas a execução visual é desigual entre as telas:
a Visão geral apresenta cinco KPIs sem hierarquia entre si, a tela de Site não tem nenhuma
comparação com período anterior, tabelas e gráficos não seguem um padrão único, e a tipografia
dos números não tem o acabamento de um produto premium. Além disso, quando o gestor mostra o
painel a um cliente (reunião, compartilhamento de tela), os custos unitários — custo por
contato/conversa, custo por clique — e o saldo da conta ficam expostos e assustam o cliente,
que não tem contexto para interpretá-los.

## Solution

Refinar o painel inteiro dentro da linha visual atual ("admin premium": tema claro único,
verde como cor de marca, estética sóbria com números grandes e tiles limpos), reorganizando a
hierarquia da informação sem mudar o conjunto de métricas exibido. Três funcionalidades novas
completam o pacote: um seletor de base de comparação na barra do topo, sparklines nos KPIs
primários, e um modo apresentação que esconde temporariamente os números sensíveis para
mostrar o painel ao cliente sem susto.

## User Stories

1. Como gestor de tráfego, quero abrir a Visão geral e entender em segundos quanto investi e quantos contatos gerei no período, para decidir rápido onde olhar em seguida.
2. Como gestor de tráfego, quero que os números principais tenham tipografia grande e alinhamento tabular consistente, para comparar valores de relance sem esforço.
3. Como gestor de tráfego, quero que todas as telas usem o mesmo sistema visual (cards, tabelas, gráficos, badges), para não ter que "reaprender" a ler cada tela.
4. Como gestor de tráfego, quero manter a estrutura das telas de canal — os 4 números que decidem, a faixa de métricas secundárias, o saldo, os gráficos diários e a tabela de campanhas — para não perder o fluxo de leitura que já funciona.
5. Como gestor de tráfego, quero uma tabela de campanhas mais legível (alinhamento numérico, cabeçalhos claros, estados de veiculação evidentes), para diagnosticar campanhas sem apertar os olhos.
6. Como gestor de tráfego, quero ver a variação vs. período de comparação também nos KPIs da tela de Site, para saber se sessões, rejeição e eventos de contato melhoraram ou pioraram.
7. Como gestor de tráfego, quero escolher a base de comparação — período anterior, mesmo período do ano passado, ou sem comparação — para contextualizar sazonalidade quando precisar.
8. Como gestor de tráfego, quero que a base de comparação escolhida valha para todas as telas de uma vez, para não reconfigurar tela a tela.
9. Como gestor de tráfego, quero que o default de comparação seja o período anterior de mesmo tamanho, para que o comportamento atual continue sem eu precisar mexer em nada.
10. Como gestor de tráfego, quero que "sem comparação" limpe todas as pílulas de variação, para tirar ruído da tela quando a comparação não faz sentido.
11. Como gestor de tráfego, quero sparklines (mini-tendência dos dias do período) dentro dos KPIs primários, para distinguir uma queda recente de uma queda antiga sem abrir o gráfico grande.
12. Como gestor de tráfego, quero que os KPIs secundários fiquem só com número e variação, para a tela não virar poluição de mini-gráficos.
13. Como gestor de tráfego, quero um botão de modo apresentação na barra do topo, para ativar com um clique antes de mostrar o painel ao cliente.
14. Como gestor de tráfego, quero que o modo apresentação esconda os custos unitários (custo por contato, custo por conversa, custo por clique) e o saldo da conta em todas as telas, para o cliente não se assustar com números sem contexto.
15. Como gestor de tráfego, quero que o investimento total continue visível no modo apresentação, porque o gasto geral pode ser mostrado ao cliente.
16. Como gestor de tráfego, quero indicação visível de que o modo apresentação está ativo, para nunca esquecer de desativá-lo e voltar ao painel completo.
17. Como gestor de tráfego, quero que o modo apresentação seja temporário e reversível com um clique, para não perder meus números do dia a dia.
18. Como cliente da agência, quero ver na tela apresentada o investimento e os resultados sem custos unitários expostos, para acompanhar o trabalho sem interpretar métricas técnicas fora de contexto.
19. Como gestor de tráfego, quero que o funil do CRM e os cards de integrações sigam o mesmo sistema visual refinado, para o painel parecer um produto único.
20. Como gestor de tráfego, quero que a navegação continue como está — sidebar fixa no desktop, barra inferior no mobile — só repolida, para não reaprender o layout.
21. Como gestor de tráfego, quero que o painel continue confortável no mobile (cards empilhados, tabelas roláveis), para conferir números fora do escritório.
22. Como gestor de tráfego, quero que a tela de login herde o refinamento dos tokens (botões, inputs, cores), para a entrada do produto ter o mesmo acabamento.
23. Como gestor de tráfego, quero que estado de período, comparação e modo apresentação vivam na URL, para compartilhar/recarregar a tela exatamente como estava.
24. Como gestor de tráfego, quero que os gráficos mantenham a paleta categórica atual por canal, para não reaprender qual cor é Google e qual é Meta.
25. Como gestor de tráfego, quero que animações respeitem a preferência de movimento reduzido do sistema, como o painel já faz hoje.

## Implementation Decisions

- **Linha visual**: tema claro único ("admin premium" refinado), verde atual como cor de marca, fonte Inter mantida. Estética de referência: Vercel/Linear — tiles sóbrios, números grandes, gráficos limpos — aplicada a critério do implementador com as guidelines de dataviz. Sem dark mode, sem identidade GTech neon.
- **Tokens**: o refinamento acontece na camada de tokens CSS existente (Tailwind v4 CSS-first) e nas classes de componente compartilhadas — nunca cor/valor hardcoded em tela. Telas herdam o refinamento pelos tokens; é assim que o login melhora "de graça".
- **Escopo de telas**: as 6 telas internas (Visão geral, Google, Meta, Site, CRM, Integrações). O relatório do cliente tem visual próprio isolado e não é tocado.
- **Estrutura preservada**: nenhuma tela muda de estrutura — Visão geral mantém KPIs + SignalCards + atalhos + 2 gráficos; canais mantêm a espinha "4 números que decidem" + secundários + saldo + gráficos + tabela. O ganho é execução: hierarquia tipográfica, espaçamento, padronização de tabelas e gráficos.
- **Conjunto de métricas congelado**: nenhuma métrica entra ou sai; nenhum cálculo muda. O vocabulário centralizado de resultados e os labels técnicos atuais permanecem a fonte da verdade.
- **Seletor de comparação**: novo controle na barra do topo, ao lado do seletor de período, com 3 opções — Período anterior (default, comportamento atual) · Mesmo período do ano passado · Sem comparação. O modo vive na URL como os demais filtros e é lido pela mesma camada de utilitários de período que hoje calcula o período anterior; a nova função é irmã da existente. "Mesmo período do ano passado" = mesmas datas deslocadas um ano. "Sem comparação" suprime as pílulas de variação em todas as telas.
- **Trends na tela de Site**: os 6 KPIs de GA4 ganham a mesma pílula de variação das demais telas, usando a base de comparação selecionada (exige buscar o período de comparação também para os dados de GA4).
- **Sparklines**: mini-gráfico de linha (série diária do período atual) dentro dos cards de KPI primários — os 5 da Visão geral e os 4 números que decidem dos canais. KPIs secundários e MiniStats não recebem sparkline. Implementado como variação do componente de KPI com a biblioteca de gráficos já usada no projeto; sem eixos, sem tooltip, decorativo-informativo.
- **Modo apresentação**: toggle na barra do topo, estado na URL (compartilhável/recarregável), com indicador visual persistente de modo ativo. Um registro central único define o que é "sensível": custos unitários (custo por contato, custo por conversa, custo por clique) e saldo da conta. Componentes de exibição consultam esse registro — a decisão de esconder não fica espalhada por tela. Investimento total, contatos, CTR, impressões e demais métricas continuam visíveis. Ao esconder um card/coluna, o layout se reacomoda (não exibir caixas vazias nem borrões).
- **Gráficos**: Recharts mantido; os wrappers existentes (área, barras, donut) são padronizados (mesmos eixos, grid, tooltip, espessuras) e a paleta categórica por canal é mantida.
- **Navegação**: sidebar fixa desktop + bottom-nav mobile mantidas, apenas repolidas.

## Testing Decisions

- **Sem testes automatizados** — decisão explícita do usuário (o projeto não tem infra de teste e ela não será introduzida nesta feature).
- Gates de qualidade: `lint` e `build` verdes em cada ticket.
- Verificação manual por checklist ao final, tela a tela: (1) as 6 telas no desktop e no mobile; (2) as 3 bases de comparação e o efeito nas pílulas de todas as telas, incluindo Site; (3) modo apresentação ativado — varrer todas as telas confirmando que nenhum custo unitário nem saldo aparece, e que investimento continua visível; (4) sparklines com períodos curtos (1 dia) e longos (30 dias); (5) login e estados vazios/demo.
- O que seria um bom teste, se existisse: comportamento externo apenas — dado um range e um modo, o range de comparação devolvido; dada uma métrica, se o modo apresentação a esconde. Fica registrado para o futuro; não será implementado agora.

## Out of Scope

- Dark mode / toggle de tema.
- Identidade GTech neon (verde `#3DFF47` sobre carbono) — o painel segue "admin premium" claro.
- O relatório do cliente (documento de prestação de contas) — visual próprio, intocado.
- Mudanças no conjunto de métricas, novos breakdowns ou novos cálculos.
- ROAS — segue banido do painel por decisão anterior do usuário.
- UI de comparação além das 3 opções definidas (ex.: range de comparação customizado).
- Infra de testes automatizados (Vitest, Playwright etc.).
- Modo apresentação com senha/perfil de acesso — é um toggle de exibição, não controle de acesso.

## Further Notes

- A tensão que originou o modo apresentação: o cliente formalmente só vê o relatório, mas na prática vê o painel em reuniões/tela compartilhada. O modo apresentação resolve isso sem cegar o gestor no dia a dia e sem remover o custo por contato da espinha dorsal dos canais.
- Ideias de métricas novas surgidas na entrevista: nenhuma — a lista à parte ficou vazia.
- A decisão "sem testes automatizados" vale além desta feature e foi registrada como nota de decisão no cerebro do projeto.
