// ---------------------------------------------------------------------------
// Tradução do vocabulário das plataformas para o do cliente. O relatório é
// lido por quem não é da área: "PMax - Local" não diz nada, "Maps e Perfil da
// Empresa" diz. Cada rótulo vem com uma nota curta explicando o que é.
// ---------------------------------------------------------------------------

// ---- Ações de conversão ---------------------------------------------------
// Cada ação cai em um balde: contato direto com a loja (o que interessa),
// rota até o endereço, visita ao site pelo perfil, ou interação no perfil.
export type ActionKind =
  | "contact"
  | "directions"
  | "profileView"
  | "engagement"
  | "ignore";

const ACTION_KIND: Record<string, ActionKind> = {
  "WhatsApp - Clique": "contact",
  "Clicks to call": "contact",
  "Calls from ads": "contact",
  "Chamadas a partir de anúncios": "contact",
  "Local actions - Calls": "contact",
  "Ligação - Telefone": "contact",
  "Formulário - Orçamento": "contact",
  "Local actions - Directions": "directions",
  "Como chegar - Rota": "directions",
  "Local actions - Website visits": "profileView",
  "Local actions - Other engagements": "engagement",
  "Local actions - Menu views": "engagement",
  // Estimativa do Google, fora da contagem do relatório.
  "Store visits": "ignore",
};

const CATEGORY_KIND: Record<string, ActionKind> = {
  CONTACT: "contact",
  PHONE_CALL_LEAD: "contact",
  SUBMIT_LEAD_FORM: "contact",
  LEAD: "contact",
  GET_DIRECTIONS: "directions",
  PAGE_VIEW: "profileView",
  ENGAGEMENT: "engagement",
  STORE_VISIT: "ignore",
};

export function actionKind(name: string, category: string): ActionKind {
  // Meta manda o nome da métrica crua; toda conversa iniciada é contato.
  if (name.startsWith("onsite_conversion")) return "contact";
  return ACTION_KIND[name] ?? CATEGORY_KIND[category] ?? "ignore";
}

const ACTION_LABEL: Record<string, string> = {
  "WhatsApp - Clique": "Chamou no WhatsApp",
  "Clicks to call": "Ligou pelo perfil da loja no Google",
  "Local actions - Calls": "Ligou pelo perfil da loja no Google",
  "Calls from ads": "Ligou pelo botão do anúncio",
  "Chamadas a partir de anúncios": "Ligou pelo botão do anúncio",
  "Ligação - Telefone": "Ligou pelo telefone do site",
  "Formulário - Orçamento": "Pediu orçamento pelo formulário",
};

export function actionLabel(name: string): string {
  if (name.startsWith("onsite_conversion")) return "Chamou no WhatsApp";
  return ACTION_LABEL[name] ?? name;
}

// ---- Campanhas ------------------------------------------------------------
// Os nomes seguem a convenção do gestor ("01 - Campanha A", "PMax - Local",
// "02 [ENGAJAMENTO] [WHATSAPP]"). Reconhecemos os padrões e caímos num nome
// limpo quando não bate com nenhum.
type CampaignRule = { test: RegExp; label: string; note: string };

const CAMPAIGN_RULES: CampaignRule[] = [
  {
    test: /pmax|performance ?max|local/i,
    label: "Maps e Perfil da Empresa",
    note: "Anúncio aparece no mapa, no perfil da loja e em sites parceiros para quem está na região.",
  },
  {
    test: /whats/i,
    label: "Anúncio de WhatsApp",
    note: "Convida a pessoa a chamar a loja no WhatsApp direto pelo anúncio.",
  },
  {
    test: /reconhecimento|alcance|amplia/i,
    label: "Anúncio de reconhecimento",
    note: "Coloca a loja na frente de quem mora na região, mesmo sem estar procurando.",
  },
  {
    test: /remarketing|retarget/i,
    label: "Anúncio para quem já viu a loja",
    note: "Volta a aparecer para quem já teve contato com a loja e não comprou.",
  },
  {
    test: /venda|conversao|conversão|cp /i,
    label: "Campanha de vendas",
    note: "Foca em quem está pronto para comprar.",
  },
  {
    test: /search|busca|campanha a/i,
    label: "Busca do Google",
    note: "Anúncio aparece quando alguém pesquisa pelo que a loja vende.",
  },
];

const cleanCampaign = (raw: string) =>
  raw
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/^\s*\d+\s*[-–]\s*/, "")
    .replace(/\s+/g, " ")
    .trim() || raw;

export const campaignLabel = (raw: string) =>
  CAMPAIGN_RULES.find((r) => r.test.test(raw))?.label ?? cleanCampaign(raw);

export const campaignNote = (raw: string) =>
  CAMPAIGN_RULES.find((r) => r.test.test(raw))?.note ?? null;

// ---- Grupos de anúncio (temas da busca) -----------------------------------
const AD_GROUP: Record<string, { label: string; note: string }> = {
  local: {
    label: "Loja e produtos em geral",
    note: "Quem procura pelo que a loja vende, sem saber o nome dela.",
  },
  marca: {
    label: "Nome da loja",
    note: "Quem já conhece e procurou pelo nome.",
  },
  pisos: { label: "Pisos e porcelanato", note: '"piso", "loja de pisos" e afins.' },
  tintas: { label: "Tintas", note: '"tinta", "loja de tintas perto de mim" e afins.' },
};

const key = (s: string) => s.trim().toLowerCase();
export const adGroupLabel = (raw: string) => AD_GROUP[key(raw)]?.label ?? raw;
export const adGroupNote = (raw: string) => AD_GROUP[key(raw)]?.note ?? null;

// ---- Tipos de clique (só Google) ------------------------------------------
const CLICK_TYPE: Record<string, { label: string; note: string | null }> = {
  CROSS_NETWORK: {
    label: "Anúncio no Maps e na rede do Google",
    note: "Campanha de Maps e Perfil da Empresa",
  },
  LOCATION_EXPANSION: {
    label: "Abriu a ficha com o endereço da loja",
    note: "Clicou para ver onde a loja fica, no anúncio da busca",
  },
  CALLS: {
    label: "Tocou no botão de ligar",
    note: "Nem todo toque vira chamada completada",
  },
  URL_CLICKS: { label: "Foi para o site da loja", note: null },
  GET_DIRECTIONS: { label: "Pediu a rota direto pelo anúncio", note: null },
  SITELINKS: { label: "Clicou num atalho do anúncio", note: null },
  PRODUCT_LISTING: { label: "Clicou num produto anunciado", note: null },
  UNKNOWN: { label: "Outros cliques", note: null },
  UNSPECIFIED: { label: "Outros cliques", note: null },
};

export const clickTypeLabel = (raw: string) =>
  CLICK_TYPE[raw]?.label ?? raw.replace(/_/g, " ").toLowerCase();
export const clickTypeNote = (raw: string) => CLICK_TYPE[raw]?.note ?? null;
