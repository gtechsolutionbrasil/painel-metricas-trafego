"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Building2,
  ContactRound,
  Globe,
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { GoogleAdsIcon, MetaAdsIcon } from "@/components/brand/ChannelIcons";

// Aceita tanto ícones lucide quanto os SVGs de marca (mesma assinatura).
type NavIcon = React.ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;
type NavItem = { href: string; label: string; icon: NavIcon; brand?: boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/google", label: "Google Ads", icon: GoogleAdsIcon, brand: true },
  { href: "/meta", label: "Meta Ads", icon: MetaAdsIcon, brand: true },
  { href: "/site", label: "Sites", icon: Globe },
  { href: "/crm", label: "CRM", icon: ContactRound },
  { href: "/clientes", label: "Integrações", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const search = useSearchParams();
  // Params efêmeros (feedback de uma ação) não devem "viajar" entre páginas.
  const params = new URLSearchParams(search.toString());
  params.delete("deleted");
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";

  return (
    <>
      <aside className="hidden w-[252px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-line px-5">
        <Link href={`/${suffix}`} className="inline-flex">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
          Painel
        </p>
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`${item.href}${suffix}`}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "border border-brand-border bg-brand-soft text-brand-ink"
                  : "border border-transparent text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {item.brand ? (
                // Logos de marca: cor própria (não seguem o estado ativo),
                // levemente esmaecidos quando inativos.
                <Icon size={18} className={active ? "" : "opacity-60"} aria-hidden="true" />
              ) : (
                <Icon
                  size={18}
                  strokeWidth={2.2}
                  className={active ? "text-brand" : "text-faint"}
                  aria-hidden="true"
                />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-2.5 rounded-[10px] bg-surface-2 px-3 py-2.5">
          <BarChart3 size={16} className="text-brand" aria-hidden="true" />
          <p className="text-xs text-muted">
            Dados de <span className="font-semibold text-ink">Google</span>,{" "}
            <span className="font-semibold text-ink">Meta</span> e do{" "}
            <span className="font-semibold text-ink">site</span>
          </p>
        </div>
      </div>
      </aside>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-line bg-surface/95 px-1 pb-[max(4px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const shortLabel =
            item.href === "/" ? "Geral" : item.href === "/clientes" ? "Tracking" : item.label.replace(" Ads", "");
          return (
            <Link
              key={`mobile-${item.href}`}
              href={`${item.href}${suffix}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-bold ${
                active ? "bg-brand-soft text-brand-ink" : "text-muted"
              }`}
            >
              <Icon
                size={18}
                strokeWidth={item.brand ? undefined : 2.2}
                className={item.brand ? (active ? "" : "opacity-60") : active ? "text-brand" : "text-faint"}
                aria-hidden="true"
              />
              <span className="truncate">{shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
