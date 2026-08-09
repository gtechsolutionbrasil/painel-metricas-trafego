// ---------------------------------------------------------------------------
// Catálogo das seções do relatório e a regra de quais estão disponíveis no
// período. O gestor liga/desliga cada uma antes de exportar.
//
// Guardamos o que foi DESLIGADO, nunca o que está ligado: seção que hoje não
// tem dado (contatos zerados em julho, por exemplo) volta sozinha quando o dado
// aparecer. Se guardássemos a lista de ligadas, ela nasceria desmarcada sem
// ninguém ter desmarcado. Ausência de escolha significa sempre relatório
// completo — o padrão seguro para um link já enviado ou para quem abrir sem JS.
// ---------------------------------------------------------------------------
import type { ReportData } from "@/lib/report/data";

export const REPORT_SECTIONS = [
  {
    id: "destaques",
    label: "Números do topo",
    hint: "Investido, contatos Google, conversas Meta e rotas",
    motivo: "Precisa de veiculação no período",
  },
  {
    id: "divisao",
    label: "Como o dinheiro foi dividido",
    hint: "Quanto foi para o Google e quanto para o Meta",
    motivo: "Só aparece quando as duas plataformas rodaram",
  },
  {
    id: "semanas",
    label: "Semana a semana",
    hint: "Gráfico do investimento por semana",
    motivo: "Precisa de mais de uma semana no período",
  },
  {
    id: "google",
    label: "Dentro do Google",
    hint: "Campanhas e o que as pessoas procuravam",
    motivo: "Nenhuma campanha do Google no período",
  },
  {
    id: "meta",
    label: "Dentro do Instagram e Facebook",
    hint: "Campanhas do Meta",
    motivo: "Nenhuma campanha do Meta no período",
  },
  {
    id: "caminho",
    label: "O caminho que a pessoa percorre",
    hint: "Do anúncio até a rota da loja, passo a passo",
    motivo: "Precisa de veiculação no período",
  },
  {
    id: "placar",
    label: "O que esse investimento gerou",
    hint: "Os números lado a lado",
    motivo: "Precisa de veiculação no período",
  },
  {
    id: "contatos",
    label: "Detalhamento dos contatos",
    hint: "Google e Meta lado a lado, sem soma entre fontes",
    motivo: "Nenhum contato registrado no período",
  },
  {
    id: "fundos",
    label: "Fundos disponíveis",
    hint: "Saldo restante em cada conta",
    motivo: "Nenhuma conta com saldo lido da plataforma",
  },
] as const;

export type SectionId = (typeof REPORT_SECTIONS)[number]["id"];

export const ALL_SECTION_IDS: SectionId[] = REPORT_SECTIONS.map((s) => s.id);

const VALID = new Set<string>(ALL_SECTION_IDS);

// Seções que têm o que mostrar neste período. Independe do que o gestor
// escolheu: seção sem dado não é nem marcável.
export function availableSections(data: ReportData): Set<SectionId> {
  const out = new Set<SectionId>();
  if (!data.hasData) return out;

  out.add("destaques");
  out.add("caminho");
  out.add("placar");
  if (data.platforms.length > 1) out.add("divisao");
  if (data.weeks.length > 1) out.add("semanas");
  if (data.platforms.some((p) => p.platform === "google") && data.googleCampaigns.length > 0)
    out.add("google");
  if (data.platforms.some((p) => p.platform === "meta") && data.metaCampaigns.length > 0)
    out.add("meta");
  if (data.contactRows.length > 0) out.add("contatos");
  if (data.balances.length > 0) out.add("fundos");
  return out;
}

// ?ocultar=meta,fundos — ausente ou vazio significa relatório completo.
export function parseHidden(
  raw: string | string[] | undefined,
): Set<SectionId> {
  if (raw === undefined) return new Set();
  const value = Array.isArray(raw) ? raw.join(",") : raw;
  return new Set(
    value
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is SectionId => VALID.has(s)),
  );
}

// Volta para a URL na ordem do catálogo (link estável). Nada oculto = sem
// parâmetro, para o link continuar curto e o padrão continuar sendo completo.
export function serializeHidden(hidden: Set<SectionId>): string | null {
  const ids = ALL_SECTION_IDS.filter((id) => hidden.has(id));
  return ids.length > 0 ? ids.join(",") : null;
}

export const STORAGE_PREFIX = "relatorio:ocultas:";
