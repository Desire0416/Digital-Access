"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Card, IconBadge, Badge, buttonClasses, cn, formatFCFA } from "@da/ui";
import { Icon } from "./Icon";
import type { ServicePack } from "@/lib/content";

export function ServiceCard({ pack }: { pack: ServicePack }) {
  return (
    <Card
      gradientBorder={pack.featured}
      className={cn(
        "flex h-full flex-col",
        pack.featured && "shadow-brand",
      )}
    >
      {pack.featured && (
        <Badge variant="gradient" className="absolute -top-3 left-6">
          Le plus choisi
        </Badge>
      )}
      <IconBadge tone={pack.featured ? "gradient" : "soft"} size="lg">
        <Icon name={pack.icon} size={26} />
      </IconBadge>

      <h3 className="mt-5 font-display text-xl font-bold text-navy">
        {pack.name}
      </h3>
      <p className="mt-1 text-sm font-medium text-brand-blue-royal">
        {pack.tagline}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {pack.description}
      </p>

      <div className="mt-5">
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {pack.priceLabel}
        </span>
        <p className="font-display text-2xl font-extrabold text-navy">
          {formatFCFA(pack.price)}
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {pack.features.slice(0, 5).map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <Check size={13} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/devis"
        className={cn(
          buttonClasses({
            variant: pack.featured ? "primary" : "outline",
            size: "md",
          }),
          "mt-6 w-full",
        )}
      >
        {pack.cta}
      </Link>
    </Card>
  );
}
