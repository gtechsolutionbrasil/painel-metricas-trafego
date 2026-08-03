"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";

// Abre o relatório de prestação de contas já com o cliente e o período que
// estão selecionados no painel. De lá o botão "Baixar PDF" faz o resto.
export function ExportReportButton() {
  const search = useSearchParams();
  const params = new URLSearchParams();
  for (const key of ["client", "from", "to", "days"]) {
    const v = search.get(key);
    if (v) params.set(key, v);
  }
  const qs = params.toString();

  return (
    <Link
      href={`/relatorio${qs ? `?${qs}` : ""}`}
      target="_blank"
      title="Gerar o relatório do cliente para enviar em PDF"
      className="flex h-14 shrink-0 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
    >
      <FileText size={16} className="text-brand" />
      <span className="hidden sm:inline">Relatório</span>
    </Link>
  );
}
