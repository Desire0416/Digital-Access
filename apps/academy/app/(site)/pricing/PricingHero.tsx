"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Smartphone, Wallet } from "lucide-react";
import { Container, GradientText } from "@da/ui";
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

const reassurances = [
  { icon: Wallet, label: "Prix en FCFA, sans surprise" },
  { icon: Smartphone, label: "Mobile Money : Orange · MTN · Wave" },
  { icon: BadgeCheck, label: "Certificat vérifiable inclus" },
];

/** Hero de la page Tarifs — aurora animée + pastilles de réassurance. */
export function PricingHero() {
  return (
    <section className="relative isolate overflow-hidden pb-10 pt-24 sm:pt-28">
      <HeroBackground />
      <Container>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
            Tarifs Academy
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl"
          >
            Des tarifs <GradientText>simples et accessibles</GradientText>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary"
          >
            Commencez gratuitement, puis payez uniquement les cours qui font
            avancer votre carrière. Pas d&apos;abonnement caché, pas de carte
            bancaire obligatoire — tout est pensé pour la Côte d&apos;Ivoire.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {reassurances.map(({ icon: IconCmp, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-white/80 px-4 py-2 text-xs font-semibold text-navy shadow-sm backdrop-blur"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-da text-white">
                  <IconCmp size={11} />
                </span>
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
