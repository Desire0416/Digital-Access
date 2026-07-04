"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@da/ui";
import type { CategoryPreview } from "@da/db";
import { Icon } from "@/components/Icon";
import { siteConfig } from "@/lib/site";

/** Grille des catégories Academy — chaque carte adopte la couleur de sa catégorie. */
export function CategoryGrid({ categories }: { categories: CategoryPreview[] }) {
  return (
    <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <StaggerItem key={cat.id}>
          <motion.a
            href={`${siteConfig.academyUrl}/courses?category=${cat.slug}`}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="group relative flex h-full items-start gap-4 overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary p-6 transition-shadow hover:shadow-xl"
          >
            {/* Halo teinté à la couleur de la catégorie */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
              style={{ backgroundColor: cat.color }}
            />

            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}
            >
              <Icon name={cat.icon} size={24} />
            </span>

            <div className="relative min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-bold leading-snug text-navy">
                  {cat.name}
                </h3>
                <ArrowUpRight
                  size={18}
                  className="mt-0.5 shrink-0 text-text-muted transition-colors group-hover:text-brand-blue-royal"
                />
              </div>
              <p className="mt-1 text-sm font-medium text-text-secondary">
                {cat.courseCount} cours
              </p>
            </div>

            {/* Filet dégradé signature en bas de carte au survol */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-da transition-transform duration-300 group-hover:scale-x-100"
            />
          </motion.a>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
