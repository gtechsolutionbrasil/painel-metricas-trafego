import Link from "next/link";
import "./report.css";
import { RelatorioControles } from "./RelatorioControles";
import { getClients, resolveClient } from "@/lib/metrics/queries";
import { getReportData, type ReportBar } from "@/lib/report/data";
import {
  GLOSSARIO,
  VISITAS_LOJA_LEITURA,
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
//
// Formato: cartões de painel, um por métrica, cada um carregando O QUE É e DE
// ONDE VEM logo abaixo do número. O cliente lê o relatório sozinho, sem o
// gestor do lado para explicar de onde saiu cada coisa.
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

  // Passos da jornada montados em lista: o número de cada etapa depende de
  // quais existem no período, e calcular isso no meio do JSX já tinha virado
  // um encadeado de ternários.
  const etapas: {
    titulo: string;
    cifra: string;
    icone: IconeId;
    estimativa?: boolean;
    corpo: React.ReactNode;
  }[] = [
    {
      titulo: "O anúncio aparece",
      cifra: `${fmtInt(t.impressions)} exibições`,
      icone: "olho",
      corpo: (
        <p>
          A pessoa está pesquisando no Google, olhando o mapa, ou rolando o
          Instagram e o Facebook.
          {data.platforms.length > 1 && google && meta
            ? ` Foram ${fmtInt(google.impressions)} exibições no Google e ${fmtInt(meta.impressions)} no Meta.`
            : ""}
          {t.reach > 0
            ? ` No Instagram e Facebook, o anúncio alcançou cerca de ${fmtInt(t.reach)} pessoas da região.`
            : ""}
        </p>
      ),
    },
    {
      titulo: "Ela clica no anúncio",
      cifra: `${fmtInt(t.clicks)} cliques`,
      icone: "clique",
      corpo: (
        <>
          {data.platforms.length > 1 && google && meta && (
            <p>
              {fmtInt(google.clicks)} cliques vieram do Google e{" "}
              {fmtInt(meta.clicks)} do Instagram e Facebook. No Google dá para
              saber exatamente em que parte do anúncio a pessoa tocou:
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
        </>
      ),
    },
  ];

  if (t.googleContacts > 0 || t.metaConversations > 0) {
    etapas.push({
      titulo: "Ela entra em contato com a loja",
      cifra: `${fmtInt(t.googleContacts)} Google · ${fmtInt(t.metaConversations)} Meta`,
      icone: "conversa",
      corpo: (
        <p>
          As plataformas atribuem por métodos diferentes. Os números aparecem
          lado a lado e não são somados como se representassem pessoas únicas.
        </p>
      ),
    });
  }

  if (t.directions > 0) {
    etapas.push({
      titulo: "Ela procura o caminho até a loja",
      cifra: `${fmtInt(t.directions)} rotas traçadas`,
      icone: "rota",
      corpo: (
        <p>
          {fmtInt(t.directions)} pessoas pediram a rota do lugar onde estavam
          até o endereço da loja, que é o sinal mais forte de intenção de ir
          comprar pessoalmente.
          {t.profileViews > 0
            ? ` Além disso, ${fmtInt(t.profileViews)} abriram o site pelo perfil`
            : ""}
          {t.profileEngagements > 0
            ? ` e ${fmtInt(t.profileEngagements)} fizeram outras interações no perfil da loja, como ver fotos, horário de funcionamento e produtos`
            : ""}
          .
        </p>
      ),
    });
  }

  if (t.storeVisits > 0) {
    etapas.push({
      titulo: "Ela vai até a loja",
      cifra: `${fmtInt(t.storeVisits)} visitas estimadas`,
      icone: "loja",
      estimativa: true,
      corpo: (
        <p>
          Estimativa do Google para quantas vezes alguém que viu ou clicou no
          anúncio esteve fisicamente na loja depois. É um modelo estatístico, e
          não uma contagem na porta — o método está explicado na seção Visitas à
          loja.
        </p>
      ),
    });
  }

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
          <div className="rel-capa-topo">
            <span className="rel-selo">Relatório de investimento</span>
            <span className="rel-chips">
              {data.platforms.length === 0 && (
                <span className="rel-chip">Sem veiculação</span>
              )}
              {data.platforms.map((p) => (
                <span className={`rel-chip ${p.platform}`} key={p.platform}>
                  {p.platform === "google" ? "Google Ads" : "Meta Ads"}
                </span>
              ))}
            </span>
          </div>
          <h1>Para onde foi o investimento em anúncios</h1>
          <p className="sub">
            {client
              ? `Prestação de contas das campanhas de ${data.clientName} no período, com o que cada real investido gerou.`
              : "Prestação de contas das campanhas no período, com o que cada real investido gerou."}{" "}
            Cada número traz, logo abaixo, o que ele significa e de onde foi
            extraído.
          </p>
          <div className="rel-periodo">
            <span>
              <em>Período</em>
              <b>
                {fmtDateLong(range.from)} a {fmtDateLong(range.to)}
              </b>
            </span>
            <span>
              <em>Duração</em>
              <b>{fmtInt(data.days)} dias</b>
            </span>
            <span>
              <em>Cliente</em>
              <b>{data.clientName}</b>
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
            <div className="rel-titular" data-secao="destaques">
              <Cifra
                verbete="investimento"
                icone="carteira"
                valor={fmtCurrencyCents(t.spend)}
                moeda
              />
              {t.googleContacts > 0 && (
                <Cifra
                  verbete="contatosGoogle"
                  icone="conversa"
                  valor={fmtInt(t.googleContacts)}
                  tom="bom"
                />
              )}
              {t.metaConversations > 0 && (
                <Cifra
                  verbete="conversasMeta"
                  icone="balao"
                  valor={fmtInt(t.metaConversations)}
                  tom="bom"
                />
              )}
              {t.directions > 0 && (
                <Cifra
                  verbete="rotas"
                  icone="rota"
                  valor={fmtInt(t.directions)}
                />
              )}
              {t.storeVisits > 0 && (
                <Cifra
                  verbete="visitasLoja"
                  icone="loja"
                  valor={fmtInt(t.storeVisits)}
                  tom="estimado"
                />
              )}
            </div>

            {mostrar("divisao") && (
              <section className="rel-secao" data-secao="divisao">
                <Cabeca
                  titulo="Como o dinheiro foi dividido entre as duas plataformas"
                  texto="O Google alcança quem já está procurando agora. O Instagram e o Facebook alcançam quem ainda não estava procurando, mas mora na região. São dois momentos diferentes do mesmo cliente."
                />

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

                <Explica verbete="divisao" />
              </section>
            )}

            {mostrar("semanas") && (
              <section
                className="rel-secao rel-quebra-antes"
                data-secao="semanas"
              >
                <Cabeca
                  titulo="Semana a semana"
                  texto="Quanto foi investido em cada semana do período, separado por plataforma."
                />
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
                <Explica verbete="semanas" />
              </section>
            )}

            {mostrar("google") && (
              <section className="rel-secao" data-secao="google">
                <Cabeca
                  titulo="Dentro do Google"
                  texto="Em que frentes o investimento do Google foi aplicado e o que as pessoas procuravam."
                />
                <h3 className="rel-subtitulo">
                  Divisão do investimento no Google
                </h3>
                <Barras itens={data.googleCampaigns} moeda />
                <Explica verbete="campanhas" />
                {data.googleAdGroups.length > 1 && (
                  <>
                    <h3 className="rel-subtitulo">
                      Dentro da busca: o que as pessoas procuravam
                    </h3>
                    <Barras itens={data.googleAdGroups} moeda />
                    <Explica verbete="temasBusca" />
                  </>
                )}
              </section>
            )}

            {mostrar("meta") && (
              <section className="rel-secao" data-secao="meta">
                <Cabeca
                  titulo="Dentro do Instagram e Facebook"
                  texto="Em que frentes o investimento do Meta foi aplicado."
                />
                <h3 className="rel-subtitulo meta">
                  Divisão do investimento no Meta
                </h3>
                <Barras itens={data.metaCampaigns} moeda meta />
                <Explica verbete="campanhas" />
              </section>
            )}

            <section className="rel-secao rel-quebra-antes" data-secao="caminho">
              <Cabeca
                titulo="O caminho que a pessoa percorre"
                texto="Do momento em que o anúncio aparece até a pessoa chegar na loja, cada passo é medido separadamente. Este é o caminho completo no período."
              />

              <div className="rel-jornada">
                {etapas.map((e, i) => (
                  <div className="rel-etapa" key={e.titulo}>
                    <div className="marcador">
                      <span className="bolha">
                        <Icone id={e.icone} />
                      </span>
                      <span className="fio" />
                    </div>
                    <div className="conteudo">
                      <div className="titulo-etapa">
                        <span className="passo">Passo {i + 1}</span>
                        <strong>{e.titulo}</strong>
                        {e.estimativa && (
                          <span className="tag-estimativa">estimativa</span>
                        )}
                      </div>
                      <span className="cifra-etapa">{e.cifra}</span>
                      {e.corpo}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {mostrar("visitas") && (
              <section
                className="rel-secao rel-quebra-antes"
                data-secao="visitas"
              >
                <Cabeca
                  titulo="Visitas à loja: o que esse número é de verdade"
                  texto="Esta é a única métrica do relatório que não conta acontecimentos — ela estima. Vale a pena entender como o Google chega nela antes de comparar com as outras."
                />

                <div className="rel-visitas-topo">
                  <div className="rel-visitas-num">
                    <span className="tag-estimativa">estimativa modelada</span>
                    <span className="num">{fmtInt(t.storeVisits)}</span>
                    <span className="desc">
                      visitas à loja estimadas no período
                    </span>
                  </div>
                  <div className="rel-visitas-frase">
                    <p>
                      O Google não conta pessoas na porta da loja. Ele observa
                      uma <b>amostra pequena</b> de aparelhos que autorizaram o
                      histórico de localização, verifica quais deles viram ou
                      clicaram no anúncio e depois estiveram dentro do perímetro
                      da loja, e{" "}
                      <b>projeta esse resultado para o público inteiro</b>.
                    </p>
                    <p>
                      Por isso o número serve para acompanhar tendência —{" "}
                      subiu ou caiu em relação ao mês anterior — e não como
                      contagem exata de quem entrou.
                    </p>
                  </div>
                </div>

                <h3 className="rel-subtitulo neutro">
                  Como o Google chega nesse número
                </h3>
                <ol className="rel-passos">
                  {VISITAS_LOJA_PASSOS.map((p, i) => (
                    <li key={p.titulo}>
                      <span className="n">{i + 1}</span>
                      <span className="txt">
                        <strong>{p.titulo}</strong>
                        <span>{p.texto}</span>
                      </span>
                    </li>
                  ))}
                </ol>

                {t.directions > 0 && (
                  <div className="rel-comparativo">
                    <div className="lado">
                      <span className="rot">Dado observado</span>
                      <span className="num">{fmtInt(t.directions)}</span>
                      <span className="desc">
                        rotas traçadas — alguém realmente tocou em “Rotas” no
                        perfil da loja
                      </span>
                    </div>
                    <div className="versus">contra</div>
                    <div className="lado estimado">
                      <span className="rot">Estimativa modelada</span>
                      <span className="num">{fmtInt(t.storeVisits)}</span>
                      <span className="desc">
                        visitas à loja — inclui quem já sabia o caminho e foi
                        direto, sem pedir rota
                      </span>
                    </div>
                  </div>
                )}

                <h3 className="rel-subtitulo neutro">
                  Como ler esse número sem se enganar
                </h3>
                <div className="rel-notas">
                  {VISITAS_LOJA_LEITURA.map((n) => (
                    <div className="rel-nota" key={n.titulo}>
                      <strong>{n.titulo}</strong>
                      <span>{n.texto}</span>
                    </div>
                  ))}
                </div>

                <Explica verbete="visitasLoja" />
              </section>
            )}

            <section
              className="rel-secao rel-quebra-antes"
              data-grupo="placar contatos"
            >
              <Cabeca
                titulo="O que esse investimento gerou"
                texto="Os números do período, cada um com o que ele significa e de onde foi extraído."
              />

              <div className="rel-placar" data-secao="placar">
                <Metrica
                  verbete="visualizacoes"
                  icone="olho"
                  valor={fmtInt(t.impressions)}
                />
                {t.reach > 0 && (
                  <Metrica
                    verbete="alcance"
                    icone="pessoas"
                    valor={fmtInt(t.reach)}
                  />
                )}
                <Metrica
                  verbete="cliques"
                  icone="clique"
                  valor={fmtInt(t.clicks)}
                />
                {t.googleContacts > 0 && (
                  <Metrica
                    verbete="contatosGoogle"
                    icone="conversa"
                    valor={fmtInt(t.googleContacts)}
                    tom="bom"
                  />
                )}
                {t.metaConversations > 0 && (
                  <Metrica
                    verbete="conversasMeta"
                    icone="balao"
                    valor={fmtInt(t.metaConversations)}
                    tom="bom"
                  />
                )}
                {t.directions > 0 && (
                  <Metrica
                    verbete="rotas"
                    icone="rota"
                    valor={fmtInt(t.directions)}
                  />
                )}
                {t.storeVisits > 0 && (
                  <Metrica
                    verbete="visitasLoja"
                    icone="loja"
                    valor={fmtInt(t.storeVisits)}
                    tom="estimado"
                  />
                )}
                {t.profileViews > 0 && (
                  <Metrica
                    verbete="visitasSite"
                    icone="link"
                    valor={fmtInt(t.profileViews)}
                  />
                )}
                {t.profileEngagements > 0 && (
                  <Metrica
                    verbete="interacoesPerfil"
                    icone="estrela"
                    valor={fmtInt(t.profileEngagements)}
                  />
                )}
              </div>

              {mostrar("contatos") && (
                <div className="rel-tabela-wrap" data-secao="contatos">
                  <table>
                    <caption>Resultados de contato por plataforma</caption>
                    <thead>
                      <tr>
                        <th scope="col">Ação da pessoa</th>
                        {google && <th className="n">Google</th>}
                        {meta && <th className="n">Meta</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.contactRows.map((r) => (
                        <tr key={r.label}>
                          <td>{r.label}</td>
                          {google && <td className="n">{r.google || "—"}</td>}
                          {meta && <td className="n">{r.meta || "—"}</td>}
                        </tr>
                      ))}
                      <tr className="somatorio">
                        <td>Leituras por plataforma (não somar)</td>
                        {google && (
                          <td className="n">
                            {fmtInt(
                              data.contactRows.reduce(
                                (s, r) => s + r.google,
                                0,
                              ),
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

            {mostrar("fundos") && (
              <section className="rel-secao" data-secao="fundos">
                <Cabeca
                  titulo="Fundos disponíveis nas contas"
                  texto={`Quanto ainda resta de saldo em cada plataforma para os anúncios continuarem no ar, na posição de ${emitido}.`}
                />
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
                <Explica verbete="saldo" />
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

// ---------------------------------------------------------------------------
// Peças do documento
// ---------------------------------------------------------------------------

function Cabeca({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rel-cabeca">
      <h2>{titulo}</h2>
      <p>{texto}</p>
    </div>
  );
}

// O explicativo padrão de toda métrica: o que é, de onde vem e — quando a
// leitura ingênua erra — a ressalva em destaque.
function Explica({
  verbete,
  compacto,
}: {
  verbete: VerbeteId;
  compacto?: boolean;
}) {
  const v: Verbete = GLOSSARIO[verbete];
  return (
    <dl className={`rel-explica${compacto ? " compacto" : ""}`}>
      <div>
        <dt>O que é</dt>
        <dd>{v.oQue}</dd>
      </div>
      <div>
        <dt>De onde vem</dt>
        <dd>{v.origem}</dd>
      </div>
      {v.ressalva && (
        <div className="atencao">
          <dt>Atenção</dt>
          <dd>{v.ressalva}</dd>
        </div>
      )}
    </dl>
  );
}

// Cartão grande do topo: número em evidência, explicativo curto embaixo.
function Cifra({
  verbete,
  icone,
  valor,
  tom,
  moeda,
}: {
  verbete: VerbeteId;
  icone: IconeId;
  valor: string;
  tom?: "bom" | "estimado";
  moeda?: boolean;
}) {
  const v: Verbete = GLOSSARIO[verbete];
  return (
    <div className={`rel-cifra${tom ? ` ${tom}` : ""}${moeda ? " moeda" : ""}`}>
      <span className="rotulo">
        <Icone id={icone} />
        {v.titulo}
        {tom === "estimado" && (
          <span className="tag-estimativa">estimativa</span>
        )}
      </span>
      <span className="valor">{valor}</span>
      <span className="nota">{v.oQue}</span>
    </div>
  );
}

// Cartão do placar: mesmo número, mas com o explicativo completo. É onde o
// cliente vai quando não entendeu de onde saiu algo.
function Metrica({
  verbete,
  icone,
  valor,
  tom,
}: {
  verbete: VerbeteId;
  icone: IconeId;
  valor: string;
  tom?: "bom" | "estimado";
}) {
  const v: Verbete = GLOSSARIO[verbete];
  return (
    <div className={`celula${tom ? ` ${tom}` : ""}`}>
      <span className="topo">
        <Icone id={icone} />
        <span className="titulo">{v.titulo}</span>
        {tom === "estimado" && (
          <span className="tag-estimativa">estimativa</span>
        )}
      </span>
      <span className="num">{valor}</span>
      <Explica verbete={verbete} compacto />
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

// ---------------------------------------------------------------------------
// Ícones. Traçado de 1.6px, 24x24, herdando a cor do texto — o mesmo desenho
// serve no cartão claro e no cartão colorido, e some bem na impressão P&B.
// ---------------------------------------------------------------------------
const ICONES = {
  carteira:
    "M3.5 8h15a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 18V6.5A1.5 1.5 0 0 1 4.5 5h11.6M20.5 12h-3.3a1.75 1.75 0 0 0 0 3.5h3.3",
  olho: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  pessoas:
    "M15.5 19.5v-1.2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v1.2M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm11 8.5v-1.2a4 4 0 0 0-3-3.87M15.5 4.8a4 4 0 0 1 0 7.75",
  clique: "M8 3.5 19.5 12l-5.2 1.3 2.6 5.2-2.6 1.3-2.6-5.2-3.7 3.7V3.5Z",
  conversa:
    "M20.5 11.6a7.9 7.9 0 0 1-11.5 7.05L4 20l1.35-4.4A7.9 7.9 0 1 1 20.5 11.6Z",
  balao: "M20.5 14.5a2 2 0 0 1-2 2H8l-4.5 4V5.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9Z",
  rota: "M3.5 11 20.5 3.5 13 20.5l-1.9-7.6L3.5 11Z",
  loja: "M4.5 9.5h15v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9Zm-1.2 0 1.6-5h14.2l1.6 5a2.4 2.4 0 0 1-4.3 1.35 2.4 2.4 0 0 1-4.4 0 2.4 2.4 0 0 1-4.4 0A2.4 2.4 0 0 1 3.3 9.5Z",
  link: "M10.2 13.3a4.6 4.6 0 0 0 6.5 0l2.7-2.7a4.6 4.6 0 0 0-6.5-6.5l-1 1M13.8 10.7a4.6 4.6 0 0 0-6.5 0l-2.7 2.7a4.6 4.6 0 0 0 6.5 6.5l1-1",
  estrela: "m12 3.5 2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.9l6-.9L12 3.5Z",
} as const;

type IconeId = keyof typeof ICONES;

function Icone({ id }: { id: IconeId }) {
  return (
    <svg
      className="rel-icone"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONES[id]} />
    </svg>
  );
}
