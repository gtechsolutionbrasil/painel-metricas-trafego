"use client";

// Botão de exportar: usa a impressão do navegador, que já gera PDF com
// qualidade de vetor (texto selecionável) a partir do CSS @media print.
export function PrintButton() {
  return (
    <button type="button" className="rel-btn primario" onClick={() => window.print()}>
      Baixar PDF
    </button>
  );
}
