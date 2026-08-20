// ---------------------------------------------------------------------------
// Glossário das métricas do relatório.
//
// Regra da redação: UMA frase curta em "oQue" e um pedaço de frase em "origem".
// O cliente não é da área e lê o documento sozinho — texto longo aqui vira
// parede de texto no relatório e ninguém lê. "ressalva" só existe onde a
// leitura ingênua erra de verdade (somar o que não se soma, confundir
// estimativa com contagem).
// ---------------------------------------------------------------------------

export type Verbete = {
  /** Nome da métrica, do jeito que o cliente fala. */
  titulo: string;
  /** O que o número significa. Uma frase. */
  oQue: string;
  /** De onde o dado veio. Um pedaço de frase, sem ponto final. */
  origem: string;
  /** Só quando a leitura ingênua erra. Curta. */
  ressalva?: string;
};

export const GLOSSARIO = {
  investimento: {
    titulo: "Total investido",
    oQue: "O quanto foi pago às plataformas para exibir os anúncios no período.",
    origem: "Google Ads e Meta Ads, somando o gasto de cada dia",
  },
  visualizacoes: {
    titulo: "Visualizações",
    oQue:
      "Quantas vezes os anúncios apareceram na tela de alguém. A mesma pessoa pode ver várias vezes — visualização não é pessoa.",
    origem: "Google Ads e Meta Ads",
  },
  alcance: {
    titulo: "Pessoas alcançadas",
    oQue: "Quantas pessoas diferentes viram o anúncio pelo menos uma vez.",
    origem: "Meta Ads — o Google não informa alcance",
  },
  cliques: {
    titulo: "Cliques",
    oQue:
      "Quantas vezes alguém tocou no anúncio. Clique é interesse: vira contato só quando a pessoa chama, liga ou preenche o formulário.",
    origem: "Google Ads e Meta Ads",
  },
  contatosGoogle: {
    titulo: "Contatos pelo Google",
    oQue: "Quantas pessoas chamaram no WhatsApp, enviaram o formulário ou ligaram.",
    origem: "Google Ads",
    ressalva: "Não somar com o Meta: cada plataforma conta do seu próprio jeito.",
  },
  conversasMeta: {
    titulo: "Conversas pelo Meta",
    oQue: "Quantas conversas começaram no WhatsApp, Direct ou Messenger.",
    origem: "Meta Ads",
    ressalva: "Não somar com o Google: cada plataforma conta do seu próprio jeito.",
  },
  rotas: {
    titulo: "Rotas até a loja",
    oQue:
      "Quantas pessoas pediram o caminho até a loja no Google Maps. Pedir a rota não garante que a pessoa foi.",
    origem: "Google Ads",
  },
  visitasLoja: {
    titulo: "Visitas à loja",
    oQue: "Quantas vezes alguém que viu o anúncio esteve na loja depois.",
    origem: "estimativa do Google Ads, calculada por amostra",
    ressalva: "É estimativa, não contagem. Serve para ver se subiu ou caiu — não some com os contatos.",
  },
  visitasSite: {
    titulo: "Visitas ao site pelo perfil",
    oQue: "Quantas pessoas abriram o site pelo perfil da loja no Google.",
    origem: "Google Ads",
  },
  interacoesPerfil: {
    titulo: "Interações no perfil",
    oQue: "Quantas pessoas viram fotos, horário ou avaliações no perfil da loja.",
    origem: "Google Ads",
  },
  divisao: {
    titulo: "Divisão do investimento",
    oQue: "Quanto do total foi para cada plataforma e quantos dias cada uma ficou no ar.",
    origem: "gasto diário separado por plataforma",
  },
  semanas: {
    titulo: "Investimento por semana",
    oQue: "Quanto foi investido em cada semana do período.",
    origem: "gasto diário agrupado de 7 em 7 dias; a última semana pode ser parcial",
  },
  campanhas: {
    titulo: "Divisão por campanha",
    oQue: "Em que frentes o dinheiro foi aplicado dentro de cada plataforma.",
    origem: "gasto por campanha, com os nomes técnicos traduzidos",
  },
  temasBusca: {
    titulo: "Temas da busca",
    oQue: "O que as pessoas estavam pesquisando quando o anúncio apareceu.",
    origem: "grupos de anúncios do Google Ads",
  },
  tiposClique: {
    titulo: "Tipos de clique",
    oQue: "Em que parte do anúncio a pessoa tocou.",
    origem: "Google Ads — o Meta não oferece esse detalhe",
  },
  saldo: {
    titulo: "Fundos disponíveis",
    oQue: "Quanto ainda resta de saldo em cada conta para os anúncios continuarem no ar.",
    origem: "conta de faturamento de cada plataforma, na data de emissão",
    ressalva: "Conta sem saldo para de exibir anúncio no mesmo dia.",
  },
} satisfies Record<string, Verbete>;

export type VerbeteId = keyof typeof GLOSSARIO;

// ---------------------------------------------------------------------------
// Visitas à loja é a única métrica do relatório que estima em vez de contar, e
// costuma ser a maior de todas. Sem o método explicado, o cliente lê como
// pessoas contadas na porta e o relatório inteiro perde a credibilidade na
// primeira conferência com o movimento real da loja.
//
// Uma linha por passo, propositalmente: é explicação para quem não é da área.
// ---------------------------------------------------------------------------
export const VISITAS_LOJA_PASSOS = [
  {
    titulo: "Acompanha só quem autorizou",
    texto:
      "O Google enxerga apenas os celulares de quem deixou o histórico de localização ligado. É uma parte pequena do público.",
  },
  {
    titulo: "Vê quem esteve na loja",
    texto:
      "Nesse grupo, identifica quem viu ou clicou no anúncio e, nos dias seguintes, ficou parado dentro da loja — não só passou em frente.",
  },
  {
    titulo: "Sabe onde a loja começa e termina",
    texto:
      "O contorno da loja vem do endereço do perfil da empresa, conferido com imagem de satélite para não confundir com a calçada ou a loja vizinha.",
  },
  {
    titulo: "Multiplica para o público todo",
    texto:
      "O que aconteceu nesse grupo pequeno é projetado por conta para o público inteiro. É daí que sai o número.",
  },
] as const;

export const VISITAS_LOJA_LEITURA = [
  {
    titulo: "É sempre bem maior que “pediu rota”",
    texto: "Quem já sabe o caminho vai direto, sem pedir rota — e mesmo assim entra nesta conta.",
  },
  {
    titulo: "Conta visitas, não pessoas",
    texto: "A mesma pessoa indo três vezes no período conta três.",
  },
  {
    titulo: "Pode aparecer zerado",
    texto: "O Google só mostra o número quando tem movimento suficiente para a conta fechar.",
  },
  {
    titulo: "Não é venda e não é contato",
    texto: "Mede a ida até a loja, não o que aconteceu lá dentro. Por isso fica separada.",
  },
] as const;
