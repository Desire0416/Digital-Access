"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Star, Smartphone, Search, Zap } from "lucide-react";
import {
  Container,
  GradientText,
  Monogram,
  StarRating,
  buttonClasses,
  cn,
} from "@da/ui";
import { HeroBackground } from "./HeroBackground";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const chips = [
  { icon: Smartphone, label: "Mobile Money", className: "left-0 top-10", delay: 0 },
  { icon: Search, label: "SEO optimisé", className: "right-2 top-4", delay: 0.4 },
  { icon: Zap, label: "Ultra rapide", className: "bottom-8 -left-2", delay: 0.8 },
];

export function HeroHome() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-28 sm:pt-32 lg:pb-28">
      <HeroBackground />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Colonne gauche — message */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
              Agence web & e-learning · Abidjan
            </motion.span>

            <motion.h1
              variants={item}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.03] tracking-tight text-navy sm:text-5xl lg:text-6xl"
            >
              Le numérique{" "}
              <GradientText>accessible</GradientText>, utile et{" "}
              <GradientText>stratégique</GradientText>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
            >
              Nous concevons des sites web, applications et plateformes de
              formation sur-mesure qui font grandir les entrepreneurs, PME et
              institutions de Côte d'Ivoire.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Link href="/devis" className={buttonClasses({ variant: "primary", size: "lg" })}>
                Demander un devis
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/academy"
                className={buttonClasses({ variant: "outline", size: "lg" })}
              >
                <GraduationCap size={18} />
                Nos formations
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-10 flex items-center gap-5">
              <div className="flex -space-x-2.5">
                {["from-brand-violet to-brand-blue-royal", "from-brand-blue-royal to-brand-cyan", "from-accent to-brand-blue-vif", "from-brand-blue-vif to-brand-cyan"].map(
                  (g, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-block h-10 w-10 rounded-full border-2 border-surface-primary bg-gradient-to-br",
                        g,
                      )}
                    />
                  ),
                )}
              </div>
              <div>
                <StarRating rating={5} size={15} />
                <p className="mt-0.5 text-sm text-text-secondary">
                  <span className="font-bold text-navy">35+ clients</span>{" "}
                  nous font confiance
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Colonne droite — composition visuelle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative mx-auto hidden aspect-square w-full max-w-md lg:block"
          >
            {/* Halo */}
            <div className="absolute inset-8 rounded-full bg-gradient-da opacity-20 blur-3xl" />

            {/* Carte principale (mockup navigateur) */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-x-6 top-10 rotate-[-4deg] overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-brand-lg"
            >
              <div className="flex items-center gap-1.5 border-b border-navy/[0.06] bg-surface-secondary px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <div className="relative h-28 bg-gradient-da">
                <div className="absolute inset-0 bg-grid opacity-25" />
                <div className="absolute inset-0 flex items-center gap-3 px-5">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/20 backdrop-blur">
                    <Monogram variant="white" size={30} />
                  </span>
                  <div>
                    <div className="h-2.5 w-28 rounded-full bg-white/80" />
                    <div className="mt-2 h-2 w-20 rounded-full bg-white/50" />
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 p-5">
                <div className="h-2.5 w-3/4 rounded-full bg-navy/10" />
                <div className="h-2.5 w-full rounded-full bg-navy/[0.07]" />
                <div className="h-2.5 w-5/6 rounded-full bg-navy/[0.07]" />
                <div className="mt-4 flex gap-3">
                  <div className="h-8 w-24 rounded-lg bg-gradient-da" />
                  <div className="h-8 w-20 rounded-lg border border-navy/10" />
                </div>
              </div>
            </motion.div>

            {/* Chips flottants */}
            {chips.map(({ icon: ChipIcon, label, className, delay }) => (
              <motion.div
                key={label}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
                className={cn(
                  "absolute z-10 inline-flex items-center gap-2 rounded-xl border border-navy/[0.06] bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-navy shadow-lg backdrop-blur",
                  className,
                )}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
                  <ChipIcon size={15} />
                </span>
                {label}
              </motion.div>
            ))}

            {/* Badge note flottant */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -bottom-2 right-4 z-10 inline-flex items-center gap-2 rounded-xl border border-navy/[0.06] bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur"
            >
              <Star size={18} className="fill-warning text-warning" />
              <span className="text-sm font-bold text-navy">
                98% <span className="font-medium text-text-secondary">satisfaits</span>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
