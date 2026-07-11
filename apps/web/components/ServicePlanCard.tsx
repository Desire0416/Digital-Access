"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { buttonClasses, cn, formatFCFA } from "@da/ui";
import { Icon } from "./Icon";
import type { ServicePack } from "@/lib/content";

/* ══════════════════════════════════════════════════════════════════════════
   Carte « plan tarifaire » de la section services (accueil) — présentation
   façon grille de tarifs : la carte mise en avant est remplie du dégradé
   signature, surélevée, avec une tuile d'icône flottante skeuomorphe.
   Ordre : nom → tagline → prix → CTA → livrables → « En savoir plus ».
   ══════════════════════════════════════════════════════════════════════════ */

export function ServicePlanCard({ pack }: { pack: ServicePack }) {
  const featured = Boolean(pack.featured);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "relative flex h-full flex-col rounded-3xl p-7 sm:p-8",
        featured
          ? "bg-gradient-da text-white shadow-brand-lg lg:-my-4 lg:py-12"
          : "border border-navy/[0.08] bg-surface-primary text-navy transition-shadow hover:shadow-xl",
      )}
    >
      {/* Tuile d'icône flottante (carte mise en avant) */}
      {featured && (
        <span className="absolute -right-3 -top-5 grid h-14 w-14 rotate-6 place-items-center rounded-2xl bg-white text-brand-violet shadow-lg">
          <Icon name={pack.icon} size={26} />
        </span>
      )}

      {/* En-tête : badge « Le plus choisi » ou icône du pack */}
      {featured ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
          <Sparkles size={13} /> Le plus choisi
        </span>
      ) : (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue-vif/10 text-brand-blue-royal">
          <Icon name={pack.icon} size={24} />
        </span>
      )}

      <h3 className={cn("mt-5 font-display text-xl font-bold", featured ? "text-white" : "text-navy")}>
        {pack.name}
      </h3>
      <p className={cn("mt-1 text-sm font-medium", featured ? "text-white/80" : "text-brand-blue-royal")}>
        {pack.tagline}
      </p>

      {/* Prix */}
      <div className="mt-6">
        <span
          className={cn(
            "text-xs uppercase tracking-wide",
            featured ? "text-white/70" : "text-text-muted",
          )}
        >
          {pack.priceLabel}
        </span>
        <p className={cn("font-display text-3xl font-extrabold", featured ? "text-white" : "text-navy")}>
          {formatFCFA(pack.price)}
        </p>
      </div>

      {/* CTA */}
      {featured ? (
        <Link
          href="/devis"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-violet shadow-sm transition-colors hover:bg-white/90"
        >
          {pack.cta}
        </Link>
      ) : (
        <Link
          href="/devis"
          className={cn(buttonClasses({ variant: "primary", size: "md" }), "mt-6 w-full")}
        >
          {pack.cta}
        </Link>
      )}

      {/* Séparateur */}
      <div className={cn("mt-7 border-t", featured ? "border-white/20" : "border-navy/[0.08]")} />

      {/* Livrables */}
      <ul className="mt-6 flex-1 space-y-3">
        {pack.features.map((feature) => (
          <li
            key={feature}
            className={cn(
              "flex items-start gap-3 text-sm leading-snug",
              featured ? "text-white/90" : "text-text-secondary",
            )}
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                featured ? "bg-white/20 text-white" : "bg-brand-blue-vif/10 text-brand-blue-royal",
              )}
            >
              <Check size={12} strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* En savoir plus */}
      <Link
        href="/tarifs"
        className={cn(
          "group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold",
          featured ? "text-white" : "text-brand-blue-royal",
        )}
      >
        En savoir plus
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
