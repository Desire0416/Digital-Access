"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Container } from "@da/ui";
import { HeroBackground } from "./HeroBackground";

/** En-tête de page interne : titre magazine sur décor animé, avec fil d'ariane optionnel. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden pb-10 pt-20 sm:pb-16 sm:pt-32">
      <HeroBackground />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-blue-royal sm:mb-5 sm:text-xs sm:tracking-[0.18em]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
              {eyebrow}
            </motion.span>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl sm:leading-[1.05] lg:text-6xl"
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:mt-6 sm:text-lg"
            >
              {description}
            </motion.p>
          )}
          {children && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              {children}
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}
