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
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { cn, Avatar } from "@da/ui";
import { PageTransition } from "@/components/PageTransition";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille de navigation de l'espace apprenant (§16). Barre latérale REPLIABLE
   sur desktop (rail d'icônes ↔ pleine largeur, état mémorisé), onglets
   défilables sur mobile. Le contenu (`children`) occupe tout l'espace restant
   et s'élargit quand la barre est repliée. État actif = dégradé signature DA.
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

const STORAGE_KEY = "da-espace-nav-collapsed";

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
  children,
}: {
  items: readonly EspaceNavItem[];
  user: { name: string; email: string; avatar: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* localStorage indisponible → barre dépliée par défaut */
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* no-op */
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* ── Rail de navigation ── */}
      <div
        className={cn(
          "lg:shrink-0 lg:transition-[width] lg:duration-300 lg:ease-in-out",
          collapsed ? "lg:w-[68px]" : "lg:w-[248px]",
        )}
      >
        {/* Mobile : onglets défilables (plein-bord aligné sur le padding du Container : px-5). */}
        <div className="lg:hidden">
          <div className="-mx-5 mb-1 flex items-center gap-3 px-5 pb-4">
            <Avatar name={user.name} src={user.avatar ?? undefined} className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-navy">{user.name}</p>
              <p className="truncate text-xs text-text-secondary">{user.email}</p>
            </div>
          </div>
          <nav
            aria-label="Navigation de l'espace"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

        {/* Desktop : barre latérale sticky repliable */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            {/* Carte identité + bouton replier */}
            <div
              className={cn(
                "mb-3 flex items-center rounded-2xl border border-navy/[0.07] bg-surface-primary",
                collapsed ? "justify-center p-2" : "gap-3 p-4",
              )}
            >
              <Avatar name={user.name} src={user.avatar ?? undefined} className="h-11 w-11 shrink-0" />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-navy">{user.name}</p>
                  <p className="truncate text-xs text-text-secondary">{user.email}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggle}
              aria-pressed={collapsed}
              title={collapsed ? "Déplier le menu" : "Replier le menu"}
              className={cn(
                "mb-2 flex items-center rounded-xl border border-navy/[0.07] bg-surface-primary py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal",
                collapsed ? "w-full justify-center px-0" : "w-full justify-start gap-2 px-3.5",
              )}
            >
              {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
              {!collapsed && "Replier le menu"}
            </button>

            <nav aria-label="Navigation de l'espace" className="space-y-1">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center rounded-xl text-sm font-semibold transition-colors",
                      collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5",
                      active ? "text-white" : "text-navy/70 hover:bg-navy/[0.04] hover:text-navy",
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
                    <span className={cn("relative z-10 flex items-center", collapsed ? "" : "gap-3")}>
                      <Icon size={17} className={active ? "text-white" : "text-brand-blue-royal"} aria-hidden />
                      {!collapsed && item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      </div>

      {/* ── Contenu (occupe tout l'espace restant) ── */}
      {/* overflow-x-clip UNIQUEMENT sur mobile : empêche tout débordement
          horizontal accidentel du contenu (barre latérale masquée ici) sans
          casser le `position: sticky` de la barre desktop (dans le rail). */}
      <div className="min-w-0 flex-1 overflow-x-clip lg:overflow-x-visible">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
