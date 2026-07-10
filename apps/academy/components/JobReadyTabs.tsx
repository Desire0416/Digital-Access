"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@da/ui";
import { Icon } from "./Icon";
import { CareerPathCardView } from "./cards";
import type { SchoolCard, CareerPathCard } from "@/lib/types";

/**
 * Section « Prêt pour un métier recherché » — onglets par domaine/école (façon
 * « Get job-ready » de Coursera), aux couleurs et icônes de chaque école.
 * Sous l'onglet actif : une intro + les parcours de ce domaine + lien école.
 */
export interface JobReadyGroup {
  school: SchoolCard;
  paths: CareerPathCard[];
}

export function JobReadyTabs({
  groups,
  className,
}: {
  groups: JobReadyGroup[];
  className?: string;
}) {
  const uid = React.useId();
  const [activeSlug, setActiveSlug] = React.useState(groups[0]?.school.slug);
  const reduce = useReducedMotion();

  if (groups.length === 0) return null;
  const active = groups.find((g) => g.school.slug === activeSlug) ?? groups[0];
  const color = active.school.color ?? "#2B5CC6";

  return (
    <div className={className}>
      {/* Onglets (scroll horizontal sur mobile, sans débordement) */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
          {groups.map((g) => {
            const isActive = g.school.slug === active.school.slug;
            const c = g.school.color ?? "#2B5CC6";
            return (
              <button
                key={g.school.id}
                type="button"
                onClick={() => setActiveSlug(g.school.slug)}
                aria-pressed={isActive}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-transparent text-white"
                    : "border-navy/[0.1] bg-surface-primary text-navy hover:border-navy/20 hover:bg-surface-secondary/60",
                )}
                style={isActive ? { background: `linear-gradient(135deg, ${c}, ${c}cc)` } : undefined}
              >
                <span
                  className={cn("grid h-5 w-5 place-items-center", !isActive && "text-white")}
                  style={!isActive ? { color: c } : undefined}
                >
                  <Icon name={g.school.icon ?? "graduation-cap"} size={16} />
                </span>
                {g.school.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.school.slug}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm leading-relaxed text-text-secondary">{active.school.shortDescription}</p>
              </div>
              <Link
                href={`/schools/${active.school.slug}`}
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color }}
              >
                Découvrir l'école {active.school.name}
                <ArrowRight size={15} />
              </Link>
            </div>

            <div
              id={`${uid}-panel`}
              className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {active.paths.slice(0, 6).map((p) => (
                <CareerPathCardView key={p.id} path={p} />
              ))}
            </div>

            {active.paths.length > 6 && (
              <div className="mt-8 text-center">
                <Link
                  href={`/career-paths?school=${active.school.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/[0.12] px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
                >
                  Voir les {active.paths.length} parcours {active.school.name}
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
