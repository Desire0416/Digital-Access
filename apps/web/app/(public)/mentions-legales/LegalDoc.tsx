"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@da/ui";

/**
 * Mise en forme éditoriale des pages légales : sommaire ancré + sections numérotées,
 * révélées au scroll, avec filet dégradé signature. Anti-générique, identité DA.
 */

export interface LegalSectionData {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Sommaire latéral collant (ancres) — masqué en mobile. */
export function LegalTOC({ sections }: { sections: LegalSectionData[] }) {
  return (
    <nav
      aria-label="Sommaire"
      className="sticky top-28 hidden lg:block"
    >
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
        Sommaire
      </p>
      <ol className="space-y-1 border-l border-navy/10">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="group flex items-start gap-3 border-l-2 border-transparent py-1.5 pl-4 text-sm text-text-secondary transition-colors hover:border-brand-blue-vif hover:text-navy"
            >
              <span className="mt-px font-mono text-[11px] font-semibold text-brand-blue-vif/70 group-hover:text-brand-blue-vif">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug">{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Une section légale : ancre, numéro dégradé, titre, corps en prose. */
export function LegalSection({
  index,
  title,
  id,
  children,
}: {
  index: number;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-28"
    >
      <div className="flex items-baseline gap-4">
        <span className="font-display text-2xl font-extrabold text-gradient-da">
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="legal-prose mt-4 space-y-4 border-l border-navy/[0.07] pl-8 text-[15px] leading-relaxed text-text-secondary">
        {children}
      </div>
    </motion.section>
  );
}

/** Bloc clé-valeur pour l'identité de l'éditeur / hébergeur. */
export function LegalInfoGrid({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-px overflow-hidden rounded-xl border border-navy/[0.08] bg-navy/[0.06] sm:grid-cols-2",
        className,
      )}
    >
      {items.map((it) => (
        <div key={it.label} className="bg-surface-primary p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {it.label}
          </dt>
          <dd className="mt-1 text-sm font-medium text-navy">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
