import {
  DollarSign,
  Eye,
  MousePointerClick,
  Percent,
  PlugZap,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { CHART_COLORS } from "@/components/charts/theme";
import { getAdMetrics, getClients, resolveClient } from "@/lib/metrics/queries";
import { adByCampaign, adByDay, adKpis } from "@/lib/metrics/aggregate";
import { delta, previousRange, rangeFromSearch } from "@/lib/range";
import {
  fmtCompact,
  fmtCurrency,
  fmtCurrencyCents,
  fmtInt,
  fmtMultiplier,
  fmtPercent,
} from "@/lib/format";
import type { Platform } from "@/lib/types";

type SP = Record<string, string | string[] | undefined>;

// ---------------------------------------------------------------------------
// Página de canal pago (Google ou Meta) com linguagem simples:
// investimento, cliques, contatos gerados, retorno.
// ---------------------------------------------------------------------------
export async function ChannelPage({
  platform,
  title,
  subtitle,
  searchParams,
}: {
  platform: Platform;
  title: string;
  subtitle: string;
  searchParams: SP;
}) {
  const { range } = rangeFromSearch(searchParams);
  const prev = previousRange(range);
  const clients = await getClients();
  const client = resolveClient(clients, searchParams.client);
  const accountExternalId = Array.isArray(searchParams.account)
    ? searchParams.account[0]
    : searchParams.account;

  const [ads, adsPrev] = await Promise.all([
    getAdMetrics(range, client?.id, [platform], accountExternalId),
    getAdMetrics(prev, client?.id, [platform], accountExternalId),
  ]);
  const k = adKpis(ads);
  const kPrev = adKpis(adsPrev);
  const byDay = adByDay(ads);
  const campaigns = adByCampaign(ads);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={`${subtitle} · ${client ? client.name : "Todos os clientes"}`}
      />

      {ads.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
              <PlugZap size={22} />
            </span>
            <p className="text-base font-bold text-ink">
              Ainda não há dados de {title} neste período
            </p>
            <p className="max-w-md text-sm text-muted">
              Confira se a conta está conectada em{" "}
              <Link href="/clientes" className="font-semibold text-brand-ink underline">
                Integrações
              </Link>{" "}
              ou selecione outro período/cliente acima.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* O que importa primeiro: quanto investiu e o que voltou */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard
              label="Investimento"
              value={fmtCurrency(k.spend)}
              icon={DollarSign}
              hint="quanto foi gasto em anúncios"
              trend={{ value: delta(k.spend, kPrev.spend) }}
            />
            <KpiCard
              label="Cliques"
              value={fmtInt(k.clicks)}
              icon={MousePointerClick}
              hint="pessoas que clicaram no anúncio"
              trend={{ value: delta(k.clicks, kPrev.clicks) }}
            />
            <KpiCard
              label="Contatos gerados"
              value={fmtInt(k.conversions)}
              icon={Target}
              hint="leads, conversas ou vendas"
              trend={{ value: delta(k.conversions, kPrev.conversions) }}
            />
            <KpiCard
              label="Retorno"
              value={fmtMultiplier(k.roas)}
              icon={TrendingUp}
              hint="R$ que voltou por R$ investido"
              trend={{ value: delta(k.roas, kPrev.roas) }}
            />
          </div>

          {/* Detalhes de eficiência */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard
              label="Vezes exibido"
              value={fmtCompact(k.impressions)}
              icon={Eye}
              hint="quantas vezes o anúncio apareceu"
            />
            <KpiCard
              label="Taxa de cliques"
              value={fmtPercent(k.ctr)}
              icon={Percent}
              hint="% de quem viu e clicou"
            />
            <KpiCard
              label="Custo por clique"
              value={fmtCurrencyCents(k.cpc)}
              icon={MousePointerClick}
            />
            <KpiCard
              label="Custo por contato"
              value={fmtCurrencyCents(k.cpl)}
              icon={Target}
            />
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
                title="Contatos por dia"
                subtitle="Leads, conversas ou vendas geradas"
              />
              <CardBody>
                <BarsChart
                  data={byDay}
                  dataKey="conversions"
                  name="Contatos"
                  color={CHART_COLORS.teal}
                  format="int"
                  yFormat="compact"
                />
              </CardBody>
            </Card>
          </div>

          {/* Campanhas em linguagem simples */}
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
                    <th className="px-3 py-3 text-right">Vezes exibido</th>
                    <th className="px-3 py-3 text-right">Cliques</th>
                    <th className="px-3 py-3 text-right">Custo por clique</th>
                    <th className="px-3 py-3 text-right">Contatos</th>
                    <th className="px-3 py-3 text-right">Custo por contato</th>
                    <th className="px-5 py-3 text-right">Retorno</th>
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
                        {fmtCurrencyCents(c.cpc)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-ink">
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
        </>
      )}
    </div>
  );
}
