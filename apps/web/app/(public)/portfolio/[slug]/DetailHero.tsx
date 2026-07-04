"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, LayoutGrid } from "lucide-react";
import { Badge, Container, Monogram } from "@da/ui";
import type { PortfolioItem } from "@da/db";

const covers = [
  "from-brand-violet to-brand-blue-royal",
  "from-brand-blue-royal to-brand-cyan",
  "from-accent to-brand-blue-vif",
  "from-brand-blue-vif to-brand-cyan",
  "from-primary to-brand-violet",
];

/** En-tête immersif de la page détail : couverture en dégradé + Monogram filigrane + méta. */
export function DetailHero({
  item,
  index = 0,
}: {
  item: PortfolioItem;
  index?: number;
}) {
  return (
    <section className="relative isolate overflow-hidden pb-4 pt-24 sm:pt-28">
      <Container>
        {/* Navette retour */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/portfolio"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Toutes les réalisations
          </Link>
        </motion.div>

        {/* Couverture en dégradé */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br ${covers[index % covers.length]} px-7 py-12 sm:px-12 sm:py-16`}
        >
          <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
          <Monogram
            variant="white"
            size={280}
            className="pointer-events-none absolute -bottom-16 -right-10 opacity-[0.12]"
          />
          <Monogram
            variant="white"
            size={160}
            className="pointer-events-none absolute -left-8 -top-10 opacity-[0.08]"
          />

          <div className="relative max-w-3xl">
            <Badge className="bg-white/90 text-navy backdrop-blur">
              {item.category}
            </Badge>
            <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {item.title}
            </h1>

            {/* Méta : client, année, type */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/85">
              <span className="inline-flex items-center gap-2">
                <Building2 size={16} className="text-white/70" />
                {item.client}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} className="text-white/70" />
                {item.year}
              </span>
              <span className="inline-flex items-center gap-2">
                <LayoutGrid size={16} className="text-white/70" />
                {item.type}
              </span>
            </div>

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-[0.95rem] font-semibold text-navy shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
              >
                Voir le site
                <ArrowUpRight size={18} />
              </a>
            )}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
