"use client";

import { motion } from "framer-motion";
import { Avatar, Monogram } from "@da/ui";
import { Quote } from "lucide-react";

const signature = [
  { label: "Fondateur & CEO", value: "Desiré K." },
];

/**
 * Bloc « Fondateur » : carte éditoriale avec avatar (initiales), citation
 * inspirante ancrée dans le contexte ivoirien, et filigrane Monogram.
 */
export function FounderCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-dark px-8 py-12 sm:px-14 sm:py-16"
    >
      <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-violet/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-cyan/20 blur-3xl"
      />
      <Monogram
        variant="white"
        size={200}
        className="absolute -bottom-10 right-6 opacity-[0.06]"
      />

      <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
        {/* Identité fondateur */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="relative">
            <Avatar
              name="Desiré K."
              className="h-28 w-28 text-3xl shadow-brand-lg ring-4 ring-white/10"
            />
            <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-surface-dark">
              <Monogram variant="gradient" size={20} />
            </span>
          </div>
          <p className="mt-6 font-display text-2xl font-extrabold text-white">
            Desiré K.
          </p>
          <p className="mt-1 text-sm font-medium text-brand-cyan">
            Fondateur &amp; CEO — Digital Access
          </p>

          <dl className="mt-6 hidden gap-x-8 gap-y-3 lg:flex lg:flex-wrap">
            {signature.map((s) => (
              <div key={s.label}>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/45">
                  {s.label}
                </dt>
                <dd className="font-display text-lg font-bold text-white">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Citation */}
        <div>
          <Quote size={44} className="text-brand-cyan/60" />
          <blockquote className="mt-4 font-display text-xl font-semibold leading-relaxed text-white sm:text-2xl">
            « J'ai grandi à Abidjan en voyant tant de talents et de belles idées
            rester invisibles, faute d'accès aux bons outils numériques. Digital
            Access, c'est ma réponse : mettre l'excellence technique au service
            de ceux qui construisent la Côte d'Ivoire de demain — un commerçant,
            une école, une institution à la fois. Nous ne vendons pas des sites,
            nous ouvrons des portes. »
          </blockquote>
          <div className="mt-6 h-px w-16 bg-gradient-da" />
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Diplômé en ingénierie logicielle et passionné de pédagogie, Desiré a
            réuni une équipe de créatifs et de développeurs partageant une même
            conviction : le numérique de qualité doit être accessible à tous.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
