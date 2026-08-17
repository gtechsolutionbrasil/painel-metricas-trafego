import {
  CircleAlert,
  Clock,
  FileText,
  MessageCircleMore,
  MousePointer2,
  PlugZap,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { CHART_COLORS } from "@/components/charts/theme";
import {
  getClients,
  getWebEvents,
  getWebMetrics,
  getWebPages,
  resolveClient,
} from "@/lib/metrics/queries";
import { webByDay, webBySource, webKpis } from "@/lib/metrics/aggregate";
import { summarizeWebEvents } from "@/lib/metrics/results";
import {
  COMPARE_TITLES,
  compareFromSearch,
  comparisonRange,
  delta,
  rangeFromSearch,
} from "@/lib/range";
import {
  fmtCompact,
  fmtDecimal,
  fmtDuration,
  fmtInt,
  fmtPercent,
} from "@/lib/format";
import type { WebMetric } from "@/lib/types";

type SP = Promise<Record<string, string | string[] | undefined>>;

function friendlyOrigin(source: string, medium: string) {
  if (source === "(direct)" || medium === "(none)") return "Acesso direto";
  if (medium === "organic") return `Busca no ${cap(source)}`;
  if (medium === "cpc" || medium === "paid") return `Anúncio (${cap(source)})`;
  if (medium === "referral") return `Indicação de ${source}`;
  if (
    source.includes("not set") ||
    source.includes("data not available") ||
    medium.includes("not set")
  ) {
    return "Origem não identificada";
  }
  return `${cap(source)} / ${medium}`;
}

const cap = (value: string) =>
  value ? value[0].toUpperCase() + value.slice(1) : value;

export default async function SitePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { range } = rangeFromSearch(sp);
  const cmp = compareFromSearch(sp);
  // null = "sem comparação": pula as buscas do período anterior e as pílulas.
  const prev = comparisonRange(range, cmp);
  const trendTitle = cmp === "none" ? undefined : COMPARE_TITLES[cmp];
  const clients = await getClients();
  const client = resolveClient(clients, sp.client);
  const accountExternalId = first(sp.account);

  const [web, pages, events, webPrev, eventsPrev] = await Promise.all([
    getWebMetrics(range, client?.id, accountExternalId),
    getWebPages(range, client?.id, accountExternalId),
    getWebEvents(range, client?.id, accountExternalId),
    prev ? getWebMetrics(prev, client?.id, accountExternalId) : Promise.resolve([]),
    prev ? getWebEvents(prev, client?.id, accountExternalId) : Promise.resolve([]),
  ]);
  const kpis = webKpis(web);
  const kpisPrev = webKpis(webPrev);
  const byDay = webByDay(web);
  const sources = webBySource(web);
  const eventSummary = summarizeWebEvents(events);
  const eventSummaryPrev = summarizeWebEvents(eventsPrev);
  const unknownShare = unknownTrafficShare(web);
  // Pílula só quando há base de comparação E dados no período comparado.
  const siteTrend = (
    current: number,
    previous: number,
    positiveIsGood = true,
  ) =>
    prev && webPrev.length
      ? { value: delta(current, previous), positiveIsGood, title: trendTitle }
      : undefined;

  const topPages = (kind: "landing" | "view") => {
    const map = new Map<string, number>();
    for (const page of pages) {
      if (page.kind !== kind) continue;
      const value = kind === "landing" ? page.sessions : page.views;
      map.set(page.page, (map.get(page.page) ?? 0) + value);
    }
    const rows = [...map.entries()]
      .map(([page, value]) => ({ page, value }))
      .sort((a, b) => b.value - a.value);
    return {
      rows: rows.slice(0, 8),
      total: rows.reduce((sum, row) => sum + row.value, 0),
    };
  };
  const landing = topPages("landing");
  const viewed = topPages("view");
  const donut = sources.slice(0, 6).map((source) => ({
    label: friendlyOrigin(source.source, source.medium),
    value: source.sessions,
  }));

  if (web.length === 0 && events.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Site e eventos"
          subtitle={`Tráfego recebido pelo GA4 · ${client ? client.name : "Todos os clientes"}`}
        />
        <EmptyState
          icon={PlugZap}
          title="Ainda não há dados do site neste período"
          description={
            <>
              Confira a coleta do GA4 em{" "}
              <Link href="/clientes" className="font-semibold text-brand-ink underline">
                Integrações
              </Link>{" "}
              ou selecione outro período/cliente.
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site e eventos"
        subtitle={`Sessões, páginas e ações recebidas pelo GA4 · ${client ? client.name : "Todos os clientes"}`}
      />

      {unknownShare >= 0.1 && (
        <div className="flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
          <p>
            <strong>{fmtPercent(unknownShare)} das sessões estão sem origem confiável.</strong>{" "}
            Padronize UTMs e revise consentimento/cross-domain antes de comparar campanhas pelo GA4.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Sessões"
          value={fmtInt(kpis.sessions)}
          icon={MousePointer2}
          tone="sky"
          trend={siteTrend(kpis.sessions, kpisPrev.sessions)}
          caption="Visitas registradas"
          help="Uma mesma pessoa pode gerar mais de uma sessão."
        />
        <KpiCard
          label="Páginas vistas"
          value={fmtCompact(kpis.pageviews)}
          icon={FileText}
          tone="indigo"
          trend={siteTrend(kpis.pageviews, kpisPrev.pageviews)}
          caption="Visualizações de página"
        />
        <KpiCard
          label="Páginas por sessão"
          value={fmtDecimal(kpis.pagesPerSession)}
          icon={FileText}
          tone="brand"
          trend={siteTrend(kpis.pagesPerSession, kpisPrev.pagesPerSession)}
          help="Páginas vistas ÷ sessões. Valor abaixo de 1 indica inconsistência na coleta agregada."
        />
        <KpiCard
          label="Taxa de rejeição"
          value={fmtPercent(kpis.bounceRate)}
          icon={MousePointer2}
          tone="rose"
          trend={siteTrend(kpis.bounceRate, kpisPrev.bounceRate, false)}
          help="Percentual de sessões não engajadas conforme a definição do GA4."
        />
        <KpiCard
          label="Tempo médio"
          value={fmtDuration(kpis.avgDuration)}
          icon={Clock}
          tone="amber"
          trend={siteTrend(kpis.avgDuration, kpisPrev.avgDuration)}
          caption="Por sessão"
        />
        <KpiCard
          label="Eventos de contato"
          value={events.length ? fmtInt(eventSummary.primary) : "Aguardando"}
          icon={MessageCircleMore}
          tone="brand"
          trend={
            prev && events.length && eventsPrev.length
              ? { value: delta(eventSummary.primary, eventSummaryPrev.primary), title: trendTitle }
              : undefined
          }
          caption="WhatsApp + formulário + ligação"
          help="Eventos recebidos no GA4. Não significam pessoas únicas e devem ser confirmados no CRM."
        />
      </div>

      <Card>
        <CardHeader
          title="Ações importantes no site"
          subtitle="Eventos técnicos traduzidos para decisões — contato e intenção local ficam separados"
        />
        {eventSummary.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                  <th className="px-5 py-3">Ação</th>
                  <th className="px-3 py-3">Classificação</th>
                  <th className="px-3 py-3 text-right">Eventos</th>
                  <th className="px-5 py-3 text-right">Eventos-chave GA4</th>
                </tr>
              </thead>
              <tbody>
                {eventSummary.rows.map((row) => (
                  <tr key={row.eventName} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-ink">{row.label}</p>
                      <p className="font-mono text-xs text-faint">{row.eventName}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={row.bucket === "primary" ? "brand" : row.bucket === "local_intent" ? "warning" : "neutral"}>
                        {row.bucket === "primary" ? "Contato" : row.bucket === "local_intent" ? "Intenção local" : "Microevento"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-ink">{fmtInt(row.count)}</td>
                    <td className="px-5 py-3 text-right text-muted">{fmtInt(row.keyEvents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-5 py-5 text-sm text-muted">
            <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            <p>
              A coleta atual ainda não importa eventos. O workflow GA4 atualizado já está sendo preparado; depois da aprovação aparecerão <code>whatsapp_click</code>, <code>generate_lead</code>, <code>phone_click</code> e <code>route_click</code>.
            </p>
          </div>
        )}
      </Card>

      {web.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Tráfego por dia"
                subtitle="Sessões e páginas vistas — sem alegar usuários únicos"
              />
              <CardBody>
                <TrendAreaChart
                  data={byDay}
                  yFormat="compact"
                  series={[
                    { key: "sessions", label: "Sessões", color: CHART_COLORS.sky, format: "int" },
                    { key: "pageviews", label: "Páginas vistas", color: CHART_COLORS.indigo, format: "int" },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="De onde vêm as sessões" subtitle="Principais origens no período" />
              <CardBody>
                <DonutChart data={donut} />
              </CardBody>
            </Card>
          </div>

          {(landing.rows.length > 0 || viewed.rows.length > 0) && (
            <Card>
              <CardHeader
                title="Caminho agregado no site"
                subtitle="Porta de entrada à esquerda; páginas mais vistas à direita. Não é uma jornada individual."
              />
              <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-2">
                <div className="bg-surface p-4">
                  <p className="eyebrow mb-3">Por onde entraram</p>
                  <PageList rows={landing.rows} total={landing.total} unit="sessões" />
                </div>
                <div className="bg-surface p-4">
                  <p className="eyebrow mb-3">Páginas mais vistas</p>
                  <PageList rows={viewed.rows} total={viewed.total} unit="visualizações" />
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Origens das sessões" subtitle={`${sources.length} origens no período`} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                    <th className="px-5 py-3">Origem</th>
                    <th className="px-3 py-3 text-right">Sessões</th>
                    <th className="px-5 py-3 text-right">Participação</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={`${source.source}-${source.medium}`} className="border-b border-line last:border-0 hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-ink">{friendlyOrigin(source.source, source.medium)}</p>
                        <p className="text-xs text-faint">{source.source} / {source.medium}</p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-ink">{fmtInt(source.sessions)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                            <div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.max(3, source.share * 100)}%` }} />
                          </div>
                          <span className="w-12 text-right font-semibold text-muted">{fmtPercent(source.share)}</span>
                        </div>
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

function PageList({
  rows,
  total,
  unit,
}: {
  rows: Array<{ page: string; value: number }>;
  total: number;
  unit: string;
}) {
  if (!rows.length) {
    return <p className="px-2 py-6 text-center text-xs text-faint">Sem dados no período.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const share = total ? row.value / total : 0;
        return (
          <li key={row.page}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate font-mono text-xs text-ink" title={row.page}>{row.page}</span>
              <span className="shrink-0 text-xs text-muted">
                <b className="text-ink">{fmtInt(row.value)}</b> {unit} · {fmtPercent(share)}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-surface-2">
              <div className="h-1.5 rounded-full bg-sky-600" style={{ width: `${Math.max(share * 100, 2)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function unknownTrafficShare(rows: WebMetric[]) {
  const total = rows.reduce((sum, row) => sum + row.sessions, 0);
  const unknown = rows
    .filter((row) => {
      const source = row.source.toLowerCase();
      const medium = row.medium.toLowerCase();
      return source.includes("not set") || source.includes("data not available") || medium.includes("not set");
    })
    .reduce((sum, row) => sum + row.sessions, 0);
  return total ? unknown / total : 0;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
