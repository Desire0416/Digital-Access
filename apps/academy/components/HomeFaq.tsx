"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@da/ui";

/* Accordéon FAQ d'accueil (façon « Frequently asked questions » Coursera).
   Un seul item ouvert à la fois ; le parent affiche le titre de section. */

const EASE = [0.22, 1, 0.36, 1] as const;

export interface HomeFaqItem {
  q: string;
  a: string;
}

export function HomeFaq({
  items,
  className,
}: {
  items: HomeFaqItem[];
  className?: string;
}) {
  const baseId = React.useId();
  const reduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = React.useState<number>(0);

  if (items.length === 0) return null;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {items.map((item, index) => {
        const isOpen = index === openIndex;
        const buttonId = `${baseId}-q-${index}`;
        const panelId = `${baseId}-a-${index}`;

        return (
          <div
            key={buttonId}
            className={cn(
              "overflow-hidden rounded-2xl border bg-surface-primary transition-colors duration-200",
              isOpen ? "border-navy/[0.12]" : "border-navy/[0.06]",
            )}
          >
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/50 sm:px-6 sm:py-5"
              >
                <span className="font-display text-base font-semibold text-navy sm:text-lg">
                  {item.q}
                </span>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 340, damping: 26 }
                  }
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors duration-200",
                    isOpen
                      ? "bg-gradient-da text-white"
                      : "bg-surface-secondary text-text-secondary",
                  )}
                >
                  <Plus size={18} strokeWidth={2.4} />
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { height: { duration: 0.32, ease: EASE }, opacity: { duration: 0.22 } }
                  }
                  className="overflow-hidden"
                >
                  <p className="border-t border-navy/[0.06] px-5 pb-5 pt-4 text-sm leading-relaxed text-text-secondary sm:px-6 sm:text-base">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
