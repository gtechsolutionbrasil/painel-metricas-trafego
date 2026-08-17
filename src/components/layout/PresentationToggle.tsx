"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EyeOff, Presentation } from "lucide-react";

// Toggle do modo apresentação: esconde custos unitários e saldo (registro em
// lib/presentation.ts) pra mostrar o painel ao cliente. Estado na URL
// (?apresentacao=1); o próprio botão preenchido é o indicador de modo ativo.
export function PresentationToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const active = search.get("apresentacao") === "1";

  function toggle() {
    const params = new URLSearchParams(search.toString());
    if (active) params.delete("apresentacao");
    else params.set("apresentacao", "1");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      title={
        active
          ? "Modo apresentação ativo — custos unitários e saldo ocultos. Clique para voltar ao painel completo."
          : "Esconde custos unitários e saldo para apresentar o painel ao cliente"
      }
      className={`flex h-14 shrink-0 items-center gap-2 rounded-[10px] border px-4 text-sm font-semibold transition-colors ${
        active
          ? "border-brand bg-brand text-white hover:bg-brand-hover"
          : "border-line bg-surface text-ink hover:bg-surface-2"
      }`}
    >
      {active ? (
        <EyeOff size={16} aria-hidden="true" />
      ) : (
        <Presentation size={16} aria-hidden="true" className="text-brand" />
      )}
      <span className="hidden sm:inline">
        {active ? "Apresentando" : "Apresentação"}
      </span>
    </button>
  );
}
