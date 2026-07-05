"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Award, BookOpen, MapPin, Users } from "lucide-react";
import { Container, GradientText, Monogram, buttonClasses, cn } from "@da/ui";
import { HeroBackground } from "@/components/HeroBackground";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const manifesto = [
  {
    icon: BookOpen,
    title: "Former",
    text: "des compétences numériques concrètes, en français",
  },
  {
    icon: Award,
    title: "Certifier",
    text: "avec des certificats vérifiables par QR code",
  },
  {
    icon: Users,
    title: "Connecter",
    text: "apprenants et mentors praticiens du terrain",
  },
];

/** Hero À propos — manifeste flottant + aurora, jamais un titre centré sur fond blanc. */
export function AboutHero() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-28 sm:pt-32">
      <HeroBackground />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* Colonne gauche — message */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
              À propos d&apos;Access Academy
            </motion.span>

            <motion.h1
              variants={item}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl"
            >
              Démocratiser les{" "}
              <GradientText>compétences numériques</GradientText> en Côte
              d&apos;Ivoire
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
            >
              Access Academy est née d&apos;une conviction simple&nbsp;: le
              talent est partout, mais l&apos;accès à la formation ne l&apos;est
              pas encore. Nous construisons la plateforme e-learning que la
              Côte d&apos;Ivoire mérite — en français, sur mobile, payable en
              Mobile Money.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className={buttonClasses({ variant: "primary", size: "lg" })}
              >
                Découvrir nos formations
                <ArrowRight size={18} />
              </Link>
              <a
                href="https://digitalaccess.ci"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "outline", size: "lg" })}
              >
                L&apos;agence Digital Access
              </a>
            </motion.div>

            <motion.p
              variants={item}
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-text-secondary"
            >
              <MapPin size={15} className="text-brand-blue-royal" />
              Conçue et développée à Abidjan, Côte d&apos;Ivoire
            </motion.p>
          </motion.div>

          {/* Colonne droite — carte manifeste flottante */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="relative mx-auto hidden w-full max-w-md lg:block"
          >
            <div className="absolute inset-6 rounded-full bg-gradient-da opacity-20 blur-3xl" />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-brand-lg"
            >
              {/* En-tête dégradé */}
              <div className="relative bg-gradient-da px-6 py-5">
                <div aria-hidden className="absolute inset-0 bg-dots opacity-25" />
                <Monogram
                  variant="white"
                  size={90}
                  className="absolute -bottom-6 -right-4 opacity-15"
                />
                <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                  Notre raison d&apos;être
                </p>
                <p className="relative mt-1 font-display text-lg font-extrabold text-white">
                  Le manifeste Academy
                </p>
              </div>

              {/* Trois verbes */}
              <ul className="divide-y divide-navy/[0.06] px-6">
                {manifesto.map(({ icon: IconCmp, title, text }, i) => (
                  <motion.li
                    key={title}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.6 + i * 0.15,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="flex items-start gap-4 py-5"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                      <IconCmp size={18} />
                    </span>
                    <span>
                      <span className="block font-display text-base font-bold text-navy">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-text-secondary">
                        {text}
                      </span>
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Chips flottants */}
            {[
              { label: "🇨🇮 Made in Côte d'Ivoire", className: "-left-8 top-8", delay: 0 },
              { label: "100 % en français", className: "-right-6 bottom-14", delay: 0.8 },
            ].map(({ label, className, delay }) => (
              <motion.span
                key={label}
                animate={{ y: [0, -9, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay,
                }}
                className={cn(
                  "absolute z-10 inline-flex items-center rounded-xl border border-navy/[0.06] bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-navy shadow-lg backdrop-blur",
                  className,
                )}
              >
                {label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
