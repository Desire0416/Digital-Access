"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Route,
  FolderKanban,
  ClipboardCheck,
  Award,
  BadgeCheck,
  Briefcase,
  Heart,
  Settings,
  Sparkles,
  Target,
  UsersRound,
  CalendarDays,
  MessagesSquare,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { cn, Avatar } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Sous-navigation de l'espace apprenant (§16). Barre latérale sur desktop,
   onglets défilables sur mobile. Reprend userNav de site.ts. En-tête
   avatar + nom. État actif souligné par le dégradé signature DA.
   ══════════════════════════════════════════════════════════════════════════ */

const NAV_ICONS: Record<string, LucideIcon> = {
  "/espace": LayoutDashboard,
  "/espace/formations": BookOpen,
  "/espace/parcours": Route,
  "/espace/cohortes": UsersRound,
  "/espace/agenda": CalendarDays,
  "/espace/communaute": MessagesSquare,
  "/espace/projets": FolderKanban,
  "/espace/evaluations": ClipboardCheck,
  "/espace/certificats": Award,
  "/espace/equivalences": BadgeCheck,
  "/espace/competences": Target,
  "/espace/portfolio": Briefcase,
  "/espace/favoris": Heart,
  "/espace/recommandations": Sparkles,
  "/espace/support": LifeBuoy,
  "/espace/parametres": Settings,
};

export interface EspaceNavItem {
  label: string;
  href: string;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/espace") return pathname === "/espace";
  return pathname === href || pathname.startsWith(href + "/");
}

export function EspaceNav({
  items,
  user,
}: {
  items: readonly EspaceNavItem[];
  user: { name: string; email: string; avatar: string | null };
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <>
      {/* ── Desktop : barre latérale sticky ── */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          {/* Carte identité */}
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-4">
            <Avatar name={user.name} src={user.avatar ?? undefined} className="h-12 w-12 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-navy">{user.name}</p>
              <p className="truncate text-xs text-text-secondary">{user.email}</p>
            </div>
          </div>

          <nav aria-label="Navigation de l'espace" className="space-y-1">
            {items.map((item) => {
              const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "text-white"
                      : "text-navy/70 hover:bg-navy/[0.04] hover:text-navy",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={reduce ? undefined : "espace-nav-active"}
                      className="absolute inset-0 rounded-xl bg-gradient-da shadow-brand"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon size={17} className={active ? "text-white" : "text-brand-blue-royal"} aria-hidden />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── Mobile : onglets défilables ── */}
      <div className="lg:hidden">
        <div className="-mx-4 mb-1 flex items-center gap-3 px-4 pb-4">
          <Avatar name={user.name} src={user.avatar ?? undefined} className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-navy">{user.name}</p>
            <p className="truncate text-xs text-text-secondary">{user.email}</p>
          </div>
        </div>
        <nav
          aria-label="Navigation de l'espace"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-gradient-da text-white shadow-brand"
                    : "border border-navy/[0.08] bg-surface-primary text-navy/70 hover:text-navy",
                )}
              >
                <Icon size={15} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
