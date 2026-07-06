import { KeyRound, MapPin, MousePointerClick, Target } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  getAdClickTypes,
  getAdConversionActions,
  getAdGeo,
  getAdKeywords,
  getClients,
  resolveClient,
} from "@/lib/metrics/queries";
import {
  byClickType,
  byConversionAction,
  byKeyword,
  byRegion,
} from "@/lib/metrics/aggregate";
import { rangeFromSearch } from "@/lib/range";
import {
  fmtCompact,
  fmtCurrency,
  fmtCurrencyCents,
  fmtInt,
  fmtPercent,
} from "@/lib/format";

type SP = Record<string, string | string[] | undefined>;

// Traduções dos enums do Google Ads pra linguagem do painel.
const CLICK_TYPE_LABEL: Record<string, string> = {
  HEADLINE: "Anúncio → site",
  URL_CLICKS: "Link do anúncio → site",
  SITELINKS: "Link extra do anúncio",
  CALLS: "Ligação pelo anúncio",
  MOBILE_CALL_TRACKING: "Ligação (celular)",
  GET_DIRECTIONS: "Rota traçada no Maps",
  LOCATION_EXPANSION: "Local no Maps",
  CROSS_NETWORK: "Rede Google (PMax)",
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
  const clients = await getClients();
  const client = resolveClient(clients, searchParams.client);

  const [keywordsRaw, geoRaw, clickTypesRaw, actionsRaw] = await Promise.all([
    getAdKeywords(range, client?.id),
    getAdGeo(range, client?.id),
    getAdClickTypes(range, client?.id),
    getAdConversionActions(range, client?.id),
  ]);

  // Respeita o filtro de campanha da página (mesma regra do ChannelPage:
  // campanha desconhecida = sem filtro).
  const campaignParam = Array.isArray(searchParams.campaign)
    ? searchParams.campaign[0]
    : searchParams.campaign;
  const allCampaigns = new Set([
    ...keywordsRaw.map((r) => r.campaign),
    ...geoRaw.map((r) => r.campaign),
    ...clickTypesRaw.map((r) => r.campaign),
    ...actionsRaw.map((r) => r.campaign),
  ]);
  const filterCampaign =
    campaignParam && allCampaigns.has(campaignParam) ? campaignParam : null;
  const only = <T extends { campaign: string }>(rows: T[]) =>
    filterCampaign ? rows.filter((r) => r.campaign === filterCampaign) : rows;

  const keywords = byKeyword(only(keywordsRaw)).slice(0, 15);
  const regions = byRegion(only(geoRaw)).slice(0, 10);
  const clickTypes = byClickType(only(clickTypesRaw));
  const actions = byConversionAction(only(actionsRaw));

  if (
    !keywords.length &&
    !regions.length &&
    !clickTypes.length &&
    !actions.length
  ) {
    return null;
  }

  return (
    <>
      {/* Onde foram os cliques + o que gerou as conversões */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {clickTypes.length > 0 && (
          <Card>
            <CardHeader
              title="Onde foram os cliques"
              subtitle="O que a pessoa clicou no anúncio"
            />
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

        {actions.length > 0 && (
          <Card>
            <CardHeader
              title="Conversões por tipo de contato"
              subtitle="Que ação a pessoa fez (ligação, rota, formulário...)"
            />
            <ShareList
              icon={<Target size={15} />}
              rows={actions.map((a) => ({
                label: a.actionName,
                sublabel: categoryLabel(a.actionCategory) || null,
                value: a.conversions,
                share: a.share,
              }))}
              valueLabel="conversões"
            />
          </Card>
        )}
      </div>

      {/* Palavras-chave que performam */}
      {keywords.length > 0 && (
        <Card>
          <CardHeader
            title="Palavras-chave"
            subtitle="O que as pessoas pesquisaram (top 15 por cliques)"
            action={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <KeyRound size={17} />
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                  <th className="px-5 py-3">Palavra-chave</th>
                  <th className="px-3 py-3">Correspondência</th>
                  <th className="px-3 py-3 text-right">Impressões</th>
                  <th className="px-3 py-3 text-right">Cliques</th>
                  <th className="px-3 py-3 text-right">CTR</th>
                  <th className="px-3 py-3 text-right">Investido</th>
                  <th className="px-5 py-3 text-right">Conversões</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((k) => (
                  <tr
                    key={`${k.keyword}-${k.matchType}`}
                    className="border-b border-line last:border-0 transition-colors hover:bg-surface-2"
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
                    <td className="px-3 py-3 text-right text-muted">
                      {fmtCurrencyCents(k.spend)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">
                      {fmtInt(k.conversions)}
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
            title="Desempenho por região"
            subtitle="De onde vêm as pessoas que veem e clicam"
            action={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <MapPin size={17} />
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                  <th className="px-5 py-3">Região</th>
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
                    className="border-b border-line last:border-0 transition-colors hover:bg-surface-2"
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
