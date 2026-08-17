import {
  Globe,
  KeyRound,
  Layers,
  MapPin,
  MousePointerClick,
  Search,
  SearchCheck,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import type { ConversionSource } from "@/lib/types";
import {
  getAdClickTypes,
  getAdConversionActions,
  getAdGeo,
  getAdGroups,
  getAdKeywords,
  getAdSearchTerms,
  getClients,
  resolveClient,
} from "@/lib/metrics/queries";
import {
  byAdGroup,
  byClickType,
  byConversionActionGrouped,
  byKeyword,
  byRegion,
  bySearchTerm,
} from "@/lib/metrics/aggregate";
import { rangeFromSearch } from "@/lib/range";
import { selectedCampaigns } from "@/lib/campaigns";
import { hideMetric, presentationFromSearch } from "@/lib/presentation";
import {
  fmtCompact,
  fmtCurrency,
  fmtCurrencyCents,
  fmtInt,
  fmtPercent,
} from "@/lib/format";

type SP = Record<string, string | string[] | undefined>;

// Traduções dos enums do Google Ads pra linguagem do painel.
// Nomeia a AÇÃO DA PESSOA (verbo) pra não confundir com as conversões, que
// usam o mesmo vocabulário ("rota", "ligação") em outra lente.
const CLICK_TYPE_LABEL: Record<string, string> = {
  HEADLINE: "Clicou no anúncio → site",
  URL_CLICKS: "Clicou no link → site",
  SITELINKS: "Clicou num link extra do anúncio",
  CALLS: "Tocou pra ligar",
  MOBILE_CALL_TRACKING: "Tocou pra ligar (celular)",
  GET_DIRECTIONS: "Pediu rota no Maps",
  LOCATION_EXPANSION: "Abriu o local no Maps",
  CROSS_NETWORK: "Anúncio na Rede Google (PMax)",
  PRODUCT_LISTING_AD_CLICKS: "Anúncio de produto",
  OTHER: "Outros",
  UNSPECIFIED: "Outros",
};

const CATEGORY_LABEL: Record<string, string> = {
  GET_DIRECTIONS: "Rota no Maps",
  PHONE_CALL_LEAD: "Ligação",
  CONTACT: "Contato",
  SUBMIT_LEAD_FORM: "Formulário",
  LEAD: "Lead",
  SIGNUP: "Cadastro",
  PURCHASE: "Compra",
  PAGE_VIEW: "Visita na página",
  DEFAULT: "Conversão",
};

const MATCH_LABEL: Record<string, string> = {
  EXACT: "Exata",
  PHRASE: "Frase",
  BROAD: "Ampla",
};

// Nomes das ações de conversão que o Google entrega em inglês → PT.
// Também em formato de AÇÃO, e distintos entre si ("chamada completada" ≠
// "tocou no botão"): eram quase iguais e confundiam a leitura.
const ACTION_NAME_LABEL: Record<string, string> = {
  "Local actions - Directions": "Pediu rota até a loja (Maps)",
  "Local actions - Other engagements": "Interagiu com o perfil (Maps)",
  "Local actions - Website visits": "Abriu o site pelo perfil (Maps)",
  "Local actions - Calls": "Ligou pelo perfil da empresa (Maps)",
  "Calls from ads": "Ligou pelo anúncio (chamada feita)",
  "Chamadas a partir de anúncios": "Ligou pelo anúncio (chamada feita)",
  "Clicks to call": "Tocou no botão de ligar",
  "Store visits": "Visitou a loja",
};
const actionNameLabel = (n: string) => ACTION_NAME_LABEL[n] ?? n;

const HIDDEN_CLICK_TYPES = new Set(["GET_DIRECTIONS"]);

// Fallback legível pra enums não mapeados: "SOME_ENUM" -> "Some enum".
function prettyEnum(value: string) {
  const s = value.replace(/_/g, " ").toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : value;
}

const clickTypeLabel = (t: string) => CLICK_TYPE_LABEL[t] ?? prettyEnum(t);
const categoryLabel = (c: string) =>
  c ? (CATEGORY_LABEL[c] ?? prettyEnum(c)) : "";
// Nomes de região vêm em inglês do Google ("State of Rio Grande do Sul").
const regionLabel = (r: string) => r.replace(/^State of /, "");

// ---------------------------------------------------------------------------
// Detalhamento do Google Ads: onde foram os cliques, que ação gerou cada
// conversão, palavras-chave e regiões. Se não há dado coletado, não renderiza.
// ---------------------------------------------------------------------------
export async function GoogleInsights({ searchParams }: { searchParams: SP }) {
  const { range } = rangeFromSearch(searchParams);
  // Modo apresentação: consulta o registro central do que é sensível.
  const hideCpc = hideMetric("cpc", presentationFromSearch(searchParams));
  const clients = await getClients();
  const client = resolveClient(clients, searchParams.client);
  const accountExternalId = Array.isArray(searchParams.account)
    ? searchParams.account[0]
    : searchParams.account;

  const [keywordsRaw, geoRaw, clickTypesRaw, actionsRaw, searchTermsRaw, groupsRaw] =
    await Promise.all([
      getAdKeywords(range, client?.id, accountExternalId),
      getAdGeo(range, client?.id, accountExternalId),
      getAdClickTypes(range, client?.id, accountExternalId),
      getAdConversionActions(range, client?.id, accountExternalId),
      getAdSearchTerms(range, client?.id, accountExternalId),
      getAdGroups(range, client?.id, accountExternalId),
    ]);

  // Respeita o filtro multi de campanha da página (mesmo helper do ChannelPage).
  const knownCampaigns = [
    ...new Set([
      ...keywordsRaw.map((r) => r.campaign),
      ...geoRaw.map((r) => r.campaign),
      ...clickTypesRaw.map((r) => r.campaign),
      ...actionsRaw.map((r) => r.campaign),
      ...searchTermsRaw.map((r) => r.campaign),
      ...groupsRaw.map((r) => r.campaign),
    ]),
  ].map((campaign) => ({ campaign }));
  const filter = selectedCampaigns(searchParams, knownCampaigns);
  const only = <T extends { campaign: string }>(rows: T[]) =>
    filter.size ? rows.filter((r) => filter.has(r.campaign)) : rows;

  const keywords = byKeyword(only(keywordsRaw)).slice(0, 15);
  const regions = byRegion(only(geoRaw)).slice(0, 10);
  const clickTypes = byClickType(
    only(clickTypesRaw).filter((r) => !HIDDEN_CLICK_TYPES.has(r.clickType)),
  );
  const actionGroups = byConversionActionGrouped(
    only(actionsRaw),
  );
  const searchTerms = bySearchTerm(only(searchTermsRaw)).slice(0, 15);
  const adGroups = byAdGroup(only(groupsRaw));

  if (
    !keywords.length &&
    !regions.length &&
    !clickTypes.length &&
    !actionGroups.length &&
    !searchTerms.length &&
    !adGroups.length
  ) {
    return null;
  }

  return (
    <>
      {/* Conversões separadas por origem: site do cliente vs Google.
          Mostra sempre os 2 lados (com placeholder no vazio) pra ficar claro
          o contraste entre o que vem do site e o que vem do Google. */}
      {actionGroups.length > 0 && (
        <Card>
          <CardHeader
            title="Ações atribuídas pelo Google"
            subtitle="WhatsApp, formulário e ligação são contatos; rotas, visitas e demais ações aparecem sem serem confundidas com leads."
          />
          <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-2">
            {(["site", "google"] as const).map((source) => {
              const g = actionGroups.find((x) => x.source === source);
              return (
                <div key={source} className="bg-surface p-4">
                  <SourceHeader source={source} total={g?.total ?? 0} />
                  {g ? (
                    <ShareList
                      icon={
                        source === "site" ? (
                          <Globe size={15} />
                        ) : (
                          <Search size={15} />
                        )
                      }
                      rows={g.rows.map((a) => {
                        // Categoria só aparece se acrescentar algo (evita
                        // "Rota no Maps · Rota no Maps" duplicado).
                        const label = actionNameLabel(a.actionName);
                        const cat = categoryLabel(a.actionCategory);
                        return {
                          label,
                          sublabel: cat && !label.toLowerCase().includes(cat.toLowerCase()) ? cat : null,
                          value: a.conversions,
                          share: a.share,
                        };
                      })}
                      valueLabel="ações"
                    />
                  ) : (
                    <p className="px-3 py-8 text-center text-xs text-faint">
                      {source === "site"
                        ? "Ainda sem ações atribuídas ao site no período."
                        : "Sem ações atribuídas dentro do Google no período."}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Onde foram os cliques */}
      {clickTypes.length > 0 && (
        <Card>
          <CardHeader title="Pra onde foram os cliques" />
          <ShareList
            icon={<MousePointerClick size={15} />}
            rows={clickTypes.map((c) => ({
              label: clickTypeLabel(c.clickType),
              sublabel: null,
              value: c.clicks,
              share: c.share,
            }))}
            valueLabel="cliques"
          />
        </Card>
      )}

      {/* Grupos de anúncios */}
      {adGroups.length > 0 && (
        <Card>
          <CardHeader
            title="Grupos de anúncios"
            subtitle="Desempenho de cada grupo dentro das campanhas"
            action={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <Layers size={17} />
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="table min-w-[720px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-5 py-3">Grupo</th>
                  <th className="px-3 py-3 text-right">Impressões</th>
                  <th className="px-3 py-3 text-right">Cliques</th>
                  <th className="px-3 py-3 text-right">CTR</th>
                  {!hideCpc && <th className="px-3 py-3 text-right">CPC</th>}
                  <th className="px-5 py-3 text-right">Investido</th>
                </tr>
              </thead>
              <tbody>
                {adGroups.map((g) => (
                  <tr
                    key={g.adGroup}
                  >
                    <td className="px-5 py-3 font-semibold text-ink">
                      {g.adGroup}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtCompact(g.impressions)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-ink">
                      {fmtInt(g.clicks)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtPercent(g.ctr)}
                    </td>
                    {!hideCpc && (
                      <td className="px-3 py-3 text-right text-muted">
                        {fmtCurrencyCents(g.cpc)}
                      </td>
                    )}
                    <td className="px-5 py-3 text-right text-muted">
                      {fmtCurrency(g.spend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Palavras-chave que performam */}
      {keywords.length > 0 && (
        <Card>
          <CardHeader
            title="Palavras-chave"
            subtitle="Palavras-chave que você configurou (top 15 por cliques)"
            action={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <KeyRound size={17} />
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="table min-w-[820px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-5 py-3">Palavra-chave</th>
                  <th className="px-3 py-3">Correspondência</th>
                  <th className="px-3 py-3 text-right">Impressões</th>
                  <th className="px-3 py-3 text-right">Cliques</th>
                  <th className="px-3 py-3 text-right">CTR</th>
                  <th className="px-5 py-3 text-right">Investido</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((k) => (
                  <tr
                    key={`${k.keyword}-${k.matchType}`}
                  >
                    <td className="px-5 py-3 font-semibold text-ink">
                      {k.keyword}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {MATCH_LABEL[k.matchType] ?? prettyEnum(k.matchType)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtCompact(k.impressions)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-ink">
                      {fmtInt(k.clicks)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtPercent(k.ctr)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted">
                      {fmtCurrencyCents(k.spend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Termos de pesquisa (o que as pessoas realmente digitaram) */}
      {searchTerms.length > 0 && (
        <Card>
          <CardHeader
            title="Termos de pesquisa"
            subtitle="O que as pessoas realmente digitaram no Google (top 15 por cliques)"
            action={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <SearchCheck size={17} />
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="table min-w-[640px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-5 py-3">O que pesquisaram</th>
                  <th className="px-3 py-3 text-right">Impressões</th>
                  <th className="px-3 py-3 text-right">Cliques</th>
                  <th className="px-3 py-3 text-right">CTR</th>
                  <th className="px-5 py-3 text-right">Conversões</th>
                </tr>
              </thead>
              <tbody>
                {searchTerms.map((s) => (
                  <tr
                    key={s.searchTerm}
                  >
                    <td className="px-5 py-3 font-semibold text-ink">
                      {s.searchTerm}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtCompact(s.impressions)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-ink">
                      {fmtInt(s.clicks)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtPercent(s.ctr)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">
                      {fmtInt(s.conversions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Regiões */}
      {regions.length > 0 && (
        <Card>
          <CardHeader
            title="Desempenho por cidade"
            subtitle="De quais cidades vêm as pessoas que veem e clicam"
            action={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <MapPin size={17} />
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="table min-w-[640px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-5 py-3">Cidade</th>
                  <th className="px-3 py-3 text-right">Impressões</th>
                  <th className="px-3 py-3 text-right">Cliques</th>
                  <th className="px-3 py-3 text-right">Investido</th>
                  <th className="px-5 py-3 text-right">Conversões</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((g) => (
                  <tr
                    key={g.region}
                  >
                    <td className="px-5 py-3 font-semibold text-ink">
                      {regionLabel(g.region)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtCompact(g.impressions)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-ink">
                      {fmtInt(g.clicks)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtCurrency(g.spend)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">
                      {fmtInt(g.conversions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

// Cabeçalho de um grupo de origem, explicando de onde vem a conversão.
function SourceHeader({
  source,
  total,
}: {
  source: ConversionSource;
  total: number;
}) {
  const site = source === "site";
  return (
    <div className="mb-1 flex items-center justify-between gap-2 px-2">
      <div className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg ${
            site
              ? "bg-brand-soft text-brand"
              : "bg-[#eff6ff] text-[#1d4ed8]"
          }`}
        >
          {site ? <Globe size={15} /> : <Search size={15} />}
        </span>
        <div>
          <p className="text-sm font-bold text-ink">
            {site ? "No site do cliente" : "No Google"}
          </p>
          <p className="text-[11px] text-faint">
            {site
              ? "disparado pelo site (via GTM)"
              : "perfil da empresa, Maps e anúncio"}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-extrabold text-ink">
        {fmtInt(total)}
      </span>
    </div>
  );
}

// Lista com barra de participação (mesmo padrão visual da página Sites).
function ShareList({
  icon,
  rows,
  valueLabel,
}: {
  icon: React.ReactNode;
  rows: {
    label: string;
    sublabel: string | null;
    value: number;
    share: number;
  }[];
  valueLabel: string;
}) {
  return (
    <div className="space-y-1 p-3">
      {rows.map((row) => (
        <div
          key={`${row.label}-${row.sublabel ?? ""}`}
          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-ink">
                {row.label}
                {row.sublabel && (
                  <span className="ml-2 text-xs font-medium text-faint">
                    {row.sublabel}
                  </span>
                )}
              </p>
              <p className="shrink-0 text-sm font-bold text-ink">
                {fmtInt(row.value)}{" "}
                <span className="text-xs font-medium text-faint">
                  {valueLabel}
                </span>
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(3, row.share * 100)}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-semibold text-muted">
                {fmtPercent(row.share)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
