import {
  DollarSign,
  Globe,
  MousePointerClick,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { CHART_COLORS } from "@/components/charts/theme";
import { getAdMetrics, getWebMetrics, getClients, resolveClient } from "@/lib/metrics/queries";
import {
  adByDay,
  adByPlatform,
  adKpis,
  webBySource,
  webKpis,
} from "@/lib/metrics/aggregate";
import { previousRange, rangeFromSearch, delta } from "@/lib/range";
import {
  fmtCurrency,
  fmtCurrencyCents,
  fmtInt,
  fmtMultiplier,
} from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const { range } = rangeFromSearch(sp);
  const prev = previousRange(range);

  const clients = await getClients();
  const client = resolveClient(clients, sp.client);
  const cid = client?.id;

  const [ads, adsPrev, web, webPrev] = await Promise.all([
    getAdMetrics(range, cid),
    getAdMetrics(prev, cid),
    getWebMetrics(range, cid),
    getWebMetrics(prev, cid),
  ]);

  const k = adKpis(ads);
  const kPrev = adKpis(adsPrev);
  const w = webKpis(web);
  const wPrev = webKpis(webPrev);

  const byDay = adByDay(ads);
  const platforms = adByPlatform(ads);
  const sources = webBySource(web)
    .slice(0, 6)
    .map((s) => ({ label: `${s.source} / ${s.medium}`, value: s.sessions }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        subtitle={`${client ? client.name : "Todos os clientes"} · últimos ${range.from === range.to ? "1 dia" : `${(byDay.length || 0)} dias`}`}
      />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Investimento"
          value={fmtCurrency(k.spend)}
          icon={DollarSign}
          trend={{ value: delta(k.spend, kPrev.spend) }}
        />
        <KpiCard
          label="Conversões"
          value={fmtInt(k.conversions)}
          icon={Target}
          trend={{ value: delta(k.conversions, kPrev.conversions) }}
        />
        <KpiCard
          label="CPL médio"
          value={fmtCurrencyCents(k.cpl)}
          icon={MousePointerClick}
          hint="custo por conversão"
          trend={{ value: delta(k.cpl, kPrev.cpl), positiveIsGood: false }}
        />
        <KpiCard
          label="ROAS"
          value={fmtMultiplier(k.roas)}
          icon={TrendingUp}
          hint="retorno sobre investimento"
          trend={{ value: delta(k.roas, kPrev.roas) }}
        />
        <KpiCard
          label="Sessões (web)"
          value={fmtInt(w.sessions)}
          icon={Globe}
          trend={{ value: delta(w.sessions, wPrev.sessions) }}
        />
      </div>

      {/* Tendência + plataformas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Investimento × Receita"
            subtitle="Evolução diária no período"
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
                {
                  key: "revenue",
                  label: "Receita",
                  color: CHART_COLORS.teal,
                  format: "currency",
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Por plataforma" subtitle="Investimento e ROAS" />
          <CardBody className="space-y-4">
            {platforms.map((p) => (
              <div
                key={p.platform}
                className="rounded-xl border border-line bg-surface-2 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{p.label}</span>
                  <Badge variant="neutral" dot>
                    ROAS {fmtMultiplier(p.roas)}
                  </Badge>
                </div>
                <p className="mt-2 text-xl font-extrabold text-ink">
                  {fmtCurrency(p.spend)}
                </p>
                <p className="text-xs text-muted">
                  {fmtInt(p.conversions)} conversões · {fmtCurrency(p.revenue)}{" "}
                  em receita
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Conversões por dia + origem das sessões */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Conversões por dia"
            subtitle="Total Meta + Google no período"
          />
          <CardBody>
            <BarsChart
              data={byDay}
              dataKey="conversions"
              name="Conversões"
              color={CHART_COLORS.brand}
              format="int"
              yFormat="compact"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Origem das sessões"
            subtitle="Distribuição do tráfego web"
          />
          <CardBody>
            <DonutChart data={sources} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
