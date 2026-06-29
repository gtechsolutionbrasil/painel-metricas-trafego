import { Clock, FileText, MousePointer2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { CHART_COLORS } from "@/components/charts/theme";
import { getWebMetrics, getClients, resolveClient } from "@/lib/metrics/queries";
import { webByDay, webBySource, webKpis } from "@/lib/metrics/aggregate";
import { rangeFromSearch } from "@/lib/range";
import { fmtCompact, fmtDuration, fmtInt, fmtPercent, fmtDecimal } from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const { range } = rangeFromSearch(sp);
  const clients = await getClients();
  const client = resolveClient(clients, sp.client);
  const accountExternalId = Array.isArray(sp.account) ? sp.account[0] : sp.account;

  const web = await getWebMetrics(range, client?.id, accountExternalId);
  const w = webKpis(web);
  const byDay = webByDay(web);
  const sources = webBySource(web);
  const donut = sources
    .slice(0, 6)
    .map((s) => ({ label: `${s.source} / ${s.medium}`, value: s.sessions }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics web"
        subtitle={`Google Analytics 4 · ${client ? client.name : "Todos os clientes"}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Sessões" value={fmtInt(w.sessions)} icon={MousePointer2} />
        <KpiCard label="Usuários" value={fmtInt(w.users)} icon={Users} />
        <KpiCard label="Pageviews" value={fmtCompact(w.pageviews)} icon={FileText} />
        <KpiCard
          label="Pág./sessão"
          value={fmtDecimal(w.pagesPerSession)}
          icon={FileText}
        />
        <KpiCard
          label="Taxa rejeição"
          value={fmtPercent(w.bounceRate)}
          icon={MousePointer2}
        />
        <KpiCard
          label="Duração média"
          value={fmtDuration(w.avgDuration)}
          icon={Clock}
        />
      </div>

      {/* Tendência + origem */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Sessões × Usuários" subtitle="Evolução diária no período" />
          <CardBody>
            <TrendAreaChart
              data={byDay}
              yFormat="compact"
              series={[
                {
                  key: "sessions",
                  label: "Sessões",
                  color: CHART_COLORS.brand,
                  format: "int",
                },
                {
                  key: "users",
                  label: "Usuários",
                  color: CHART_COLORS.sky,
                  format: "int",
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Origem das sessões" subtitle="Canais de aquisição" />
          <CardBody>
            <DonutChart data={donut} />
          </CardBody>
        </Card>
      </div>

      {/* Tabela de origens */}
      <Card>
        <CardHeader
          title="Detalhe por origem / mídia"
          subtitle={`${sources.length} canais no período`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                <th className="px-5 py-3">Origem / Mídia</th>
                <th className="px-3 py-3 text-right">Sessões</th>
                <th className="px-3 py-3 text-right">Usuários</th>
                <th className="px-5 py-3 text-right">Participação</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr
                  key={`${s.source}-${s.medium}`}
                  className="border-b border-line last:border-0 transition-colors hover:bg-surface-2"
                >
                  <td className="px-5 py-3 font-semibold text-ink">
                    {s.source}{" "}
                    <span className="font-normal text-faint">/ {s.medium}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">
                    {fmtInt(s.sessions)}
                  </td>
                  <td className="px-3 py-3 text-right text-muted">
                    {fmtInt(s.users)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${Math.max(3, s.share * 100)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-semibold text-muted">
                        {fmtPercent(s.share)}
                      </span>
                    </div>
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
