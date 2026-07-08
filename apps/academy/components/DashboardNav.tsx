"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Rocket, Fingerprint, Medal, ScrollText, FolderKanban, Briefcase } from "lucide-react";
import { cn } from "@da/ui";

const TABS = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/mes-cours", label: "Mes cours", icon: BookOpen },
  { href: "/dashboard/projets", label: "Projets", icon: Rocket },
  { href: "/dashboard/passeport", label: "Passeport", icon: Fingerprint },
  { href: "/dashboard/badges", label: "Badges", icon: Medal },
  { href: "/dashboard/certificats", label: "Certificats", icon: ScrollText },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: FolderKanban },
  { href: "/dashboard/opportunites", label: "Opportunités", icon: Briefcase },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-navy/10">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "relative flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active ? "text-brand-blue-royal" : "text-text-secondary hover:text-navy",
                )}
              >
                <Icon size={16} />
                {t.label}
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-da" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
