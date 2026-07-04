"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  IconBadge,
  Badge,
  buttonClasses,
  cn,
  formatFCFA,
  StaggerGroup,
  StaggerItem,
} from "@da/ui";
import { Icon } from "@/components/Icon";
import type { ServicePack } from "@/lib/content";

/**
 * Grille tarifaire dédiée : cartes verticales avec liste complète des livrables,
 * mise en avant du pack le plus choisi. Variante « pricing » du ServiceCard.
 */
export function PricingGrid({ packs }: { packs: ServicePack[] }) {
  return (
    <StaggerGroup className="grid gap-6 lg:grid-cols-3">
      {packs.map((pack) => (
        <StaggerItem key={pack.id} className="h-full">
          <PricingCard pack={pack} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}

function PricingCard({ pack }: { pack: ServicePack }) {
  const featured = Boolean(pack.featured);

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl p-7 sm:p-8",
        featured
          ? "card-gradient-border shadow-brand-lg lg:-my-4 lg:py-12"
          : "border border-navy/[0.08] bg-surface-primary",
      )}
    >
      {featured && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-da opacity-[0.04]"
          />
          <Badge
            variant="gradient"
            className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-brand"
          >
            <Icon name="star" size={12} strokeWidth={2.5} className="fill-current" />
            Le plus choisi
          </Badge>
        </>
      )}

      <div className="relative flex items-start justify-between">
        <IconBadge tone={featured ? "gradient" : "soft"} size="lg">
          <Icon name={pack.icon} size={26} />
        </IconBadge>
      </div>

      <h3 className="relative mt-5 font-display text-xl font-bold text-navy">
        {pack.name}
      </h3>
      <p className="relative mt-1 text-sm font-medium text-brand-blue-royal">
        {pack.tagline}
      </p>
      <p className="relative mt-3 text-sm leading-relaxed text-text-secondary">
        {pack.description}
      </p>

      <div className="relative mt-6 border-t border-navy/[0.07] pt-5">
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {pack.priceLabel}
        </span>
        <p className="mt-0.5 font-display text-3xl font-extrabold text-navy">
          {featured ? (
            <span className="text-gradient-da">{formatFCFA(pack.price)}</span>
          ) : (
            formatFCFA(pack.price)
          )}
        </p>
      </div>

      <ul className="relative mt-6 flex-1 space-y-3">
        {pack.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm leading-snug text-text-secondary"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                featured
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
        href="/devis"
        className={cn(
          buttonClasses({
            variant: featured ? "primary" : "outline",
            size: "md",
          }),
          "relative mt-8 w-full",
        )}
      >
        {pack.cta}
      </Link>
    </motion.div>
  );
}
