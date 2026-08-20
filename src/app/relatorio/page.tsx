import Link from "next/link";
import "./report.css";
import { RelatorioControles } from "./RelatorioControles";
import { getClients, resolveClient } from "@/lib/metrics/queries";
import { getReportData, type ReportBar } from "@/lib/report/data";
import {
  GLOSSARIO,
  VISITAS_LOJA_PASSOS,
  type Verbete,
  type VerbeteId,
} from "@/lib/report/glossario";
import {
  availableSections,
  parseHidden,
  STORAGE_PREFIX,
} from "@/lib/report/sections";
import { rangeFromSearch } from "@/lib/range";
import {
  fmtCurrencyCents,
  fmtDateLong,
  fmtInt,
  fmtPercent,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Relatório de investimento em anúncios",
};

type SP = Record<string, string | string[] | undefined>;

// Valor do topo das barras do gráfico: sem "R$" (o eixo já é de dinheiro),
// mas com separador de milhar: "42.734,00", não "42734,00".
const moneyPlain = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtMoneyPlain = (v: number) => moneyPlain.format(v || 0);

// ---------------------------------------------------------------------------
// Relatório de prestação de contas, pronto para virar PDF (Cmd+P → Salvar).
// Fora do layout do painel de propósito: sem sidebar, sem topbar, sem jargão.
// É o documento que o cliente recebe.
//
// Formato: uma coluna, sem moldura, sem cor decorativa. Cada número aparece UMA
// vez, numa linha com o nome à esquerda e o valor à direita, seguido de uma
// frase do que é e de onde veio. Quando a métrica precisa de mais explicação
// (visitas à loja), a explicação fica colada nela, não numa seção separada.
//
// Convenção de texto: nada de travessão no que o cliente lê.
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
  const data = await getReportData(
    range,
    client?.id,
    client?.name ?? "Todos os clientes",
  );

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
  const t = data.totals;

  // O servidor renderiza tudo que TEM DADO; o que o gestor desligou some por
  // CSS (data-off), sem recarregar a página a cada clique.
  const disponiveis = availableSections(data);
  const mostrar = (id: Parameters<typeof disponiveis.has>[0]) =>
    disponiveis.has(id);
  const ocultasIniciais = parseHidden(sp.ocultar);
  const clienteKey = client?.id ?? "todos";

  return (
    <div
      className="rel"
      data-off={
        ocultasIniciais.size > 0 ? [...ocultasIniciais].join(" ") : undefined
      }
    >
      {/* Aplica a preferência salva antes do primeiro paint, senão as seções
          desligadas piscam até a hidratação. Só quando a URL não mandou nada. */}
      {sp.ocultar === undefined && (
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var v=localStorage.getItem(${JSON.stringify(
              `${STORAGE_PREFIX}${clienteKey}`,
            )});if(v)document.currentScript.parentElement.dataset.off=v.split(",").join(" ")}catch(e){}`,
          }}
        />
      )}

      <div className="rel-acoes">
        <span>
          Relatório de <b>{data.clientName}</b> · {fmtDateLong(range.from)} a{" "}
          {fmtDateLong(range.to)}
        </span>
        <span className="grupo">
          <Link href={voltar} className="rel-btn">
            Voltar ao painel
          </Link>
          <RelatorioControles
            disponiveis={[...disponiveis]}
            ocultasIniciais={[...ocultasIniciais]}
            temParamNaUrl={sp.ocultar !== undefined}
            clienteKey={clienteKey}
          />
        </span>
      </div>

      <div className="rel-folha">
        <header className="rel-capa">
          <p className="rel-selo">Relatório de investimento em anúncios</p>
          <h1>{data.clientName}</h1>
          <p className="rel-periodo">
            {fmtDateLong(range.from)} a {fmtDateLong(range.to)} ·{" "}
            {fmtInt(data.days)} dias
          </p>
        </header>

        {!data.hasData ? (
          <div className="rel-vazio">
            Não há veiculação registrada nesse período. Escolha outro intervalo
            no painel e exporte de novo.
          </div>
        ) : (
          <>
            <div className="rel-total" data-secao="destaques">
              <p className="rot">Total investido</p>
              <p className="val">{fmtCurrencyCents(t.spend)}</p>
              <p className="txt">
                {GLOSSARIO.investimento.oQue}{" "}
                <span className="fonte">
                  De onde vem: {GLOSSARIO.investimento.origem}.
                </span>
              </p>
            </div>

            {mostrar("divisao") && (
              <section className="rel-secao" data-secao="divisao">
                <h2>Como o dinheiro foi dividido</h2>
                <p className="rel-intro">
                  O Google alcança quem já está procurando agora. O Instagram e
                  o Facebook alcançam quem ainda não estava procurando, mas mora
                  na região.
                </p>

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
                    <p className="rel-item-legenda" key={p.platform}>
                      <span className={`rel-marca ${p.platform}`} />
                      <b>
                        {p.label}: {fmtCurrencyCents(p.spend)}
                      </b>
                      <span>
                        no ar em {fmtInt(p.activeDays)}{" "}
                        {p.activeDays === 1 ? "dia" : "dias"}
                        {p.activeDays < data.days
                          ? `, de ${fmtDateLong(p.firstDay)} a ${fmtDateLong(p.lastDay)}`
                          : " do período"}
                      </span>
                    </p>
                  ))}
                </div>
              </section>
            )}

            <section className="rel-secao" data-grupo="placar contatos">
              <h2>O que esse investimento gerou</h2>
              <p className="rel-intro">
                Cada número com o que ele significa e de onde foi extraído.
              </p>

              <div className="rel-metricas" data-secao="placar">
                <Metrica verbete="visualizacoes" valor={fmtInt(t.impressions)} />
                {t.reach > 0 && (
                  <Metrica verbete="alcance" valor={fmtInt(t.reach)} />
                )}
                {t.googleContacts > 0 && (
                  <Metrica
                    verbete="contatosGoogle"
                    valor={fmtInt(t.googleContacts)}
                    forte
                  />
                )}
                {t.metaConversations > 0 && (
                  <Metrica
                    verbete="conversasMeta"
                    valor={fmtInt(t.metaConversations)}
                    forte
                  />
                )}
                {t.directions > 0 && (
                  <Metrica verbete="rotas" valor={fmtInt(t.directions)} />
                )}
                {t.storeVisits > 0 && (
                  <Metrica verbete="visitasLoja" valor={fmtInt(t.storeVisits)}>
                    {/* A explicação do método fica dentro da própria métrica.
                        Repetir o número numa seção à parte confundia. */}
                    {mostrar("visitas") && (
                      <div className="rel-detalhe" data-secao="visitas">
                        <p className="rel-paragrafo">
                          O Google não conta pessoas na porta da loja. Ele
                          acompanha um grupo pequeno de celulares que
                          autorizaram o histórico de localização, vê quantos
                          deles foram até a loja depois de verem o anúncio, e
                          multiplica esse resultado para calcular o público
                          inteiro.
                        </p>

                        <h4>Como o Google calcula</h4>
                        <ol className="rel-passos">
                          {VISITAS_LOJA_PASSOS.map((p) => (
                            <li key={p.titulo}>
                              <b>{p.titulo}.</b> {p.texto}
                            </li>
                          ))}
                        </ol>

                        {t.directions > 0 && (
                          <div className="rel-versus">
                            <p>
                              <span className="n">{fmtInt(t.directions)}</span>
                              <b>rotas até a loja</b>
                              <span>
                                contado: alguém realmente tocou em “Rotas” no
                                perfil
                              </span>
                            </p>
                            <p className="calculado">
                              <span className="n">{fmtInt(t.storeVisits)}</span>
                              <b>visitas à loja</b>
                              <span>
                                calculado: inclui quem já sabia o caminho e foi
                                sem pedir rota
                              </span>
                            </p>
                          </div>
                        )}

                      </div>
                    )}
                  </Metrica>
                )}
                {t.profileEngagements > 0 && (
                  <Metrica
                    verbete="interacoesPerfil"
                    valor={fmtInt(t.profileEngagements)}
                  />
                )}
              </div>

              {mostrar("contatos") && (
                <div className="rel-tabela-wrap" data-secao="contatos">
                  <h3>Detalhamento dos contatos</h3>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">O que a pessoa fez</th>
                        {google && <th className="n">Google</th>}
                        {meta && <th className="n">Meta</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.contactRows.map((r) => (
                        <tr key={r.label}>
                          <td>{r.label}</td>
                          {google && <td className="n">{r.google || ""}</td>}
                          {meta && <td className="n">{r.meta || ""}</td>}
                        </tr>
                      ))}
                      <tr className="somatorio">
                        <td>Total por plataforma (não somar entre elas)</td>
                        {google && (
                          <td className="n">
                            {fmtInt(
                              data.contactRows.reduce((s, r) => s + r.google, 0),
                            )}
                          </td>
                        )}
                        {meta && (
                          <td className="n">
                            {fmtInt(
                              data.contactRows.reduce((s, r) => s + r.meta, 0),
                            )}
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {mostrar("semanas") && (
              <section className="rel-secao" data-secao="semanas">
                <h2>Semana a semana</h2>
                <p className="rel-intro">{GLOSSARIO.semanas.oQue}</p>
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
                        {w.meta > 0 && (
                          <div
                            className="seg-meta"
                            style={{
                              height: `${(w.meta / (w.total || 1)) * 100}%`,
                            }}
                          />
                        )}
                        {w.google > 0 && (
                          <div
                            className="seg-google"
                            style={{
                              height: `${(w.google / (w.total || 1)) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <span className="rot">
                        {w.topLabel}
                        <br />
                        {w.bottomLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {mostrar("google") && (
              <section className="rel-secao" data-secao="google">
                <h2>Onde o dinheiro foi aplicado no Google</h2>
                <Barras itens={data.googleCampaigns} />
                {data.googleAdGroups.length > 1 && (
                  <>
                    <h3>O que as pessoas procuravam</h3>
                    <p className="rel-intro">{GLOSSARIO.temasBusca.oQue}</p>
                    <Barras itens={data.googleAdGroups} />
                  </>
                )}
              </section>
            )}

            {mostrar("meta") && (
              <section className="rel-secao" data-secao="meta">
                <h2>Onde o dinheiro foi aplicado no Instagram e Facebook</h2>
                <Barras itens={data.metaCampaigns} meta />
              </section>
            )}

            {mostrar("fundos") && (
              <section className="rel-secao" data-secao="fundos">
                <h2>Fundos disponíveis nas contas</h2>
                <p className="rel-intro">
                  Saldo restante em cada plataforma na posição de {emitido}.{" "}
                  {GLOSSARIO.saldo.ressalva}
                </p>
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
                        <p className="rel-barra-topo">
                          <span className="nome">
                            {b.label}
                            {b.stopped && (
                              <em>
                                Sem saldo: os anúncios dessa conta não são
                                exibidos até a próxima recarga.
                              </em>
                            )}
                          </span>
                          <span className="valor">
                            {fmtCurrencyCents(Math.max(0, b.available))}
                          </span>
                        </p>
                        <span className="rel-trilha">
                          <span
                            className={isMeta ? "meta" : ""}
                            style={{ width: `${(usado * 100).toFixed(1)}%` }}
                          />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="rel-rodape">
          Dados extraídos direto das contas de anúncio · Gestão: GTech Solution
          · Emitido em {emitido}
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Uma métrica: nome à esquerda, valor à direita, explicação embaixo. Sem
// moldura e sem ícone, a linha inteira é lida de uma vez. `children` é o
// detalhamento longo, para a métrica que precisa dele.
// ---------------------------------------------------------------------------
function Metrica({
  verbete,
  valor,
  forte,
  children,
}: {
  verbete: VerbeteId;
  valor: string;
  forte?: boolean;
  children?: React.ReactNode;
}) {
  const v: Verbete = GLOSSARIO[verbete];
  return (
    <div className="rel-metrica">
      <p className="topo">
        <span className="nome">
          {v.titulo}
          {v.etiqueta && <em className="etiqueta">{v.etiqueta}</em>}
        </span>
        <span className={`val${forte ? " forte" : ""}`}>{valor}</span>
      </p>
      <p className="txt">
        {v.oQue} <span className="fonte">De onde vem: {v.origem}.</span>
      </p>
      {v.ressalva && <p className="aviso">{v.ressalva}</p>}
      {children}
    </div>
  );
}

function Barras({ itens, meta }: { itens: ReportBar[]; meta?: boolean }) {
  return (
    <div className="rel-barras">
      {itens.map((b) => (
        <div className="rel-barra" key={b.label}>
          <p className="rel-barra-topo">
            <span className="nome">
              {b.label}
              {b.note && <em>{b.note}</em>}
            </span>
            <span className="valor">
              {fmtCurrencyCents(b.value)}
              <span className="pct">{fmtPercent(b.share)}</span>
            </span>
          </p>
          <span className="rel-trilha">
            <span
              className={meta ? "meta" : ""}
              style={{ width: `${(b.share * 100).toFixed(1)}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
