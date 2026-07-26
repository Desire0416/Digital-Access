"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

/* ══════════════════════════════════════════════════════════════════════════
   MobileTabBar — barre d'onglets basse façon application native (@da/ui).
   Purement présentationnelle : reçoit les onglets + le pathname courant (la
   config de navigation vit dans chaque app). Indicateur actif = dégradé DA
   (layoutId partagé), pastille de badge, safe-area en bas, cible tactile ≥ 56px.

   Positionnée `fixed inset-x-0 bottom-0`. IMPORTANT : la monter HORS de tout
   parent transformé (PageTransition, backdrop-blur) — l'app la rend via portail
   ou en frère du <main>, jamais à l'intérieur du contenu animé.
   ══════════════════════════════════════════════════════════════════════════ */

export interface MobileTab {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Onglet de navigation. */
  href?: string;
  /** Onglet d'action (ex. « Menu » ouvrant une bottom-sheet). Ignoré si href. */
  onClick?: () => void;
  /** Compteur (notifications). */
  badge?: number;
}

export interface MobileTabBarProps {
  tabs: MobileTab[];
  pathname: string;
  /** id du layoutId de l'indicateur actif — unique par montage. */
  indicatorId?: string;
  className?: string;
}

function tabIsActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileTabBar({ tabs, pathname, indicatorId = "mobile-tab-active", className }: MobileTabBarProps) {
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[90] border-t border-navy/[0.07] bg-surface-primary/95 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(26,26,46,0.35)]",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const active = tabIsActive(pathname, tab.href);
          const Icon = tab.icon;
          const inner = (
            <span className="relative flex w-full flex-col items-center gap-1 py-2">
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : indicatorId}
                  className="absolute top-0 h-0.5 w-9 rounded-full bg-gradient-da"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  aria-hidden
                />
              )}
              <span className="relative grid h-6 place-items-center">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 2}
                  className={active ? "text-brand-blue-royal" : "text-text-muted"}
                  aria-hidden
                />
                {tab.badge ? (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tracking-tight",
                  active ? "text-navy" : "text-text-muted",
                )}
              >
                {tab.label}
              </span>
            </span>
          );

          return (
            <li key={tab.key} className="flex flex-1">
              {tab.href ? (
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-1 items-stretch transition-transform active:scale-90"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={tab.onClick}
                  className="flex flex-1 items-stretch transition-transform active:scale-90"
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
