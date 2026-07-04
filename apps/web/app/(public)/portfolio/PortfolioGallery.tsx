"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { cn } from "@da/ui";
import { PortfolioCard } from "@/components/PortfolioCard";
import type { PortfolioItem } from "@da/db";

const ALL = "Tous";

/**
 * Galerie interactive de réalisations : filtres par catégorie (état actif en
 * dégradé signature) + grille animée avec AnimatePresence au changement de filtre.
 */
export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  // Catégories uniques dérivées des items, dans l'ordre d'apparition.
  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const item of items) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        ordered.push(item.category);
      }
    }
    return [ALL, ...ordered];
  }, [items]);

  const [active, setActive] = React.useState<string>(ALL);

  const filtered = React.useMemo(
    () =>
      active === ALL ? items : items.filter((item) => item.category === active),
    [items, active],
  );

  return (
    <div>
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {categories.map((category) => {
          const isActive = active === category;
          const count =
            category === ALL
              ? items.length
              : items.filter((i) => i.category === category).length;

          return (
            <motion.button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              whileTap={{ scale: 0.95 }}
              aria-pressed={isActive}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif focus-visible:ring-offset-2",
                isActive
                  ? "text-white"
                  : "border border-navy/10 bg-surface-primary text-navy hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="portfolio-filter-pill"
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-da shadow-brand"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {category === ALL && <LayoutGrid size={15} />}
              <span>{category}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.7rem] font-bold leading-none tabular-nums",
                  isActive ? "bg-white/20 text-white" : "bg-navy/[0.06] text-text-secondary",
                )}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Grille filtrée animée */}
      <div className="mt-12 min-h-[20rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <PortfolioCard item={item} index={i} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
