"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock3, Gift, Layers, Sparkles } from "lucide-react";
import {
  Badge,
  IconBadge,
  StaggerGroup,
  StaggerItem,
  buttonClasses,
  cn,
  formatFCFA,
} from "@da/ui";
import type { LucideIcon } from "lucide-react";

interface Plan {
  id: string;
  icon: LucideIcon;
  name: string;
  tagline: string;
  priceLabel: string;
  price: string;
  priceSuffix?: string;
  priceNote?: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
  comingSoon?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    icon: Gift,
    name: "Cours gratuits",
    tagline: "Pour découvrir la plateforme",
    priceLabel: "Pour toujours",
    price: formatFCFA(0),
    features: [
      "Accès complet aux cours 100 % gratuits",
      "Quiz interactifs inclus",
      "Certificat de réussite inclus",
      "Suivi de progression, XP et streak",
      "Sur mobile comme sur ordinateur",
    ],
    cta: { label: "Découvrir les cours gratuits", href: "/courses?price=free" },
  },
  {
    id: "alacarte",
    icon: Layers,
    name: "À la carte",
    tagline: "Payez uniquement les cours choisis",
    priceLabel: "À partir de",
    price: formatFCFA(25000),
    priceSuffix: "/ cours",
    features: [
      "Accès à vie au cours acheté",
      "Toutes les mises à jour incluses",
      "Quiz + certificat vérifiable par QR code",
      "Ressources téléchargeables",
      "Chapitres en aperçu gratuit avant achat",
      "Paiement Mobile Money (Orange, MTN, Wave)",
    ],
    cta: { label: "Choisir un cours", href: "/courses" },
    featured: true,
  },
  {
    id: "subscription",
    icon: Clock3,
    name: "Abonnement",
    tagline: "Tout le catalogue en illimité",
    priceLabel: "Mensuel",
    price: formatFCFA(15000),
    priceSuffix: "/ mois",
    priceNote: `ou ${formatFCFA(120000)} / an — 2 mois offerts`,
    features: [
      "Tout le catalogue en accès illimité",
      "Nouveaux cours inclus automatiquement",
      "Certificats illimités",
      "Résiliable à tout moment",
    ],
    cta: { label: "Être prévenu du lancement", href: "/pricing#paiement" },
    comingSoon: true,
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const { icon: IconCmp } = plan;

  return (
    <motion.article
      whileHover={plan.comingSoon ? undefined : { y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl p-7 sm:p-8",
        plan.featured
          ? "card-gradient-border shadow-brand-lg lg:-my-4 lg:py-12"
          : "border border-navy/[0.08] bg-surface-primary",
        plan.comingSoon && "border-dashed bg-surface-secondary/60",
      )}
    >
      {plan.featured && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-da opacity-[0.04]"
          />
          <Badge
            variant="gradient"
            className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-brand"
          >
            <Sparkles size={12} aria-hidden />
            Le plus flexible
          </Badge>
        </>
      )}
      {plan.comingSoon && (
        <Badge
          variant="soft"
          className="absolute -top-3 left-1/2 -translate-x-1/2 border border-navy/[0.08] bg-surface-primary shadow-sm"
        >
          <Clock3 size={12} aria-hidden />
          Bientôt disponible
        </Badge>
      )}

      {/* Contenu — légèrement estompé pour l'offre à venir, mais lisible. */}
      <div
        className={cn(
          "relative flex flex-1 flex-col",
          plan.comingSoon && "opacity-70 saturate-[0.65]",
        )}
      >
        <IconBadge tone={plan.featured ? "gradient" : "soft"} size="lg">
          <IconCmp size={26} />
        </IconBadge>

        <h3 className="mt-5 font-display text-xl font-bold text-navy">
          {plan.name}
        </h3>
        <p className="mt-1 text-sm font-medium text-brand-blue-royal">
          {plan.tagline}
        </p>

        <div className="mt-6 border-t border-navy/[0.07] pt-5">
          <span className="text-xs uppercase tracking-wide text-text-muted">
            {plan.priceLabel}
          </span>
          <p className="mt-0.5 flex items-baseline gap-1.5 font-display text-3xl font-extrabold text-navy">
            {plan.featured ? (
              <span className="text-gradient-da">{plan.price}</span>
            ) : (
              plan.price
            )}
            {plan.priceSuffix && (
              <span className="text-sm font-semibold text-text-muted">
                {plan.priceSuffix}
              </span>
            )}
          </p>
          {plan.priceNote && (
            <p className="mt-1 text-xs font-medium text-text-secondary">
              {plan.priceNote}
            </p>
          )}
        </div>

        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm leading-snug text-text-secondary"
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  plan.featured
                    ? "bg-gradient-da text-white"
                    : "bg-success/10 text-success",
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href={plan.cta.href}
          className={cn(
            buttonClasses({
              variant: plan.featured ? "primary" : "outline",
              size: "md",
            }),
            "mt-8 w-full",
          )}
        >
          {plan.cta.label}
        </Link>
      </div>
    </motion.article>
  );
}

/** Grille des 3 modèles tarifaires — gratuit / à la carte (vedette) / abonnement à venir. */
export function PricingPlans() {
  return (
    <StaggerGroup className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <StaggerItem key={plan.id} className="h-full">
          <PlanCard plan={plan} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
