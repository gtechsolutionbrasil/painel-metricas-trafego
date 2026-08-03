"use client";

// Botão de exportar: usa a impressão do navegador, que já gera PDF com
// qualidade de vetor (texto selecionável) a partir do CSS @media print.
export function PrintButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      className="rel-btn primario"
      disabled={disabled}
      title={
        disabled ? "Marque ao menos uma seção para gerar o PDF" : undefined
      }
      onClick={() => window.print()}
    >
      Baixar PDF
    </button>
  );
}
