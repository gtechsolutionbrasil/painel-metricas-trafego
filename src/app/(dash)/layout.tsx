import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getClients } from "@/lib/metrics/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function DashLayout({
  children,
}: {
  children: ReactNode;
}) {
  const clients = await getClients();

  return (
    <div className="flex min-h-screen">
      <a
        href="#conteudo-principal"
        className="sr-only z-[100] rounded-md bg-ink px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir para o conteúdo
      </a>
      <Suspense fallback={<div className="hidden w-[252px] border-r border-line bg-surface lg:block" />}>
        <Sidebar />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-16 border-b border-line bg-surface" />}>
          <Topbar clients={clients} />
        </Suspense>

        {!isSupabaseConfigured && <DemoBanner />}

        <main
          id="conteudo-principal"
          className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:pb-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="border-b border-brand-border bg-brand-soft px-4 py-2 text-center text-[13px] text-brand-ink sm:px-6">
      <span className="font-semibold">Modo demonstração</span> — exibindo dados
      de exemplo. Configure o Supabase em <code>.env.local</code> para usar dados
      reais.
    </div>
  );
}
