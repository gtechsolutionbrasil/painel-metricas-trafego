import {
  DollarSign,
  Eye,
  Gauge,
  MousePointerClick,
  Percent,
  PlugZap,
  Target,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CampaignFilter } from "@/components/pages/CampaignFilter";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { CHART_COLORS } from "@/components/charts/theme";
import {
  getAdCampaigns,
  getAdMetrics,
  getClients,
  resolveClient,
} from "@/lib/metrics/queries";
import { adByCampaign, adByDay, adKpis } from "@/lib/metrics/aggregate";
import { selectedCampaigns } from "@/lib/campaigns";
import { delta, previousRange, rangeFromSearch } from "@/lib/range";
import {
  fmtCompact,
  fmtCurrency,
  fmtCurrencyCents,
  fmtInt,
  fmtPercent,
} from "@/lib/format";
import Link from "next/link";
import type { Platform } from "@/lib/types";

type SP = Record<string, string | string[] | undefined>;

// ---------------------------------------------------------------------------
// Página de canal pago (Google Ads ou Meta Ads) com as métricas padrão do
// tráfego: investimento, impressões, cliques, CTR, CPC, conversões e custo
// por conversão — com filtro por campanha. Sem ROAS (decisão do usuário).
// ---------------------------------------------------------------------------
export async function ChannelPage({
  platform,
  title,
  subtitle,
  searchParams,
  extra,
}: {
  platform: Platform;
  title: string;
  subtitle: string;
  searchParams: SP;
  // Seções extras específicas do canal (ex.: detalhamento do Google Ads).
  extra?: React.ReactNode;
}) {
  const { range } = rangeFromSearch(searchParams);
  const prev = previousRange(range);
  const clients = await getClients();
  const client = resolveClient(clients, searchParams.client);
  const accountExternalId = Array.isArray(searchParams.account)
    ? searchParams.account[0]
    : searchParams.account;

  const [adsAll, adsPrevAll, campaignList] = await Promise.all([
    getAdMetrics(range, client?.id, [platform], accountExternalId),
    getAdMetrics(prev, client?.id, [platform], accountExternalId),
    getAdCampaigns(client?.id, platform),
  ]);

  // Lista de campanhas pro filtro: usa o status coletado; se não houver, cai
  // pros nomes que aparecem nas métricas (status desconhecido).
  const campaignOptions =
    campaignList.length > 0
      ? campaignList
      : [...new Set(adsAll.map((r) => r.campaign))]
          .sort()
          .map((campaign) => ({ campaign, status: "UNKNOWN" }));

  // Filtro multi (?campaign= repetível). Nenhuma selecionada = todas.
  const filter = selectedCampaigns(searchParams, campaignOptions);
  const ads = filter.size
    ? adsAll.filter((r) => filter.has(r.campaign))
    : adsAll;
  const adsPrev = filter.size
    ? adsPrevAll.filter((r) => filter.has(r.campaign))
    : adsPrevAll;

  const k = adKpis(ads);
  const kPrev = adKpis(adsPrev);
  const byDay = adByDay(ads);
  const campaigns = adByCampaign(ads);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={`${subtitle} · ${client ? client.name : "Todos os clientes"}`}
        actions={
          campaignOptions.length > 0 ? (
            <CampaignFilter campaigns={campaignOptions} />
          ) : undefined
        }
      />

      {adsAll.length === 0 ? (
        <EmptyState
          icon={PlugZap}
          title={`Ainda não há dados de ${title} neste período`}
          description={
            <>
              Confira se a conta está conectada em{" "}
              <Link
                href="/clientes"
                className="font-semibold text-brand-ink underline"
              >
                Integrações
              </Link>{" "}
              ou selecione outro período/cliente acima.
            </>
          }
        />
      ) : (
        <>
          {/* Como ler: o funil de tráfego em 1 linha */}
          <div className="card flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-3 text-sm text-faint">
            <span className="font-bold uppercase tracking-wide text-[11px] text-brand">
              Como ler
            </span>
            <span>
              o anúncio <b className="font-semibold text-ink">aparece</b> pra pessoas (Impressões)
            </span>
            <span className="text-brand">→</span>
            <span>
              algumas <b className="font-semibold text-ink">clicam</b> (Cliques)
            </span>
            <span className="text-brand">→</span>
            <span>
              algumas viram <b className="font-semibold text-ink">contato</b> (Conversões)
            </span>
            <span className="w-full text-xs text-faint sm:ml-auto sm:w-auto">
              passe o mouse no “?” de cada número pra entender · setas = variação vs. período anterior
            </span>
          </div>

          {/* Volume: quanto rodou e o que gerou */}
          <div
            className={`grid grid-cols-2 gap-4 ${
              platform === "meta" ? "xl:grid-cols-5" : "xl:grid-cols-4"
            }`}
          >
            <KpiCard
              label="Investimento"
              value={fmtCurrency(k.spend)}
              icon={DollarSign}
              hint="custo total no período"
              help="Quanto você gastou em anúncios nesse período. É o dinheiro que saiu — não o resultado."
              trend={{ value: delta(k.spend, kPrev.spend) }}
            />
            <KpiCard
              label="Impressões"
              value={fmtCompact(k.impressions)}
              icon={Eye}
              hint="vezes que o anúncio foi exibido"
              help="Quantas vezes o anúncio apareceu na tela. A mesma pessoa pode ver várias vezes, e cada exibição conta uma. (Alcance seria o nº de pessoas distintas — sempre menor.)"
              trend={{ value: delta(k.impressions, kPrev.impressions) }}
            />
            {platform === "meta" && (
              <KpiCard
                label="Alcance (acumulado)"
                value={fmtCompact(k.reach)}
                icon={Users}
                hint="pessoas alcançadas, somando os dias"
                help="Quantas pessoas diferentes viram o anúncio (o Google não informa isso). Diferente de Impressões, que conta cada exibição. Somamos por dia, então tende a ficar um pouco acima do alcance único que o Meta mostra no período."
                trend={{ value: delta(k.reach, kPrev.reach) }}
              />
            )}
            <KpiCard
              label="Cliques"
              value={fmtInt(k.clicks)}
              icon={MousePointerClick}
              hint="cliques no anúncio"
              help="Quantas vezes clicaram no anúncio pra ir ao site ou WhatsApp. Mostra interesse — mas ainda não é um contato."
              trend={{ value: delta(k.clicks, kPrev.clicks) }}
            />
            <KpiCard
              label="Conversões"
              value={fmtInt(k.conversions)}
              icon={Target}
              hint="contatos: lead, WhatsApp, formulário"
              help="O resultado que importa: contatos gerados (conversa no WhatsApp, lead, formulário, ligação). É o que o anúncio produziu de concreto."
              trend={{ value: delta(k.conversions, kPrev.conversions) }}
            />
          </div>

          {/* Eficiência: quanto custa cada resultado */}
          <div
            className={`grid grid-cols-2 gap-4 ${
              platform === "google" ? "xl:grid-cols-4" : "xl:grid-cols-3"
            }`}
          >
            <KpiCard
              label="CTR"
              value={fmtPercent(k.ctr)}
              icon={Percent}
              hint="cliques ÷ impressões"
              help="De cada 100 pessoas que viram o anúncio, quantas clicaram. Mede o quanto ele chama atenção. Acima de ~2% costuma ser bom."
              trend={{ value: delta(k.ctr, kPrev.ctr) }}
            />
            <KpiCard
              label="Custo por clique"
              value={fmtCurrencyCents(k.cpc)}
              icon={MousePointerClick}
              hint="investimento ÷ cliques"
              help="Quanto você paga, em média, cada vez que alguém clica no anúncio."
              trend={{ value: delta(k.cpc, kPrev.cpc), positiveIsGood: false }}
            />
            <KpiCard
              label="Custo por conversão"
              value={fmtCurrencyCents(k.cpl)}
              icon={Target}
              hint="investimento ÷ conversões"
              help="Quanto custa, em média, gerar um contato. Quanto MENOR, melhor — é o preço de cada resultado."
              trend={{ value: delta(k.cpl, kPrev.cpl), positiveIsGood: false }}
            />
            {platform === "google" && (
              <KpiCard
                label="Parcela de impressões"
                value={
                  k.impressionShare != null
                    ? fmtPercent(k.impressionShare)
                    : "—"
                }
                icon={Gauge}
                hint="% das buscas em que o anúncio apareceu"
              help="De todas as buscas em que seu anúncio PODERIA ter aparecido, em quantas % ele apareceu. Baixo = perdendo espaço por orçamento ou lance baixo."
              />
            )}
          </div>

          {/* Evolução no período */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Investimento por dia"
                subtitle="Quanto foi gasto a cada dia"
              />
              <CardBody>
                <TrendAreaChart
                  data={byDay}
                  yFormat="compact"
                  series={[
                    {
                      key: "spend",
                      label: "Investimento",
                      color: CHART_COLORS.brand,
                      format: "currency",
                    },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title="Conversões por dia"
                subtitle="Leads, WhatsApp e formulários gerados"
              />
              <CardBody>
                <BarsChart
                  data={byDay}
                  dataKey="conversions"
                  name="Conversões"
                  color={CHART_COLORS.teal}
                  format="int"
                  yFormat="compact"
                />
              </CardBody>
            </Card>
          </div>

          {/* Desempenho por campanha */}
          <Card>
            <CardHeader
              title="Suas campanhas"
              subtitle={`${campaigns.length} campanha${campaigns.length === 1 ? "" : "s"} no período`}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                    <th className="px-5 py-3">Campanha</th>
                    <th className="px-3 py-3 text-right">Investido</th>
                    <th className="px-3 py-3 text-right">Impressões</th>
                    <th className="px-3 py-3 text-right">Cliques</th>
                    <th className="px-3 py-3 text-right">CTR</th>
                    <th className="px-3 py-3 text-right">CPC</th>
                    <th className="px-3 py-3 text-right">Conversões</th>
                    <th className="px-5 py-3 text-right">Custo/conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr
                      key={`${c.platform}-${c.campaign}`}
                      className="border-b border-line last:border-0 transition-colors hover:bg-surface-2"
                    >
                      <td className="px-5 py-3 font-semibold text-ink">
                        {c.campaign}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-ink">
                        {fmtCurrency(c.spend)}
                      </td>
                      <td className="px-3 py-3 text-right text-muted">
                        {fmtCompact(c.impressions)}
                      </td>
                      <td className="px-3 py-3 text-right text-muted">
                        {fmtInt(c.clicks)}
                      </td>
                      <td className="px-3 py-3 text-right text-muted">
                        {fmtPercent(c.ctr)}
                      </td>
                      <td className="px-3 py-3 text-right text-muted">
                        {fmtCurrencyCents(c.cpc)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-ink">
                        {fmtInt(c.conversions)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted">
                        {fmtCurrencyCents(c.cpl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Seções extras do canal (detalhamento) */}
          {extra}
        </>
      )}
    </div>
  );
}
