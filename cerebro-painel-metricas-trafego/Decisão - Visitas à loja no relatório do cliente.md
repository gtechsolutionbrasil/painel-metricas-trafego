---
tipo: decisao
data: 2026-08-19
tags: [relatorio, google-ads, metricas, store-visits]
---

# Decisão - Visitas à loja no relatório do cliente

## Contexto

`Store visits` do Google Ads estava marcada como `ignore` em
`src/lib/report/labels.ts` desde a criação do relatório: ficava fora da
prestação de contas para não inflar os resultados. Só que ela aparece no
painel (com tooltip) e o cliente pergunta por ela — e o número costuma ser
5 a 10× maior que "pediu rota", então some do relatório justamente o
resultado mais vistoso da campanha de Maps.

O risco de incluir é real: `Store visits` **não é uma contagem**. O Google
observa uma amostra de aparelhos com histórico de localização ligado,
verifica quem viu/clicou no anúncio e depois esteve dentro do perímetro da
loja, e projeta estatisticamente para o público inteiro. Lida como se fosse
gente contada na porta, ela destrói a credibilidade de todo o resto do
relatório na primeira vez que o cliente conferir com o movimento real.

## Decisão

Incluir, mas nunca como número solto. Três travas no documento:

1. **Etiqueta visual obrigatória** — todo lugar onde o número aparece leva a
   `.tag-estimativa` roxa. A cor roxa (`--estimado`) ficou reservada para
   dado modelado; observado é azul/verde.
2. **Seção própria explicando o método** (`visitas`, ligável/desligável no
   seletor), com os 4 passos do modelo e o comparativo lado a lado
   "rotas traçadas (observado) × visitas à loja (estimado)".
3. **Fora da soma de contatos** — kind `storeVisit` separado, nunca somado
   em `googleContacts` nem na tabela de contatos por plataforma.

## Alternativas descartadas

- **Manter fora do relatório** — o cliente vê no painel e pergunta; esconder
  o número que a campanha de Maps mais gera só transfere a conversa para o
  WhatsApp, sem a explicação junto.
- **Incluir junto dos contatos, sem separação** — vira o pior cenário: o
  cliente soma 312 contatos + 1.093 visitas e cobra 1.405 vendas.
- **Explicar só na hora da reunião** — o relatório é enviado por link e lido
  sem o gestor do lado. Explicação que não está no documento não existe.

## Consequências

- O relatório ficou mais longo (uma seção a mais) e a seção de visitas é a
  única que não é puro número — é texto didático. Aceito: o custo de uma
  página a mais é menor que o de um número mal interpretado.
- `Store visits` vem fracionado da API (é modelo). Só arredondamos no total,
  em `data.ts` — arredondar linha a linha acumulava erro.
- A dobradinha "observado × estimado" virou padrão de leitura do relatório:
  qualquer métrica modelada que entrar depois deve seguir a mesma etiqueta e
  o mesmo tratamento de cor.
- O nome da ação chega ora em inglês (`Store visits`), ora traduzido,
  conforme a conta. `actionKind()` ganhou fallback por regex além do mapa.

## Relacionado

- [[Decisão - Sem testes automatizados no painel]]
