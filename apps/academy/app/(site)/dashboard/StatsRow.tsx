"use client";

import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Flame, Zap } from "lucide-react";
import { AnimatedCounter, cn } from "@da/ui";

export interface StatsRowProps {
  streak: number;
  xp: number;
  inProgress: number;
  chaptersCompleted: number;
}

/** Rangée de 4 stats apprenant — cards claires animées, flamme vivante si série active. */
export function StatsRow({
  streak,
  xp,
  inProgress,
  chaptersCompleted,
}: StatsRowProps) {
  const cards = [
    {
      key: "streak",
      label: streak > 1 ? "Jours d'affilée" : "Jour d'affilée",
      value: streak,
      tint: "bg-warning/10 text-warning",
      hint:
        streak >= 1
          ? "Votre série est en feu — ne la brisez pas !"
          : "Complétez un chapitre pour lancer votre série.",
      icon: (
        <motion.span
          aria-hidden
          className="inline-flex"
          animate={streak >= 1 ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={
            streak >= 1
              ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        >
          <Flame size={22} fill={streak >= 1 ? "currentColor" : "none"} />
        </motion.span>
      ),
    },
    {
      key: "xp",
      label: "XP accumulés",
      value: xp,
      tint: "bg-accent/10 text-accent",
      hint: "+10 XP par chapitre, +25 XP par quiz réussi.",
      icon: <Zap size={22} fill="currentColor" aria-hidden />,
    },
    {
      key: "inProgress",
      label: "Cours en cours",
      value: inProgress,
      tint: "bg-brand-blue-vif/10 text-brand-blue-royal",
      hint: "Continuez sur votre lancée, un chapitre à la fois.",
      icon: <BookOpen size={22} aria-hidden />,
    },
    {
      key: "chapters",
      label: chaptersCompleted > 1 ? "Chapitres terminés" : "Chapitre terminé",
      value: chaptersCompleted,
      tint: "bg-success/10 text-success",
      hint: "Chaque chapitre validé compte pour le certificat.",
      icon: <CheckCircle2 size={22} aria-hidden />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.12 + i * 0.08,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{ y: -4 }}
          className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-brand-lg"
        >
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl",
              card.tint,
            )}
          >
            {card.icon}
          </span>
          <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy">
            <AnimatedCounter value={card.value} />
          </p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">
            {card.label}
          </p>
          <p className="mt-1.5 hidden text-xs leading-relaxed text-text-muted sm:block">
            {card.hint}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
