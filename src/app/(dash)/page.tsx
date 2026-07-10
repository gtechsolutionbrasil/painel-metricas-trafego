import Link from "next/link";
import {
  ArrowRight,
  DollarSign,
  Globe,
  MousePointerClick,
  PlugZap,
  Search,
  Share2,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { CHART_COLORS } from "@/components/charts/theme";
import {
  getAdMetrics,
  getWebMetrics,
  getClients,
  resolveClient,
} from "@/lib/metrics/queries";
import { adByPlatform, adKpis, webKpis } from "@/lib/metrics/aggregate";
import { previousRange, rangeFromSearch, delta } from "@/lib/range";
import { fmtCurrency, fmtCurrencyCents, fmtInt } from "@/lib/format";

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
  const accountExternalId = Array.isArray(sp.account) ? sp.account[0] : sp.account;

  const [ads, adsPrev, web, webPrev] = await Promise.all([
    getAdMetrics(range, cid, undefined, accountExternalId),
    getAdMetrics(prev, cid, undefined, accountExternalId),
    getWebMetrics(range, cid, accountExternalId),
    getWebMetrics(prev, cid, accountExternalId),
  ]);

  const k = adKpis(ads);
  const kPrev = adKpis(adsPrev);
  const w = webKpis(web);
  const wPrev = webKpis(webPrev);

  const platforms = adByPlatform(ads);
  const google = platforms.find((p) => p.platform === "google");
  const meta = platforms.find((p) => p.platform === "meta");

  // Série diária POR CANAL (Google × Meta lado a lado). A Visão geral compara
  // canais — o detalhe de cada um vive em /google e /meta, sem repetir gráfico.
  const byDayPlatform = (() => {
    const map = new Map<
      string,
      { date: string; google: number; meta: number; googleConv: number; metaConv: number }
    >();
    for (const r of ads) {
      const p =
        map.get(r.date) ??
        { date: r.date, google: 0, meta: 0, googleConv: 0, metaConv: 0 };
      if (r.platform === "google") {
        p.google += r.spend;
        p.googleConv += r.conversions;
      } else {
        p.meta += r.spend;
        p.metaConv += r.conversions;
      }
      map.set(r.date, p);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        subtitle={`Resumo de todos os canais · ${client ? client.name : "Todos os clientes"}`}
      />

      {/* O essencial do período */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="Investimento"
          value={fmtCurrency(k.spend)}
          icon={DollarSign}
          hint="total em anúncios"
          trend={{ value: delta(k.spend, kPrev.spend) }}
        />
        <KpiCard
          label="Conversões"
          value={fmtInt(k.conversions)}
          icon={Target}
          hint="contatos: lead, WhatsApp, formulário"
          trend={{ value: delta(k.conversions, kPrev.conversions) }}
        />
        <KpiCard
          label="Custo por conversão"
          value={fmtCurrencyCents(k.cpl)}
          icon={MousePointerClick}
          hint="investimento ÷ conversões"
          trend={{ value: delta(k.cpl, kPrev.cpl), positiveIsGood: false }}
        />
        <KpiCard
          label="Visitas no site"
          value={fmtInt(w.sessions)}
          icon={Globe}
          trend={{ value: delta(w.sessions, wPrev.sessions) }}
        />
      </div>

      {/* Um card por canal, clicável */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChannelSummary
          href="/google"
          sp={sp}
          icon={<Search size={17} />}
          name="Google Ads"
          description="Anúncios na pesquisa"
          headline={google ? fmtCurrency(google.spend) : "—"}
          detail={google ? platformDetail(google) : "Sem dados no período"}
        />
        <ChannelSummary
          href="/meta"
          sp={sp}
          icon={<Share2 size={17} />}
          name="Meta Ads"
          description="Facebook e Instagram"
          headline={meta ? fmtCurrency(meta.spend) : "—"}
          detail={meta ? platformDetail(meta) : "Sem dados no período"}
        />
        <ChannelSummary
          href="/site"
          sp={sp}
          icon={<Globe size={17} />}
          name="Sites"
          description="Visitas e comportamento"
          headline={fmtInt(w.sessions)}
          detail={
            w.sessions
              ? `${fmtInt(w.users)} visitantes no período`
              : "Sem dados no período"
          }
        />
      </div>

      {/* Evolução do período */}
      {ads.length === 0 && web.length === 0 ? (
        <EmptyState
          icon={PlugZap}
          title="Ainda não há dados neste período"
          description={
            <>
              Confira se as contas estão conectadas em{" "}
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Investimento por canal"
              subtitle="Google × Meta, dia a dia — onde o dinheiro está indo"
            />
            <CardBody>
              <TrendAreaChart
                data={byDayPlatform}
                yFormat="compact"
                series={[
                  {
                    key: "google",
                    label: "Google Ads",
                    color: CHART_COLORS.sky,
                    format: "currency",
                  },
                  {
                    key: "meta",
                    label: "Meta Ads",
                    color: CHART_COLORS.indigo,
                    format: "currency",
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Conversões por canal"
              subtitle="Google × Meta, dia a dia — qual canal gera mais contato"
            />
            <CardBody>
              <TrendAreaChart
                data={byDayPlatform}
                yFormat="compact"
                series={[
                  {
                    key: "googleConv",
                    label: "Google Ads",
                    color: CHART_COLORS.sky,
                    format: "int",
                  },
                  {
                    key: "metaConv",
                    label: "Meta Ads",
                    color: CHART_COLORS.indigo,
                    format: "int",
                  },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

// Resumo do canal: conversões e custo por conversão (sem ROAS, a pedido).
function platformDetail(p: { conversions: number; spend: number }) {
  const conv = `${fmtInt(p.conversions)} conversões`;
  if (!p.conversions) return conv;
  return `${conv} · ${fmtCurrencyCents(p.spend / p.conversions)} por conversão`;
}

// Card-resumo de um canal, leva pra página dedicada mantendo os filtros.
function ChannelSummary({
  href,
  sp,
  icon,
  name,
  description,
  headline,
  detail,
}: {
  href: string;
  sp: Record<string, string | string[] | undefined>;
  icon: React.ReactNode;
  name: string;
  description: string;
  headline: string;
  detail: string;
}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    // "deleted" é feedback efêmero da exclusão de cliente — não propagar.
    if (typeof value === "string" && key !== "deleted") qs.set(key, value);
  }
  const suffix = qs.size ? `?${qs}` : "";

  return (
    <Link
      href={`${href}${suffix}`}
      className="group rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card,0_1px_2px_rgba(16,24,40,0.06))] transition-all hover:-translate-y-0.5 hover:border-brand-border hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            {icon}
          </span>
          <div>
            <p className="text-sm font-bold text-ink">{name}</p>
            <p className="text-xs text-faint">{description}</p>
          </div>
        </div>
        <Badge variant="neutral">
          <span className="inline-flex items-center gap-1">
            Ver detalhes
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Badge>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
        {headline}
      </p>
      <p className="mt-0.5 text-xs text-muted">{detail}</p>
    </Link>
  );
}
