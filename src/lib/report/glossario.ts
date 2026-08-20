// ---------------------------------------------------------------------------
// Glossário das métricas do relatório.
//
// Todo número que o cliente vê carrega duas respostas: O QUE É (o que aquilo
// significa na vida real) e DE ONDE VEM (qual plataforma informou e por qual
// caminho). Ficam juntos aqui, num lugar só, porque a mesma métrica aparece em
// mais de um ponto do documento (card do topo, placar, jornada) e o texto não
// pode divergir entre eles.
//
// `ressalva` é opcional e só existe onde a leitura ingênua erra: número que
// não pode ser somado com outro, estimativa que parece contagem, clique que
// parece contato.
// ---------------------------------------------------------------------------

export type Verbete = {
  /** Nome curto da métrica, do jeito que o cliente fala. */
  titulo: string;
  /** O que aquele número representa no mundo real. */
  oQue: string;
  /** Qual plataforma informou e por qual caminho o dado chegou aqui. */
  origem: string;
  /** Onde a leitura ingênua erra. Sai destacado em amarelo no documento. */
  ressalva?: string;
};

export const GLOSSARIO = {
  investimento: {
    titulo: "Total investido",
    oQue:
      "Todo o dinheiro efetivamente pago às plataformas para exibir os anúncios no período. É o custo de mídia — não inclui honorário de gestão.",
    origem:
      "Soma do gasto de cada dia de cada campanha, lido direto das contas de anúncio do Google Ads e do Meta Ads.",
  },

  visualizacoes: {
    titulo: "Visualizações dos anúncios",
    oQue:
      "Quantas vezes os anúncios apareceram na tela de alguém — na busca do Google, no mapa, no feed ou nos stories. A mesma pessoa vendo três vezes conta três.",
    origem:
      "Campo de impressões relatado pelas duas plataformas, somado dia a dia.",
    ressalva:
      "Visualização não é pessoa. Para saber quantas pessoas diferentes foram atingidas, use o alcance.",
  },

  alcance: {
    titulo: "Pessoas alcançadas",
    oQue:
      "Quantas pessoas diferentes viram o anúncio ao menos uma vez. É sempre menor que as visualizações.",
    origem:
      "Métrica de alcance do Meta Ads. O Google não divulga alcance por conta, então este número cobre só Instagram e Facebook.",
  },

  cliques: {
    titulo: "Cliques nos anúncios",
    oQue:
      "Toques no anúncio: no título, na imagem, no botão de ligar, no atalho de rota ou no link do site.",
    origem:
      "Contagem de cliques do Google Ads e do Meta Ads. No Google ainda dá para abrir por tipo de clique, e é o que aparece no detalhamento.",
    ressalva:
      "Clique é interesse, não é contato. Só vira contato quando a pessoa chama, liga ou preenche o formulário.",
  },

  contatosGoogle: {
    titulo: "Contatos pelo Google",
    oQue:
      "Pessoas que saíram do anúncio e procuraram a loja de verdade: chamaram no WhatsApp, enviaram o formulário de orçamento ou ligaram.",
    origem:
      "Ações de conversão registradas pelo Google Ads — parte medida no site pelo código de acompanhamento, parte medida dentro do próprio Google (ligação pelo anúncio e pelo perfil da empresa).",
    ressalva:
      "Não somamos com o Meta. Cada plataforma atribui pelo seu próprio método, e a mesma pessoa poderia ser contada duas vezes.",
  },

  conversasMeta: {
    titulo: "Conversas pelo Meta",
    oQue:
      "Conversas iniciadas com a loja a partir do anúncio — WhatsApp, Direct do Instagram ou Messenger.",
    origem:
      "Conversões informadas pela própria campanha no Meta Ads, na linha de cada campanha.",
    ressalva:
      "Não somamos com o Google. São duas contagens independentes, exibidas lado a lado de propósito.",
  },

  rotas: {
    titulo: "Rotas traçadas até a loja",
    oQue:
      "Pessoas que abriram o perfil da empresa no Google ou no Maps e tocaram em “Rotas” para traçar o caminho até o endereço da loja.",
    origem:
      "Ação de conversão “rota” do Google Ads, gerada quando o toque acontece a partir do anúncio ou do perfil ligado a ele.",
    ressalva:
      "É um dado observado — alguém realmente tocou no botão. Ainda assim, traçar a rota não garante que a pessoa foi até a loja.",
  },

  visitasLoja: {
    titulo: "Visitas à loja",
    oQue:
      "Estimativa de quantas vezes uma pessoa viu ou clicou no anúncio e, depois, esteve fisicamente dentro da loja.",
    origem:
      "Modelo estatístico do Google Ads, calculado a partir de uma amostra de aparelhos com histórico de localização ligado e projetado para o público todo.",
    ressalva:
      "É estimativa, não contagem. Serve para acompanhar tendência de mês para mês, não como número exato — e não entra na conta de contatos.",
  },

  visitasSite: {
    titulo: "Visitas ao site pelo perfil",
    oQue:
      "Pessoas que abriram o site da loja tocando no link dentro do perfil da empresa no Google ou no Maps.",
    origem:
      "Ação de conversão “visita ao site” do perfil da empresa, informada pelo Google Ads.",
  },

  interacoesPerfil: {
    titulo: "Interações no perfil",
    oQue:
      "Outras ações dentro do perfil da empresa no Google: ver fotos, conferir o horário de funcionamento, ler ou deixar avaliação, salvar e compartilhar o local.",
    origem:
      "Ações de engajamento no perfil da empresa, informadas pelo Google Ads.",
  },

  divisao: {
    titulo: "Divisão do investimento",
    oQue:
      "Quanto do total foi para cada plataforma e quantos dias cada uma ficou no ar dentro do período.",
    origem:
      "Mesma base do total investido, separada por plataforma e por dia com gasto maior que zero.",
  },

  semanas: {
    titulo: "Investimento por semana",
    oQue:
      "Quanto foi investido em cada bloco de sete dias do período, empilhado por plataforma.",
    origem:
      "Gasto diário agrupado em semanas de sete dias contadas a partir do primeiro dia do período. A última semana pode ser parcial.",
  },

  campanhas: {
    titulo: "Divisão por campanha",
    oQue:
      "Em que frentes o dinheiro foi aplicado dentro de cada plataforma — busca, mapa, remarketing, WhatsApp.",
    origem:
      "Gasto por campanha da conta de anúncio. Os nomes técnicos foram traduzidos para o que a campanha faz na prática.",
  },

  temasBusca: {
    titulo: "Temas da busca",
    oQue:
      "Dentro das campanhas de busca, quais assuntos as pessoas estavam pesquisando quando o anúncio apareceu.",
    origem:
      "Gasto por grupo de anúncios do Google Ads. Cada grupo reúne um conjunto de termos de busca parecidos.",
  },

  tiposClique: {
    titulo: "Tipos de clique no Google",
    oQue:
      "Em que parte do anúncio a pessoa tocou: no título, no botão de ligar, no atalho de rota, num produto.",
    origem:
      "Detalhamento de cliques por tipo do Google Ads. O Meta não oferece esse recorte.",
  },

  saldo: {
    titulo: "Fundos disponíveis",
    oQue:
      "Quanto ainda resta de saldo pré-pago em cada conta de anúncio para as campanhas continuarem no ar.",
    origem:
      "Saldo lido direto da conta de faturamento de cada plataforma, na data de emissão deste relatório.",
    ressalva:
      "Conta sem saldo para de exibir anúncio no mesmo dia, mesmo com campanha ativa.",
  },
} satisfies Record<string, Verbete>;

export type VerbeteId = keyof typeof GLOSSARIO;

// ---------------------------------------------------------------------------
// Visitas à loja pede mais do que duas linhas: é a única métrica do relatório
// que não conta nada, e sim estima. Sem entender o método, o cliente lê como
// se fossem pessoas contadas na porta — e o número é grande o bastante para
// estragar toda a leitura do relatório se for lido assim.
// ---------------------------------------------------------------------------
export const VISITAS_LOJA_PASSOS = [
  {
    titulo: "O Google observa um grupo pequeno de pessoas",
    texto:
      "Só entram na medição os aparelhos de quem deixou ligado o histórico de localização e a atividade na web e nos apps do Google. É uma fração do público — a maioria das pessoas nunca é observada.",
  },
  {
    titulo: "Ele liga o anúncio à ida até o endereço",
    texto:
      "Dentro desse grupo, o Google identifica quem viu ou clicou no anúncio e, nos dias seguintes, esteve parado dentro do perímetro da loja por tempo suficiente para caracterizar uma visita — não só passar em frente.",
  },
  {
    titulo: "Ele sabe onde a loja começa e termina",
    texto:
      "O perímetro vem do endereço do perfil da empresa, refinado com imagens de satélite e Street View, para separar a loja da calçada e das lojas vizinhas.",
  },
  {
    titulo: "E projeta o resultado para o público inteiro",
    texto:
      "O que foi visto na amostra é multiplicado estatisticamente para estimar o total. Por isso o número aparece redondo, mas nasce de um modelo — não de uma contagem na porta.",
  },
] as const;

export const VISITAS_LOJA_LEITURA = [
  {
    titulo: "Costuma ser bem maior que as rotas traçadas",
    texto:
      "Pedir rota é para quem não sabe o caminho. Quem já conhece a loja simplesmente vai — e entra nesta conta sem ter tocado em nada.",
  },
  {
    titulo: "Conta visitas, não pessoas",
    texto:
      "A mesma pessoa voltando três vezes no período conta três visitas.",
  },
  {
    titulo: "Zerou? Nem sempre é falta de visita",
    texto:
      "O Google só divulga o número quando tem volume suficiente para confiar na estimativa. Período curto ou investimento baixo aparece vazio mesmo com gente entrando na loja.",
  },
  {
    titulo: "Não é venda e não é contato",
    texto:
      "Mede a ida até o endereço, não o que aconteceu lá dentro. Por isso fica separada dos contatos e nunca é somada a eles.",
  },
] as const;
