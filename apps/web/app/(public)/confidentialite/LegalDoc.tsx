"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import { IconBadge } from "@da/ui";

/**
 * Mise en forme de la politique de confidentialité : sommaire ancré, sections
 * révélées au scroll, cartes de données collectées et cartes de droits RGPD.
 */

export interface LegalSectionData {
  id: string;
  title: string;
}

export function LegalTOC({ sections }: { sections: LegalSectionData[] }) {
  return (
    <nav aria-label="Sommaire" className="sticky top-28 hidden lg:block">
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
      <div className="mt-4 space-y-4 border-l border-navy/[0.07] pl-8 text-[15px] leading-relaxed text-text-secondary">
        {children}
      </div>
    </motion.section>
  );
}

/** Cartes des catégories de données collectées, avec icône dégradé. */
export function DataCards({
  items,
}: {
  items: { icon: string; title: string; description: string }[];
}) {
  return (
    <div className="not-prose grid gap-4 sm:grid-cols-2">
      {items.map((it, i) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg"
        >
          <IconBadge tone="soft" size="sm">
            <Icon name={it.icon} size={18} />
          </IconBadge>
          <h3 className="mt-3 font-display text-base font-bold text-navy">
            {it.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            {it.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/** Cartes des droits RGPD, numérotées, en dégradé de bordure. */
export function RightsCards({
  items,
}: {
  items: { title: string; description: string }[];
}) {
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-2">
      {items.map((it, i) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="card-gradient-border flex gap-4 rounded-xl p-4"
        >
          <span className="font-display text-lg font-extrabold text-gradient-da">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-navy">
              {it.title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              {it.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
