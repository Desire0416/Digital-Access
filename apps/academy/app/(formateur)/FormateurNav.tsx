"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, ClipboardCheck } from "lucide-react";
import { cn } from "@da/ui";

/* Sous-navigation du studio formateur — composant client pour l'état actif
   (le layout est un Server Component et ne peut pas lire le pathname). */

const SUBNAV = [
  { label: "Tableau de bord", href: "/formateur", icon: LayoutDashboard, exact: true },
  { label: "Mes formations", href: "/formateur/formations", icon: BookOpen },
  { label: "Apprenants", href: "/formateur/apprenants", icon: Users },
  { label: "Corrections", href: "/correction", icon: ClipboardCheck },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FormateurNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation formateur"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
    >
      {SUBNAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "border-transparent bg-gradient-da text-white shadow-brand"
                : "border-navy/[0.08] bg-surface-primary text-navy/70 hover:border-brand-blue-vif/40 hover:text-navy",
            )}
          >
            <Icon size={15} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
