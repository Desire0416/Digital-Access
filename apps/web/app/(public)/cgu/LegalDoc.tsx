"use client";

import * as React from "react";
import { motion } from "framer-motion";

/**
 * Mise en forme éditoriale des Conditions Générales d'Utilisation :
 * sommaire ancré + articles numérotés révélés au scroll. Identité DA.
 */

export interface LegalSectionData {
  id: string;
  title: string;
}

/** Sommaire latéral collant (ancres) — masqué en mobile. */
export function LegalTOC({ sections }: { sections: LegalSectionData[] }) {
  return (
    <nav aria-label="Sommaire" className="sticky top-28 hidden lg:block">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
        Articles
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

/** Un article des CGU : ancre, badge "Article n", titre et corps en prose. */
export function LegalArticle({
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
      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-da px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-brand">
        Article {String(index).padStart(2, "0")}
      </span>
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 border-l border-navy/[0.07] pl-6 text-[15px] leading-relaxed text-text-secondary">
        {children}
      </div>
    </motion.section>
  );
}
