import {
  DollarSign,
  HelpCircle,
  MousePointerClick,
  Percent,
  PlugZap,
  Target,
  Wallet,
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
  getIntegrationAccounts,
  resolveClient,
} from "@/lib/metrics/queries";
import { adByCampaign, adByDay, adKpis } from "@/lib/metrics/aggregate";
import { selectedCampaigns } from "@/lib/campaigns";
import {
  delta,
  previousRange,
  rangeDays,
  rangeFromSearch,
  rangeSince,
} from "@/lib/range";
import {
  fmtCompact,
  fmtCurrency,
  fmtCurrencyCents,
  fmtDateLong,
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

  const [adsAll, adsPrevAll, campaignList, integrationAccounts] =
    await Promise.all([
      getAdMetrics(range, client?.id, [platform], accountExternalId),
      getAdMetrics(prev, client?.id, [platform], accountExternalId),
      getAdCampaigns(client?.id, platform),
      getIntegrationAccounts(client?.id),
    ]);

  // Saldo pré-pago: recarga informada em Integrações − gasto desde a data da
  // recarga (independe do período selecionado no topo — saldo é "agora").
  const provider = platform === "meta" ? "meta_ads" : "google_ads";
  const balances = await Promise.all(
    integrationAccounts
      .filter(
        (a) =>
          a.provider === provider &&
          a.balanceRecharge != null &&
          a.balanceRechargeDate != null,
      )
      .map(async (a) => {
        const recharge = a.balanceRecharge as number;
        const rechargeDate = a.balanceRechargeDate as string;
        const since = rangeSince(rechargeDate);
        const rows = await getAdMetrics(since, a.clientId, [platform]);
        const spent = rows.reduce((s, r) => s + r.spend, 0);
        const balance = recharge - spent;
        const dailyAvg = spent / Math.max(1, rangeDays(since));
        return {
          id: a.id,
          accountName: a.accountName,
          recharge,
          rechargeDate,
          spent,
          balance,
          daysLeft:
            balance > 0 && dailyAvg > 0
              ? Math.floor(balance / dailyAvg)
              : null,
        };
      }),
  );

  const balanceCard =
    balances.length > 0 ? (
      <Card>
        <CardHeader
          title="Saldo disponível na conta"
          subtitle="Recarga informada em Integrações − gasto desde a data da recarga. O gasto atualiza no sync diário."
          action={
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Wallet size={17} />
            </span>
          }
        />
        <div className="divide-y divide-line">
          {balances.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">
                  {b.accountName}
                </p>
                <p className="text-xs text-faint">
                  Recarga de {fmtCurrencyCents(b.recharge)} em{" "}
                  {fmtDateLong(b.rechargeDate)} · gasto desde então{" "}
                  {fmtCurrencyCents(b.spent)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-extrabold ${
                    b.balance > 0 ? "text-ink" : "text-[#b91c1c]"
                  }`}
                >
                  {fmtCurrencyCents(Math.max(0, b.balance))}
                </p>
                <p className="text-xs text-faint">
                  {b.balance <= 0
                    ? "recarga esgotada — hora de recarregar"
                    : b.daysLeft != null
                      ? `dura ~${fmtInt(b.daysLeft)} dia${b.daysLeft === 1 ? "" : "s"} no ritmo atual`
                      : "sem gasto desde a recarga"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    ) : null;

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
  // No Meta a conversão é "conversa iniciada" (termo do Gerenciador); no
  // Google, "conversão". Um nome só por canal, em card, gráfico e tabela.
  const convLabel = platform === "meta" ? "Conversas" : "Conversões";
  // Status por campanha (Ativo/Pausado) pra a tabela ficar no estilo do
  // Gerenciador do Meta. Ativas primeiro, depois por investimento.
  const statusByCampaign = new Map(campaignOptions.map((o) => [o.campaign, o.status]));
  const campaignStatus = (name: string) => statusByCampaign.get(name) ?? "UNKNOWN";
  const campaignsSorted = [...campaigns].sort((a, b) => {
    const aw = campaignStatus(a.campaign) === "ENABLED" ? 1 : 0;
    const bw = campaignStatus(b.campaign) === "ENABLED" ? 1 : 0;
    if (aw !== bw) return bw - aw;
    return b.spend - a.spend;
  });

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
        <>
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
        {balanceCard}
        </>
      ) : (
        <>
          {/* Os 4 números que decidem: quanto gastou, o que gerou, a que custo,
              e se o anúncio chama atenção. O resto vai na faixa compacta. */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard
              label="Investimento"
              value={fmtCurrency(k.spend)}
              icon={DollarSign}
              help="Quanto você gastou em anúncios nesse período. É o dinheiro que saiu — não o resultado."
              trend={{ value: delta(k.spend, kPrev.spend) }}
            />
            <KpiCard
              label={convLabel}
              value={fmtInt(k.conversions)}
              icon={Target}
              help={
                platform === "meta"
                  ? "Conversas iniciadas no WhatsApp/Direct a partir do anúncio — o resultado concreto da campanha (mesmo número do Gerenciador)."
                  : "O resultado que importa: contatos gerados (WhatsApp, formulário, ligação, rota no Maps)."
              }
              trend={{ value: delta(k.conversions, kPrev.conversions) }}
            />
            <KpiCard
              label={platform === "meta" ? "Custo por conversa" : "Custo por conversão"}
              value={fmtCurrencyCents(k.cpl)}
              icon={MousePointerClick}
              help="Investimento ÷ resultados. Quanto MENOR, melhor — é o preço de cada contato gerado."
              trend={{ value: delta(k.cpl, kPrev.cpl), positiveIsGood: false }}
            />
            <KpiCard
              label="CTR"
              value={fmtPercent(k.ctr)}
              icon={Percent}
              help="De cada 100 pessoas que viram o anúncio, quantas clicaram (cliques ÷ impressões). Mede o quanto ele chama atenção. Acima de ~2% costuma ser bom."
              trend={{ value: delta(k.ctr, kPrev.ctr) }}
            />
          </div>

          {balanceCard}

          {/* Métricas de apoio, numa faixa só (sem competir com as principais) */}
          <div className="card flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
            <MiniStat
              label="Impressões"
              value={fmtCompact(k.impressions)}
              tip="Quantas vezes o anúncio apareceu na tela (a mesma pessoa pode contar várias vezes)."
            />
            {platform === "meta" && (
              <MiniStat
                label="Alcance (acumulado)"
                value={fmtCompact(k.reach)}
                tip="Pessoas diferentes que viram o anúncio, somando os dias — fica um pouco acima do alcance único do Gerenciador."
              />
            )}
            <MiniStat
              label="Cliques"
              value={fmtInt(k.clicks)}
              tip="Quantas vezes clicaram no anúncio. Interesse — ainda não é contato."
            />
            <MiniStat
              label="Custo por clique"
              value={fmtCurrencyCents(k.cpc)}
              tip="Investimento ÷ cliques."
            />
            {platform === "google" && (
              <MiniStat
                label="Parcela de impressões"
                value={k.impressionShare != null ? fmtPercent(k.impressionShare) : "—"}
                tip="% das buscas em que o anúncio apareceu, de todas em que PODERIA aparecer. Baixo = perdendo espaço por orçamento/lance."
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
                title={`${convLabel} por dia`}
                subtitle={
                  platform === "meta"
                    ? "Conversas no WhatsApp/Direct iniciadas pelo anúncio"
                    : "Leads, WhatsApp e formulários gerados"
                }
              />
              <CardBody>
                <BarsChart
                  data={byDay}
                  dataKey="conversions"
                  name={convLabel}
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
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
                    <th className="px-5 py-3">Veiculação</th>
                    <th className="px-3 py-3">Campanha</th>
                    <th className="px-3 py-3 text-right">Investido</th>
                    {platform === "meta" && (
                      <th className="px-3 py-3 text-right">Alcance</th>
                    )}
                    <th className="px-3 py-3 text-right">Impressões</th>
                    <th className="px-3 py-3 text-right">Cliques</th>
                    <th className="px-3 py-3 text-right">CTR</th>
                    <th className="px-3 py-3 text-right">CPC</th>
                    <th className="px-3 py-3 text-right">{convLabel}</th>
                    <th className="px-5 py-3 text-right">Custo/conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsSorted.map((c) => {
                    const st = campaignStatus(c.campaign);
                    const active = st === "ENABLED";
                    return (
                    <tr
                      key={`${c.platform}-${c.campaign}`}
                      className="border-b border-line last:border-0 transition-colors hover:bg-surface-2"
                    >
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              active ? "bg-brand" : "bg-faint"
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              active ? "text-brand-ink" : "text-faint"
                            }`}
                          >
                            {active ? "Ativo" : st === "PAUSED" ? "Pausado" : "—"}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-ink">
                        {c.campaign}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-ink">
                        {fmtCurrency(c.spend)}
                      </td>
                      {platform === "meta" && (
                        <td className="px-3 py-3 text-right text-muted">
                          {fmtCompact(c.reach)}
                        </td>
                      )}
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
                    );
                  })}
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

// Métrica de apoio: label + valor numa faixa compacta, com "?" explicativo.
function MiniStat({ label, value, tip }: { label: string; value: string; tip?: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className="eyebrow flex items-center gap-1">
        {label}
        {tip && (
          <span className="group relative inline-flex" tabIndex={0}>
            <HelpCircle
              size={12}
              strokeWidth={2.2}
              className="cursor-help text-faint/60 transition-colors group-hover:text-brand"
            />
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 w-60 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-ink opacity-0 shadow-[var(--shadow-pop)] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
            >
              {tip}
            </span>
          </span>
        )}
      </span>
      <span className="text-base font-bold text-ink">{value}</span>
    </div>
  );
}
