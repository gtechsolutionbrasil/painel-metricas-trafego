import Image from "next/image";

// Assinatura oficial: ícone GTech (asset real) + wordmark composto.
// A cor do ícone é a da marca; o texto usa o ink do tema claro.
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/brand/logo_gtech_ico_.png"
        alt="GTech Solution"
        width={34}
        height={34}
        className="shrink-0"
        priority
      />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-extrabold tracking-tight text-ink">
            GTECH
            <span className="ml-1 font-medium text-muted">SOLUTION</span>
          </span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            Painel de Tráfego
          </span>
        </span>
      )}
    </span>
  );
}
