"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Globe,
  LayoutDashboard,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/trafego-pago", label: "Tráfego pago", icon: Megaphone },
  { href: "/analytics", label: "Analytics web", icon: Globe },
];

export function Sidebar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const qs = search.toString();
  const suffix = qs ? `?${qs}` : "";

  return (
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
              <Icon
                size={18}
                strokeWidth={2.2}
                className={active ? "text-brand" : "text-faint"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-2.5 rounded-[10px] bg-surface-2 px-3 py-2.5">
          <BarChart3 size={16} className="text-brand" />
          <p className="text-xs text-muted">
            Dados de <span className="font-semibold text-ink">Meta</span>,{" "}
            <span className="font-semibold text-ink">Google</span> e{" "}
            <span className="font-semibold text-ink">GA4</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
