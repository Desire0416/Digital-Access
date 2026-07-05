"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookMarked, Star, Users, Wallet, type LucideIcon } from "lucide-react";
import { AnimatedCounter, cn, formatFCFA } from "@da/ui";

type StatIcon = "book-marked" | "users" | "star" | "wallet";

export interface StudioStatCard {
  key: string;
  label: string;
  value: number;
  icon: StatIcon;
  tint: string;
  hint: string;
  /** Nombre de décimales pour l'affichage (ex. note moyenne). */
  decimals?: number;
  /** Suffixe affiché après la valeur (ex. " / 5"). */
  suffix?: string;
  /** Affiche la valeur en FCFA (compteur désactivé). */
  currency?: boolean;
}

const icons: Record<StatIcon, LucideIcon> = {
  "book-marked": BookMarked,
  users: Users,
  star: Star,
  wallet: Wallet,
};

/** Rangée de statistiques du studio — cards claires animées aux couleurs DA. */
export function StudioStats({ cards }: { cards: StudioStatCard[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Ico = icons[card.icon];
        return (
          <motion.div
            key={card.key}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.08,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={reduce ? undefined : { y: -4 }}
            className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-brand-lg"
          >
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-xl",
                card.tint,
              )}
            >
              <Ico
                size={22}
                aria-hidden
                fill={card.icon === "star" ? "currentColor" : "none"}
              />
            </span>

            <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy">
              <StatValue card={card} />
            </p>
            <p className="mt-1 text-sm font-semibold text-text-secondary">
              {card.label}
            </p>
            <p className="mt-1.5 hidden text-xs leading-relaxed text-text-muted sm:block">
              {card.hint}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatValue({ card }: { card: StudioStatCard }) {
  if (card.currency) {
    // Montant FCFA : formatage complet, pas de compteur (lisibilité de la devise).
    return <>{formatFCFA(card.value)}</>;
  }
  if (card.decimals && card.decimals > 0) {
    // Décimales (note) : rendu fixe, pas de compteur entier.
    return (
      <>
        {card.value.toLocaleString("fr-FR", {
          minimumFractionDigits: card.decimals,
          maximumFractionDigits: card.decimals,
        })}
        {card.suffix ?? ""}
      </>
    );
  }
  return <AnimatedCounter value={card.value} suffix={card.suffix ?? ""} />;
}
