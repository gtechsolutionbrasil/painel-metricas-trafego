import Link from "next/link";
import "./report.css";
import { PrintButton } from "./PrintButton";
import { getClients, resolveClient } from "@/lib/metrics/queries";
import { getReportData, type ReportBar } from "@/lib/report/data";
import { rangeFromSearch } from "@/lib/range";
import { fmtCurrencyCents, fmtDateLong, fmtInt, fmtPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Relatório de investimento em anúncios",
};

type SP = Record<string, string | string[] | undefined>;

// Valor do topo das barras do gráfico: sem "R$" (o eixo já é de dinheiro),
// mas com separador de milhar — "42.734,00", não "42734,00".
const moneyPlain = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtMoneyPlain = (v: number) => moneyPlain.format(v || 0);

// ---------------------------------------------------------------------------
// Relatório de prestação de contas, pronto para virar PDF (Cmd+P → Salvar).
// Fora do layout do painel de propósito: sem sidebar, sem topbar, sem jargão —
// é o documento que o cliente recebe. Lê o mesmo cliente e período do painel,
// pelos parâmetros da URL.
// ---------------------------------------------------------------------------
export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { range } = rangeFromSearch(sp);
  const clients = await getClients();
  const client = resolveClient(clients, sp.client);
  const data = await getReportData(range, client?.id, client?.name ?? "Todos os clientes");

  // Volta pro painel com o mesmo cliente e período que geraram o relatório.
  const voltarParams = new URLSearchParams();
  for (const k of ["client", "from", "to", "days"]) {
    const v = sp[k];
    if (typeof v === "string") voltarParams.set(k, v);
  }
  const voltar = `/${voltarParams.toString() ? `?${voltarParams}` : ""}`;
  const emitido = new Date().toLocaleDateString("pt-BR");
  const google = data.platforms.find((p) => p.platform === "google");
  const meta = data.platforms.find((p) => p.platform === "meta");
  const maxWeek = Math.max(1, ...data.weeks.map((w) => w.total));
  const totalContatos = data.contactRows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="rel">
      <div className="rel-acoes">
        <span>
          Relatório de <b>{data.clientName}</b> · {fmtDateLong(range.from)} a{" "}
          {fmtDateLong(range.to)}
        </span>
        <span className="grupo">
          <Link href={voltar} className="rel-btn">
            Voltar ao painel
          </Link>
          <PrintButton />
        </span>
      </div>

      <div className="rel-folha">
        <header className="rel-capa">
          <div className="rel-selo">
            Relatório de investimento ·{" "}
            {data.platforms
              .map((p) => (p.platform === "google" ? "Google Ads" : "Meta Ads"))
              .join(" · ") || "sem veiculação"}
          </div>
          <h1>Para onde foi o investimento em anúncios</h1>
          <p className="sub">
            {client
              ? `Prestação de contas das campanhas de ${data.clientName} no período, com o que cada real investido gerou.`
              : "Prestação de contas das campanhas no período, com o que cada real investido gerou."}
          </p>
          <div className="rel-periodo">
            <span>
              <b>Período:</b> {fmtDateLong(range.from)} a {fmtDateLong(range.to)}
            </span>
            <span>
              <b>{fmtInt(data.days)} dias</b>
            </span>
            <span>
              <b>Cliente:</b> {data.clientName}
            </span>
          </div>
        </header>

        {!data.hasData ? (
          <div className="rel-vazio">
            Não há veiculação registrada nesse período. Escolha outro intervalo
            no painel e exporte de novo.
          </div>
        ) : (
          <>
            <div className="rel-titular">
              <div className="rel-cifra">
                <span className="rotulo">Total investido</span>
                <span className="valor">{fmtCurrencyCents(data.totals.spend)}</span>
                <span className="nota">
                  Valor pago às plataformas pelos anúncios no período.
                </span>
              </div>
              {data.totals.contacts > 0 && (
                <div className="rel-cifra">
                  <span className="rotulo">Contatos diretos</span>
                  <span className="valor verde">{fmtInt(data.totals.contacts)}</span>
                  <span className="nota">
                    Pessoas que chamaram no WhatsApp ou ligaram para a loja vindas
                    dos anúncios.
                  </span>
                </div>
              )}
              {data.totals.directions > 0 && (
                <div className="rel-cifra">
                  <span className="rotulo">Quiseram ir até a loja</span>
                  <span className="valor">{fmtInt(data.totals.directions)}</span>
                  <span className="nota">
                    Pessoas que pediram a rota até o endereço.
                  </span>
                </div>
              )}
            </div>

            {data.platforms.length > 1 && (
              <section className="rel-secao">
                <div className="rel-cabeca">
                  <h2>Como o dinheiro foi dividido entre as duas plataformas</h2>
                  <p>
                    O Google alcança quem <em>já está procurando</em> agora. O
                    Instagram e o Facebook alcançam quem{" "}
                    <em>ainda não estava procurando</em>, mas mora na região. São
                    dois momentos diferentes do mesmo cliente.
                  </p>
                </div>

                <div className="rel-trilho">
                  {data.platforms.map((p) => (
                    <div
                      key={p.platform}
                      className={`fatia ${p.platform}`}
                      style={{ width: `${(p.share * 100).toFixed(1)}%` }}
                    >
                      {fmtPercent(p.share)}
                    </div>
                  ))}
                </div>

                <div className="rel-legenda">
                  {data.platforms.map((p) => (
                    <div className="rel-item-legenda" key={p.platform}>
                      <span className={`rel-marca ${p.platform}`} />
                      <span className="txt">
                        <strong>
                          {p.label}: {fmtCurrencyCents(p.spend)}
                        </strong>
                        <span>
                          No ar em {fmtInt(p.activeDays)}{" "}
                          {p.activeDays === 1 ? "dia" : "dias"} do período
                          {p.activeDays < data.days
                            ? ` (${fmtDateLong(p.firstDay)} a ${fmtDateLong(p.lastDay)})`
                            : ""}
                          .
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.weeks.length > 1 && (
              <section className="rel-secao rel-quebra-antes">
                <div className="rel-cabeca">
                  <h2>Semana a semana</h2>
                  <p>
                    Quanto foi investido em cada semana do período, separado por
                    plataforma.
                  </p>
                </div>
                <div>
                  <div
                    className="rel-grafico"
                    role="img"
                    aria-label={`Investimento por semana: ${data.weeks
                      .map((w) => `${w.topLabel} ${fmtCurrencyCents(w.total)}`)
                      .join("; ")}`}
                  >
                    {data.weeks.map((w, i) => (
                      <div className="rel-coluna" key={i}>
                        <span className="total">{fmtMoneyPlain(w.total)}</span>
                        <div
                          className="rel-pilha"
                          style={{ height: `${(w.total / maxWeek) * 100}%` }}
                        >
                          {w.google > 0 && (
                            <div
                              className="seg-google"
                              style={{ height: `${(w.google / (w.total || 1)) * 100}%` }}
                            />
                          )}
                          {w.meta > 0 && (
                            <div
                              className="seg-meta"
                              style={{ height: `${(w.meta / (w.total || 1)) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rel-eixo" aria-hidden="true">
                    {data.weeks.map((w, i) => (
                      <span className="rot" key={i}>
                        {w.topLabel}
                        <br />
                        {w.bottomLabel}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {google && data.googleCampaigns.length > 0 && (
              <section className="rel-secao">
                <div className="rel-cabeca">
                  <h2>Dentro do Google</h2>
                  <p>
                    Em que frentes o investimento do Google foi aplicado e o que
                    as pessoas procuravam.
                  </p>
                </div>
                <h3 className="rel-subtitulo">Divisão do investimento no Google</h3>
                <Barras itens={data.googleCampaigns} moeda />
                {data.googleAdGroups.length > 1 && (
                  <>
                    <h3 className="rel-subtitulo">
                      Dentro da busca: o que as pessoas procuravam
                    </h3>
                    <Barras itens={data.googleAdGroups} moeda />
                  </>
                )}
              </section>
            )}

            {meta && data.metaCampaigns.length > 0 && (
              <section className="rel-secao">
                <div className="rel-cabeca">
                  <h2>Dentro do Instagram e Facebook</h2>
                  <p>Em que frentes o investimento do Meta foi aplicado.</p>
                </div>
                <h3 className="rel-subtitulo meta">Divisão do investimento no Meta</h3>
                <Barras itens={data.metaCampaigns} moeda meta />
              </section>
            )}

            <section className="rel-secao rel-quebra-antes">
              <div className="rel-cabeca">
                <h2>O caminho que a pessoa percorre</h2>
                <p>
                  Do momento em que o anúncio aparece até a pessoa procurar o
                  caminho da loja, cada passo é medido. Este é o caminho completo
                  no período.
                </p>
              </div>

              <div className="rel-jornada">
                <Etapa
                  numero={1}
                  titulo="O anúncio aparece"
                  cifra={`${fmtInt(data.totals.impressions)} exibições`}
                >
                  <p>
                    A pessoa está pesquisando no Google, olhando o mapa, ou
                    rolando o Instagram e o Facebook.
                    {data.platforms.length > 1 && google && meta
                      ? ` Foram ${fmtInt(google.impressions)} exibições no Google e ${fmtInt(meta.impressions)} no Meta.`
                      : ""}
                    {data.totals.reach > 0
                      ? ` No Instagram e Facebook, o anúncio alcançou cerca de ${fmtInt(data.totals.reach)} pessoas da região.`
                      : ""}
                  </p>
                </Etapa>

                <Etapa
                  numero={2}
                  titulo="Ela clica no anúncio"
                  cifra={`${fmtInt(data.totals.clicks)} cliques`}
                >
                  {data.platforms.length > 1 && google && meta && (
                    <p>
                      {fmtInt(google.clicks)} cliques vieram do Google e{" "}
                      {fmtInt(meta.clicks)} do Instagram e Facebook. No Google dá
                      para saber exatamente em que parte do anúncio a pessoa
                      tocou:
                    </p>
                  )}
                  {data.googleClickTypes.length > 0 && (
                    <div className="rel-linhas">
                      {data.googleClickTypes.map((c) => (
                        <div className="rel-linha" key={c.label}>
                          <span className="rot">
                            {c.label}
                            {c.note && <em>{c.note}</em>}
                          </span>
                          <span className="num">{fmtInt(c.value)}</span>
                          <span className="mini">
                            <div style={{ width: `${(c.share * 100).toFixed(1)}%` }} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Etapa>

                {data.totals.contacts > 0 && (
                  <Etapa
                    numero={3}
                    titulo="Ela entra em contato com a loja"
                    cifra={`${fmtInt(data.totals.contacts)} contatos`}
                  >
                    <p>
                      É aqui que o anúncio vira gente falando com a loja:{" "}
                      {data.contactRows
                        .map((r) => `${fmtInt(r.total)} ${r.label.toLowerCase()}`)
                        .join(", ")}
                      .
                    </p>
                  </Etapa>
                )}

                {data.totals.directions > 0 && (
                  <Etapa
                    numero={data.totals.contacts > 0 ? 4 : 3}
                    titulo="Ela procura o caminho até a loja"
                    cifra={`${fmtInt(data.totals.directions)} rotas traçadas`}
                  >
                    <p>
                      {fmtInt(data.totals.directions)} pessoas pediram a rota do
                      lugar onde estavam até o endereço da loja, que é o sinal
                      mais forte de intenção de ir comprar pessoalmente.
                      {data.totals.profileViews > 0
                        ? ` Além disso, ${fmtInt(data.totals.profileViews)} abriram o site pelo perfil`
                        : ""}
                      {data.totals.profileEngagements > 0
                        ? ` e ${fmtInt(data.totals.profileEngagements)} fizeram outras interações no perfil da loja, como ver fotos, horário de funcionamento e produtos`
                        : ""}
                      .
                    </p>
                  </Etapa>
                )}
              </div>
            </section>

            <section className="rel-secao">
              <div className="rel-cabeca">
                <h2>O que esse investimento gerou</h2>
                <p>Os números do caminho acima, lado a lado.</p>
              </div>

              <div className="rel-placar">
                <div className="celula">
                  <span className="num">{fmtInt(data.totals.impressions)}</span>
                  <span className="desc">
                    Visualizações
                    <br />
                    dos anúncios
                  </span>
                </div>
                {data.totals.reach > 0 && (
                  <div className="celula">
                    <span className="num">{fmtInt(data.totals.reach)}</span>
                    <span className="desc">
                      Pessoas alcançadas
                      <br />
                      no Instagram e Facebook
                    </span>
                  </div>
                )}
                <div className="celula">
                  <span className="num">{fmtInt(data.totals.clicks)}</span>
                  <span className="desc">
                    Cliques
                    <br />
                    nos anúncios
                  </span>
                </div>
                {data.totals.contacts > 0 && (
                  <div className="celula">
                    <span className="num destaque">{fmtInt(data.totals.contacts)}</span>
                    <span className="desc">
                      Contatos diretos
                      <br />
                      (WhatsApp e ligações)
                    </span>
                  </div>
                )}
                {data.totals.directions > 0 && (
                  <div className="celula">
                    <span className="num">{fmtInt(data.totals.directions)}</span>
                    <span className="desc">
                      Rotas traçadas
                      <br />
                      até o endereço da loja
                    </span>
                  </div>
                )}
              </div>

              {data.contactRows.length > 0 && (
                <div className="rel-tabela-wrap">
                  <table>
                    <caption>Detalhamento dos contatos</caption>
                    <thead>
                      <tr>
                        <th scope="col">Ação da pessoa</th>
                        {google && <th className="n">Google</th>}
                        {meta && <th className="n">Meta</th>}
                        <th className="n">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.contactRows.map((r) => (
                        <tr key={r.label}>
                          <td>{r.label}</td>
                          {google && <td className="n">{r.google || "—"}</td>}
                          {meta && <td className="n">{r.meta || "—"}</td>}
                          <td className="n">{fmtInt(r.total)}</td>
                        </tr>
                      ))}
                      <tr className="somatorio">
                        <td>Total de contatos diretos</td>
                        {google && (
                          <td className="n">
                            {fmtInt(data.contactRows.reduce((s, r) => s + r.google, 0))}
                          </td>
                        )}
                        {meta && (
                          <td className="n">
                            {fmtInt(data.contactRows.reduce((s, r) => s + r.meta, 0))}
                          </td>
                        )}
                        <td className="n">{fmtInt(totalContatos)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {data.balances.length > 0 && (
              <section className="rel-secao">
                <div className="rel-cabeca">
                  <h2>Fundos disponíveis nas contas</h2>
                  <p>
                    Quanto ainda resta de saldo em cada plataforma para os
                    anúncios continuarem no ar, na posição de {emitido}.
                  </p>
                </div>
                <div className="rel-barras">
                  {data.balances.map((b) => {
                    const usado =
                      b.limit && b.limit > 0
                        ? Math.min(1, (b.spent ?? 0) / b.limit)
                        : b.stopped
                          ? 1
                          : 0;
                    const isMeta = b.label.startsWith("Meta");
                    return (
                      <div className="rel-barra" key={b.label}>
                        <div className="rel-barra-topo">
                          <span className="rel-barra-nome">
                            {b.label}
                            {b.stopped && (
                              <em>
                                Sem saldo: os anúncios dessa conta não são
                                exibidos até a próxima recarga.
                              </em>
                            )}
                          </span>
                          <span className="rel-barra-valor">
                            {fmtCurrencyCents(Math.max(0, b.available))}{" "}
                            <span className="pct">disponíveis</span>
                          </span>
                        </div>
                        <div className="rel-trilha">
                          <div
                            className={isMeta ? "meta" : ""}
                            style={{ width: `${(usado * 100).toFixed(1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="rel-rodape">
          <span>Dados extraídos direto das contas de anúncio</span>
          <span>Gestão: GTech Solution</span>
          <span>Emitido em {emitido}</span>
        </footer>
      </div>
    </div>
  );
}

function Barras({
  itens,
  moeda,
  meta,
}: {
  itens: ReportBar[];
  moeda?: boolean;
  meta?: boolean;
}) {
  return (
    <div className="rel-barras">
      {itens.map((b) => (
        <div className="rel-barra" key={b.label}>
          <div className="rel-barra-topo">
            <span className="rel-barra-nome">
              {b.label}
              {b.note && <em>{b.note}</em>}
            </span>
            <span className="rel-barra-valor">
              {moeda ? fmtCurrencyCents(b.value) : fmtInt(b.value)}{" "}
              <span className="pct">{fmtPercent(b.share)}</span>
            </span>
          </div>
          <div className="rel-trilha">
            <div
              className={meta ? "meta" : ""}
              style={{ width: `${(b.share * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Etapa({
  numero,
  titulo,
  cifra,
  children,
}: {
  numero: number;
  titulo: string;
  cifra: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rel-etapa">
      <div className="marcador">
        <span className="bolha">{numero}</span>
        <span className="fio" />
      </div>
      <div className="conteudo">
        <div className="titulo-etapa">
          <strong>{titulo}</strong>
          <span className="cifra-etapa">{cifra}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
