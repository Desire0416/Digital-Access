"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@da/ui";
import type { CareerPathCard, ShortCourseCard } from "@/lib/types";
import { CareerPathCardView, ShortCourseCardView } from "@/components/cards";

/* Section à onglets « Nouveautés & populaires » (façon Coursera). Le parent
   affiche le titre ; ce composant rend uniquement les onglets + la grille. */

export interface TrendingTab {
  key: string;
  label: string;
  paths?: CareerPathCard[];
  shorts?: ShortCourseCard[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function TrendingTabs({
  tabs,
  className,
}: {
  tabs: TrendingTab[];
  className?: string;
}) {
  const [activeKey, setActiveKey] = React.useState(tabs[0]?.key);

  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  if (!active) return null;

  const isPaths = Array.isArray(active.paths);
  const paths = active.paths ?? [];
  const shorts = active.shorts ?? [];
  const isEmpty = isPaths ? paths.length === 0 : shorts.length === 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Onglets — défilement horizontal sans débordement sur mobile */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label="Nouveautés et populaires"
          className="inline-flex min-w-full items-center gap-2 sm:min-w-0 sm:flex-wrap"
        >
          {tabs.map((tab) => {
            const selected = tab.key === active.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveKey(tab.key)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/50",
                  selected ? "text-white" : "text-text-secondary hover:text-navy",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="trending-tab-pill"
                    className="absolute inset-0 rounded-full bg-navy"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille de l'onglet actif — transition douce au changement d'onglet */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-navy/[0.12] bg-surface-secondary px-6 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                  <Sparkles size={22} />
                </span>
                <p className="font-display text-base font-bold text-navy">Bientôt disponible</p>
                <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
                  De nouvelles pépites arrivent dans cette catégorie. Revenez très vite.
                </p>
              </div>
            ) : isPaths ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paths.map((p) => (
                  <CareerPathCardView key={p.id} path={p} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {shorts.map((c) => (
                  <ShortCourseCardView key={c.id} course={c} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
