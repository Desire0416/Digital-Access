"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Award, PlayCircle, Users } from "lucide-react";
import { Container, buttonClasses, cn } from "@da/ui";

const highlights = [
  { icon: PlayCircle, label: "Cours vidéo & interactifs" },
  { icon: Award, label: "Certificats vérifiables" },
  { icon: Users, label: "1200+ apprenants" },
];

export function AcademyPromo() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-dark px-8 py-12 sm:px-14 sm:py-16"
        >
          <div aria-hidden className="absolute inset-0 bg-grid opacity-25" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-cyan/20 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
                <GraduationCap size={15} />
                Access Academy
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Formez-vous aux métiers du{" "}
                <span className="text-gradient-da">numérique</span>
              </h2>
              <p className="mt-4 max-w-lg text-lg text-white/70">
                Notre plateforme e-learning vous ouvre les portes du développement,
                du design et du marketing digital — à votre rythme, avec
                certification à la clé.
              </p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                {highlights.map(({ icon: HlIcon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-2 text-sm font-medium text-white/80"
                  >
                    <HlIcon size={17} className="text-brand-cyan" />
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/academy"
                  className={buttonClasses({ variant: "primary", size: "lg" })}
                >
                  Explorer les formations
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="https://academy.digitalaccess.ci"
                  className={cn(
                    buttonClasses({ variant: "ghost", size: "lg" }),
                    "text-white hover:bg-white/10",
                  )}
                >
                  Voir le catalogue
                </a>
              </div>
            </div>

            {/* Visuel mortarboard */}
            <div className="relative mx-auto hidden aspect-square w-full max-w-sm lg:block">
              <motion.div
                animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-10 grid place-items-center rounded-[2rem] bg-gradient-da shadow-brand-lg"
              >
                <GraduationCap size={120} className="text-white" strokeWidth={1.4} />
              </motion.div>
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-2 top-6 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
              >
                <p className="text-2xl font-extrabold text-white">40+</p>
                <p className="text-xs text-white/70">formations</p>
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-1 left-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
              >
                <p className="text-2xl font-extrabold text-white">98%</p>
                <p className="text-xs text-white/70">réussite</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
