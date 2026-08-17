import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  DollarSign,
  Globe,
  MapPinned,
  MessageCircleMore,
  PhoneCall,
  PlugZap,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { CHART_COLORS } from "@/components/charts/theme";
import {
  getAdConversionActions,
  getAdMetrics,
  getClients,
  getIntegrationAccounts,
  getLeads,
  getTrackingChecks,
  getWebEvents,
  getWebMetrics,
  resolveClient,
} from "@/lib/metrics/queries";
import { adByPlatform, adKpis, webKpis } from "@/lib/metrics/aggregate";
import {
  integrationHealth,
  RESULT_LABELS,
  summarizeAdActions,
  summarizeWebEvents,
} from "@/lib/metrics/results";
import {
  COMPARE_TITLES,
  compareFromSearch,
  comparisonRange,
  delta,
  eachDayIso,
  rangeFromSearch,
} from "@/lib/range";
import { fmtCurrency, fmtInt, fmtPercent } from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function OverviewPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { range } = rangeFromSearch(sp);
  const cmp = compareFromSearch(sp);
  // null = "sem comparação": pula as buscas do período anterior e as pílulas.
  const prev = comparisonRange(range, cmp);
  const trendTitle = cmp === "none" ? undefined : COMPARE_TITLES[cmp];
  const clients = await getClients();
  const client = resolveClient(clients, sp.client);
  const cid = client?.id;
  const accountExternalId = first(sp.account);

  const [
    ads,
    adsPrev,
    web,
    googleActions,
    googleActionsPrev,
    webEvents,
    webEventsPrev,
    accounts,
    checks,
    leads,
  ] = await Promise.all([
    getAdMetrics(range, cid, undefined, accountExternalId),
    prev ? getAdMetrics(prev, cid, undefined, accountExternalId) : Promise.resolve([]),
    getWebMetrics(range, cid, accountExternalId),
    getAdConversionActions(range, cid, accountExternalId),
    prev ? getAdConversionActions(prev, cid, accountExternalId) : Promise.resolve([]),
    getWebEvents(range, cid, accountExternalId),
    prev ? getWebEvents(prev, cid, accountExternalId) : Promise.resolve([]),
    getIntegrationAccounts(cid),
    getTrackingChecks(cid),
    getLeads(range, cid),
  ]);

  const paid = adKpis(ads);
  const paidPrev = adKpis(adsPrev);
  const site = webKpis(web);
  const platforms = adByPlatform(ads);
  const platformsPrev = adByPlatform(adsPrev);
  const google = platforms.find((item) => item.platform === "google");
  const meta = platforms.find((item) => item.platform === "meta");
  const metaPrev = platformsPrev.find((item) => item.platform === "meta");
  const googleResults = summarizeAdActions(googleActions);
  const googleResultsPrev = summarizeAdActions(googleActionsPrev);
  const siteEvents = summarizeWebEvents(webEvents);
  const siteEventsPrev = summarizeWebEvents(webEventsPrev);
  const health = accounts.map((account) => integrationHealth(account, checks));
  const healthy = health.filter((item) => item.status === "healthy").length;
  const alerts = health.filter((item) => item.status !== "healthy").length;
  const unknownTraffic = unknownTrafficShare(web);

  const byDay = (() => {
    const map = new Map<
      string,
      { date: string; googleSpend: number; metaSpend: number; googleContacts: number; metaConversations: number }
    >();
    for (const row of ads) {
      const item = map.get(row.date) ?? {
        date: row.date,
        googleSpend: 0,
        metaSpend: 0,
        googleContacts: 0,
        metaConversations: 0,
      };
      if (row.platform === "google") item.googleSpend += row.spend;
      if (row.platform === "meta") {
        item.metaSpend += row.spend;
        item.metaConversations += row.conversions;
      }
      map.set(row.date, item);
    }
    for (const row of googleResults.byDay) {
      const item = map.get(row.date) ?? {
        date: row.date,
        googleSpend: 0,
        metaSpend: 0,
        googleContacts: 0,
        metaConversations: 0,
      };
      item.googleContacts += row.primary;
      map.set(row.date, item);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Séries diárias dos KPIs primários (sparklines) — mesmos dados dos
  // gráficos, com zero-fill: dia sem registro vale 0, senão o eixo comprime.
  const days = eachDayIso(range);
  const byDayMap = new Map(byDay.map((d) => [d.date, d]));
  const sparkSpend = days.map((d) => {
    const row = byDayMap.get(d);
    return row ? row.googleSpend + row.metaSpend : 0;
  });
  const sparkMetaConversations = days.map(
    (d) => byDayMap.get(d)?.metaConversations ?? 0,
  );
  const sparkGoogleContacts = days.map(
    (d) => byDayMap.get(d)?.googleContacts ?? 0,
  );
  const siteEventsByDay = new Map(
    siteEvents.byDay.map((d) => [d.date, d.primary]),
  );
  const sparkSiteEvents = days.map((d) => siteEventsByDay.get(d) ?? 0);
  const leadsByDay = new Map<string, number>();
  for (const lead of leads) {
    const day = lead.occurredAt.slice(0, 10);
    leadsByDay.set(day, (leadsByDay.get(day) ?? 0) + 1);
  }
  const sparkLeads = days.map((d) => leadsByDay.get(d) ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        subtitle={`Resultados comerciais, intenção local e tráfego · ${client ? client.name : "Todos os clientes"}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Investimento total"
          value={fmtCurrency(paid.spend)}
          icon={DollarSign}
          tone="brand"
          spark={sparkSpend}
          caption="Google Ads + Meta Ads"
          help="Dinheiro investido nas duas plataformas no período."
          trend={prev ? { value: delta(paid.spend, paidPrev.spend), title: trendTitle } : undefined}
        />
        <KpiCard
          label="Conversas Meta"
          value={fmtInt(meta?.conversions ?? 0)}
          icon={MessageCircleMore}
          tone="indigo"
          spark={sparkMetaConversations}
          caption="Relatadas pela Meta Ads"
          help="Conversas iniciadas no WhatsApp/Direct atribuídas pela Meta."
          trend={
            prev
              ? { value: delta(meta?.conversions ?? 0, metaPrev?.conversions ?? 0), title: trendTitle }
              : undefined
          }
        />
        <KpiCard
          label="Contatos Google"
          value={fmtInt(googleResults.primary)}
          icon={PhoneCall}
          tone="sky"
          spark={sparkGoogleContacts}
          caption="WhatsApp + formulário + ligação"
          help="Ações primárias informadas pelo Google Ads. Rotas e visitas à loja ficam fora deste número."
          trend={
            prev
              ? { value: delta(googleResults.primary, googleResultsPrev.primary), title: trendTitle }
              : undefined
          }
        />
        <KpiCard
          label="Eventos de contato no site"
          value={webEvents.length ? fmtInt(siteEvents.primary) : "Aguardando coleta"}
          icon={Globe}
          tone="amber"
          spark={webEvents.length ? sparkSiteEvents : undefined}
          caption="Ações recebidas pelo GA4"
          help="Cliques no WhatsApp/telefone e formulários confirmados no site. Não são pessoas únicas e podem se sobrepor ao Google."
          trend={
            prev && webEvents.length
              ? { value: delta(siteEvents.primary, siteEventsPrev.primary), title: trendTitle }
              : undefined
          }
        />
        <KpiCard
          label="Leads no CRM"
          value={fmtInt(leads.length)}
          icon={UsersRound}
          tone="brand"
          spark={sparkLeads}
          caption="Pessoas/negócios registrados"
          help="É a confirmação operacional. Compare com as plataformas para identificar perdas e duplicidades; não é preenchido automaticamente nesta versão."
        />
      </div>

      {/* Aviso metodológico depois dos números: primeiro a resposta, depois a ressalva. */}
      <div className="flex items-start gap-3 rounded-[12px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <CircleAlert size={18} className="mt-0.5 shrink-0 text-sky-700" aria-hidden="true" />
        <p>
          <strong>Google, Meta e GA4 não representam pessoas únicas.</strong>{" "}
          Compare as fontes lado a lado e confirme os contatos reais no CRM;
          não some os três números para calcular clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SignalCard
          title="O que conta como contato"
          subtitle="Somente ações comerciais primárias"
          icon={<PhoneCall size={18} />}
          tone="sky"
          rows={[
            ["Google · WhatsApp", googleResults.byKind.whatsapp],
            ["Google · Formulários", googleResults.byKind.form],
            ["Google · Ligações", googleResults.byKind.phone],
            ["Meta · Conversas", meta?.conversions ?? 0],
          ]}
        />
        <SignalCard
          title="Intenção local"
          subtitle="Interesse forte, mas ainda não é contato"
          icon={<MapPinned size={18} />}
          tone="amber"
          rows={[
            ["Google · Pedidos de rota", googleResults.byKind.directions],
            ["Site/GA4 · Cliques em rota", siteEvents.byKind.directions],
            [RESULT_LABELS.store_visit, googleResults.byKind.store_visit],
            [RESULT_LABELS.website_visit, googleResults.byKind.website_visit],
          ]}
        />
        <SignalCard
          title="Site e qualidade do dado"
          subtitle="Comportamento e confiança da medição"
          icon={<ShieldCheck size={18} />}
          tone={alerts ? "rose" : "brand"}
          rows={[
            ["Sessões", site.sessions],
            ["Páginas vistas", site.pageviews],
            ["Tráfego sem origem", `${fmtPercent(unknownTraffic)}`],
            ["Integrações saudáveis", `${healthy}/${health.length || 0}`],
          ]}
          footer={alerts ? `${alerts} integração(ões) pedem atenção.` : "Coletas recentes e sem alertas."}
          href="/clientes"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChannelSummary
          href="/google"
          sp={sp}
          icon={<Search size={17} />}
          name="Google Ads"
          description="Pesquisa, Maps e rede Google"
          headline={google ? fmtCurrency(google.spend) : "—"}
          detail={`${fmtInt(googleResults.primary)} contatos · ${fmtInt(googleResults.localIntent)} intenções locais`}
        />
        <ChannelSummary
          href="/meta"
          sp={sp}
          icon={<MessageCircleMore size={17} />}
          name="Meta Ads"
          description="Facebook e Instagram"
          headline={meta ? fmtCurrency(meta.spend) : "—"}
          detail={`${fmtInt(meta?.conversions ?? 0)} conversas atribuídas`}
        />
        <ChannelSummary
          href="/site"
          sp={sp}
          icon={<Globe size={17} />}
          name="Site / GA4"
          description="Sessões, páginas e eventos"
          headline={fmtInt(site.sessions)}
          detail={`${fmtInt(site.pageviews)} páginas vistas · ${fmtPercent(unknownTraffic)} sem origem`}
        />
      </div>

      {ads.length === 0 && web.length === 0 && webEvents.length === 0 ? (
        <EmptyState
          icon={PlugZap}
          title="Ainda não há dados neste período"
          description={
            <>
              Confira a saúde das fontes em{" "}
              <Link href="/clientes" className="font-semibold text-brand-ink underline">
                Integrações
              </Link>{" "}
              ou selecione outro período/cliente.
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Investimento por canal"
              subtitle="Quanto foi investido em Google e Meta a cada dia"
            />
            <CardBody>
              <TrendAreaChart
                data={byDay}
                yFormat="compact"
                series={[
                  { key: "googleSpend", label: "Google Ads", color: CHART_COLORS.sky, format: "currency" },
                  { key: "metaSpend", label: "Meta Ads", color: CHART_COLORS.indigo, format: "currency" },
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Resultados atribuídos por plataforma"
              subtitle="Contatos Google × conversas Meta — compare, não some"
            />
            <CardBody>
              <TrendAreaChart
                data={byDay}
                yFormat="compact"
                series={[
                  { key: "googleContacts", label: "Contatos Google", color: CHART_COLORS.sky, format: "int" },
                  { key: "metaConversations", label: "Conversas Meta", color: CHART_COLORS.indigo, format: "int" },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function SignalCard({
  title,
  subtitle,
  icon,
  tone,
  rows,
  footer,
  href,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "brand" | "sky" | "amber" | "rose";
  rows: Array<[string, number | string]>;
  footer?: string;
  href?: string;
}) {
  const tones = {
    brand: "border-brand-border bg-brand-soft text-brand",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={<span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-[10px] border ${tones[tone]}`}>{icon}</span>}
      />
      <div className="divide-y divide-line px-5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="text-muted">{label}</span>
            <strong className="text-ink">{typeof value === "number" ? fmtInt(value) : value}</strong>
          </div>
        ))}
      </div>
      {(footer || href) && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-muted">
          <span>{footer}</span>
          {href && (
            <Link href={href} className="shrink-0 font-bold text-brand-ink hover:underline">
              Ver tracking
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}

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
    if (typeof value === "string" && !["deleted", "created", "updated", "error"].includes(key)) {
      qs.set(key, value);
    }
  }
  const suffix = qs.size ? `?${qs}` : "";
  return (
    <Link
      href={`${href}${suffix}`}
      className="group rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-ink">{icon}</span>
          <div>
            <p className="text-sm font-bold text-ink">{name}</p>
            <p className="text-xs text-faint">{description}</p>
          </div>
        </div>
        <Badge variant="neutral">
          <span className="inline-flex items-center gap-1">
            Detalhes <ArrowRight size={12} aria-hidden="true" />
          </span>
        </Badge>
      </div>
      <p className="mt-4 text-2xl font-bold tabular-nums tracking-tight text-ink">{headline}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </Link>
  );
}

function unknownTrafficShare(rows: Awaited<ReturnType<typeof getWebMetrics>>) {
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
