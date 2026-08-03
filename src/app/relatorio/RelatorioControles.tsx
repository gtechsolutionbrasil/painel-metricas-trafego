"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { PrintButton } from "./PrintButton";
import {
  parseHidden,
  REPORT_SECTIONS,
  STORAGE_PREFIX,
  serializeHidden,
  type SectionId,
} from "@/lib/report/sections";

// localStorage é uma store externa: ler por useSyncExternalStore evita mexer
// em estado dentro de efeito e resolve a hidratação (no servidor o snapshot é
// sempre nulo, e o React re-renderiza com o valor real no cliente).
const subscribeStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

// ---------------------------------------------------------------------------
// Controles do relatório: escolher o que sai e baixar o PDF.
//
// O servidor renderiza TUDO que tem dado; esconder é só CSS (data-off na raiz
// .rel). Assim marcar uma caixa não recarrega a página — antes cada clique
// disparava as 5 queries do relatório de novo — e a tela nunca pisca.
//
// A escolha fica em três lugares, nessa ordem de prioridade: o que veio na URL
// (?ocultar=), o que ficou salvo no navegador para aquele cliente, e o padrão
// (nada oculto). Vive dentro de .rel-acoes, que já some na impressão.
// ---------------------------------------------------------------------------
export function RelatorioControles({
  disponiveis,
  ocultasIniciais,
  temParamNaUrl,
  clienteKey,
}: {
  disponiveis: SectionId[];
  ocultasIniciais: SectionId[];
  temParamNaUrl: boolean;
  clienteKey: string;
}) {
  const chave = `${STORAGE_PREFIX}${clienteKey}`;
  // null enquanto o gestor não mexeu nesta aba: a escolha vem da URL ou, na
  // falta dela, do que ficou salvo para este cliente.
  const [escolha, setEscolha] = useState<Set<SectionId> | null>(null);
  const [open, setOpen] = useState(false);
  // Quem nasceu com a quebra de página, para conseguir devolvê-la depois.
  const portadores = useRef<HTMLElement[] | null>(null);

  const salvo = useSyncExternalStore(
    subscribeStorage,
    () => {
      try {
        return window.localStorage.getItem(chave);
      } catch {
        // localStorage bloqueado (aba anônima, política do navegador)
        return null;
      }
    },
    () => null,
  );

  // useMemo porque o efeito de aplicação depende deste Set: sem ele, um Set
  // novo a cada render reaplicaria tudo em loop.
  const hidden = useMemo(
    () =>
      escolha ??
      (temParamNaUrl
        ? new Set(ocultasIniciais)
        : parseHidden(salvo ?? undefined)),
    [escolha, temParamNaUrl, ocultasIniciais, salvo],
  );

  const disp = new Set(disponiveis);
  const visiveis = disponiveis.filter((id) => !hidden.has(id));

  const aplicar = useCallback(() => {
    const raiz = document.querySelector<HTMLElement>(".rel");
    const folha = document.querySelector<HTMLElement>(".rel-folha");
    if (!raiz || !folha) return;

    const ocultas = [...hidden];
    if (ocultas.length > 0) raiz.dataset.off = ocultas.join(" ");
    else delete raiz.dataset.off;

    // Bloco que agrupa mais de uma seção (placar + contatos dividem a mesma
    // <section>): some só quando todas as suas seções estão desligadas, senão
    // sobraria o cabeçalho sozinho.
    for (const el of folha.querySelectorAll<HTMLElement>("[data-grupo]")) {
      const ids = (el.dataset.grupo ?? "").split(" ").filter(Boolean);
      el.hidden =
        ids.length > 0 && ids.every((id) => hidden.has(id as SectionId));
    }

    // Quebra de página: se a seção que a carregava saiu, ela passa para a
    // próxima seção visível, senão o PDF perde a quebra ou ganha página vazia.
    const filhos = [...folha.children] as HTMLElement[];
    if (!portadores.current) {
      portadores.current = filhos.filter((el) =>
        el.classList.contains("rel-quebra-antes"),
      );
    }
    const visivel = (el: HTMLElement) => {
      if (el.hidden) return false;
      const secao = el.dataset.secao as SectionId | undefined;
      if (secao) return !hidden.has(secao);
      const grupo = el.dataset.grupo;
      if (grupo)
        return !grupo
          .split(" ")
          .filter(Boolean)
          .every((id) => hidden.has(id as SectionId));
      return true;
    };
    for (const el of filhos) el.classList.remove("rel-quebra-antes");
    for (const portador of portadores.current) {
      let i = filhos.indexOf(portador);
      let alvo: HTMLElement | undefined = filhos[i];
      while (alvo && !visivel(alvo)) alvo = filhos[++i];
      if (alvo) alvo.classList.add("rel-quebra-antes");
    }

    // URL e navegador em dia com a tela, sem navegação do Next.
    const url = new URL(window.location.href);
    const valor = serializeHidden(hidden);
    if (valor) url.searchParams.set("ocultar", valor);
    else url.searchParams.delete("ocultar");
    window.history.replaceState(null, "", url);

    // Só grava depois que o gestor mexeu: abrir o relatório não pode
    // sobrescrever a preferência que já estava salva.
    if (escolha) {
      try {
        if (valor) window.localStorage.setItem(chave, valor);
        else window.localStorage.removeItem(chave);
      } catch {
        // sem localStorage a escolha vale só para esta aba
      }
    }
  }, [chave, escolha, hidden]);

  useEffect(() => {
    aplicar();
  }, [aplicar]);

  function alternar(id: SectionId) {
    if (!disp.has(id)) return; // seção sem dado não liga nem desliga
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEscolha(next);
  }

  if (disponiveis.length === 0) return <PrintButton />;

  const nadaVisivel = visiveis.length === 0;

  return (
    <>
      {nadaVisivel && (
        <b className="rel-alerta">Nada marcado: o PDF sai só com a capa.</b>
      )}

      <span className="rel-picker">
        <button
          type="button"
          className="rel-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          Seções ({visiveis.length} de {disponiveis.length})
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Fechar"
              className="rel-picker-fundo"
              onClick={() => setOpen(false)}
            />
            <div className="rel-picker-menu">
              <div className="rel-picker-topo">
                <strong>O que sai no relatório</strong>
                <span className="rel-picker-atalhos">
                  <button type="button" onClick={() => setEscolha(new Set())}>
                    Marcar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscolha(new Set(disponiveis))}
                  >
                    Limpar
                  </button>
                </span>
              </div>

              <ul className="rel-picker-lista">
                {REPORT_SECTIONS.map((s) => {
                  const indisponivel = !disp.has(s.id);
                  return (
                    <li key={s.id}>
                      <label
                        className={indisponivel ? "indisponivel" : undefined}
                      >
                        <input
                          type="checkbox"
                          checked={!indisponivel && !hidden.has(s.id)}
                          disabled={indisponivel}
                          onChange={() => alternar(s.id)}
                        />
                        <span className="txt">
                          <strong>{s.label}</strong>
                          <em>{indisponivel ? s.motivo : s.hint}</em>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </span>

      <PrintButton disabled={nadaVisivel} />
    </>
  );
}
