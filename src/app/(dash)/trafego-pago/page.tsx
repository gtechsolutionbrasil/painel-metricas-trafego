import {
  DollarSign,
  Eye,
  MousePointerClick,
  Percent,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { CHART_COLORS } from "@/components/charts/theme";
import {
  getAdMetrics,
  getClients,
  platformsFromSearch,
  resolveClient,
} from "@/lib/metrics/queries";
import {
  adByCampaign,
  adByDay,
  adByPlatform,
  adKpis,
} from "@/lib/metrics/aggregate";
import { rangeFromSearch } from "@/lib/range";
import {
  fmtCompact,
  fmtCurrency,
  fmtCurrencyCents,
  fmtInt,
  fmtMultiplier,
  fmtPercent,
} from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function TrafegoPagoPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const { range } = rangeFromSearch(sp);
  const clients = await getClients();
  const client = resolveClient(clients, sp.client);
  const platformsFilter = platformsFromSearch(sp.platform);
  const accountExternalId = Array.isArray(sp.account) ? sp.account[0] : sp.account;

  const ads = await getAdMetrics(
    range,
    client?.id,
    platformsFilter,
    accountExternalId,
  );
  const k = adKpis(ads);
  const byDay = adByDay(ads);
  const campaigns = adByCampaign(ads);
  const platforms = adByPlatform(ads).map((p) => ({
    label: p.label,
    value: p.spend,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tráfego pago"
        subtitle={`${platformLabel(platformsFilter)} · ${client ? client.name : "Todos os clientes"}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Investimento" value={fmtCurrency(k.spend)} icon={DollarSign} />
        <KpiCard label="Impressões" value={fmtCompact(k.impressions)} icon={Eye} />
        <KpiCard label="Cliques" value={fmtInt(k.clicks)} icon={MousePointerClick} />
        <KpiCard label="Conversões" value={fmtInt(k.conversions)} icon={Target} />
        <KpiCard label="CTR" value={fmtPercent(k.ctr)} icon={Percent} hint="taxa de cliques" />
        <KpiCard label="CPC" value={fmtCurrencyCents(k.cpc)} icon={MousePointerClick} hint="custo por clique" />
        <KpiCard label="CPL" value={fmtCurrencyCents(k.cpl)} icon={Target} hint="custo por conversão" />
        <KpiCard label="ROAS" value={fmtMultiplier(k.roas)} icon={TrendingUp} hint="retorno" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Investimento por dia" subtitle="Evolução diária do gasto em mídia" />
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
          <CardHeader title="Investimento por plataforma" subtitle="Participação no gasto" />
          <CardBody>
            <DonutChart data={platforms} centerLabel="Total" format="currency" />
          </CardBody>
        </Card>
      </div>

      {/* Tabela de campanhas */}
      <Card>
        <CardHeader
          title="Desempenho por campanha"
          subtitle={`${campaigns.length} campanhas no período`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                <th className="px-5 py-3">Campanha</th>
                <th className="px-3 py-3 text-right">Investido</th>
                <th className="px-3 py-3 text-right">Impressões</th>
                <th className="px-3 py-3 text-right">Cliques</th>
                <th className="px-3 py-3 text-right">CTR</th>
                <th className="px-3 py-3 text-right">CPC</th>
                <th className="px-3 py-3 text-right">Conv.</th>
                <th className="px-3 py-3 text-right">CPL</th>
                <th className="px-5 py-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={`${c.platform}-${c.campaign}`}
                  className="border-b border-line last:border-0 transition-colors hover:bg-surface-2"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background:
                            c.platform === "meta"
                              ? CHART_COLORS.brand
                              : CHART_COLORS.teal,
                        }}
                      />
                      <div>
                        <p className="font-semibold text-ink">{c.campaign}</p>
                        <p className="text-xs text-faint">{c.label}</p>
                      </div>
                    </div>
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
                  <td className="px-3 py-3 text-right text-muted">
                    {fmtInt(c.conversions)}
                  </td>
                  <td className="px-3 py-3 text-right text-muted">
                    {fmtCurrencyCents(c.cpl)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`font-bold ${
                        c.roas >= 1 ? "text-brand-ink" : "text-[#991b1b]"
                      }`}
                    >
                      {fmtMultiplier(c.roas)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function platformLabel(platforms?: ReturnType<typeof platformsFromSearch>) {
  if (!platforms?.length) return "Meta Ads + Google Ads";
  return platforms[0] === "google" ? "Google Ads" : "Meta Ads";
}
