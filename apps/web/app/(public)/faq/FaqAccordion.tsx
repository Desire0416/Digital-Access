"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@da/ui";
import type { FaqItem } from "@/lib/content";

/**
 * Accordéon FAQ interactif : questions groupées par catégorie, onglets de filtre
 * en dégradé, ouverture animée (hauteur + fondu) et chevron pivotant.
 * Identité DA — jamais un accordéon shadcn par défaut.
 */

interface Group {
  category: string;
  items: FaqItem[];
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  // Regroupe par catégorie en conservant l'ordre d'apparition.
  const groups = React.useMemo<Group[]>(() => {
    const map = new Map<string, FaqItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map, ([category, list]) => ({ category, items: list }));
  }, [items]);

  const categories = React.useMemo(
    () => ["Tout", ...groups.map((g) => g.category)],
    [groups],
  );

  const [active, setActive] = React.useState<string>("Tout");
  // Clé unique par question ouverte (une seule ouverte à la fois).
  const [open, setOpen] = React.useState<string | null>(null);

  const visibleGroups =
    active === "Tout" ? groups : groups.filter((g) => g.category === active);

  return (
    <div>
      {/* Onglets de filtre par catégorie */}
      <div className="mb-10 flex flex-wrap justify-center gap-2.5">
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActive(cat);
                setOpen(null);
              }}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "text-white"
                  : "text-text-secondary hover:text-navy",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="faq-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-da shadow-brand"
                />
              )}
              {!isActive && (
                <span className="absolute inset-0 -z-10 rounded-full border border-navy/[0.1] bg-surface-primary" />
              )}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Groupes de questions */}
      <div className="mx-auto max-w-3xl space-y-12">
        {visibleGroups.map((group) => (
          <section key={group.category}>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-6 rounded-full bg-gradient-da" />
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-blue-royal">
                {group.category}
              </h2>
            </div>

            <div className="space-y-3">
              {group.items.map((item) => {
                const key = `${group.category}:${item.question}`;
                const isOpen = open === key;
                return (
                  <div
                    key={key}
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-surface-primary transition-colors",
                      isOpen
                        ? "card-gradient-border shadow-lg"
                        : "border-navy/[0.08] hover:border-brand-blue-vif/40",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : key)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span
                        className={cn(
                          "flex-1 font-display text-base font-bold transition-colors sm:text-lg",
                          isOpen ? "text-navy" : "text-navy/90",
                        )}
                      >
                        {item.question}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                          isOpen
                            ? "bg-gradient-da text-white"
                            : "bg-brand-blue-vif/10 text-brand-blue-royal",
                        )}
                      >
                        <ChevronDown size={18} strokeWidth={2.5} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <p className="px-5 pb-5 text-[15px] leading-relaxed text-text-secondary sm:px-6 sm:pb-6">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
