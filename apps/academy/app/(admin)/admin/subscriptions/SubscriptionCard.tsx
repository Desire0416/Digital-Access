"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw, CalendarClock } from "lucide-react";
import { Avatar, formatDate, cn } from "@da/ui";
import { StatusPill, SUBSCRIPTION_STATUS, SUBSCRIPTION_PLAN } from "@/components/admin/ui";
import { SubscriptionActions } from "./SubscriptionActions";

type SubStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";

export type SubscriptionCardData = {
  id: string;
  plan: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  autoRenew: boolean;
  user: { name: string; email: string };
};

/* Statut d'abonnement — pastille brandée depuis le dictionnaire partagé. */
function SubStatusPill({ status }: { status: string }) {
  const meta = SUBSCRIPTION_STATUS[status] ?? { label: status, tone: "slate" as const };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

/* Renouvellement — pastille « Auto » (dégradé) ou « Manuel » (neutre). */
function RenewPill({ autoRenew }: { autoRenew: boolean }) {
  return autoRenew ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-da px-2.5 py-1 text-xs font-semibold text-white">
      <RefreshCw size={12} strokeWidth={2.5} />
      Auto
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-navy/[0.06] px-2.5 py-1 text-xs font-semibold text-text-secondary">
      Manuel
    </span>
  );
}

/* Une ligne d'attribut : libellé discret + valeur. */
function Attr({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 truncate">{children}</dd>
    </div>
  );
}

/**
 * Carte d'abonnement brandée — remplace la ligne de tableau.
 * Empilée en pleine largeur ; contenu en grille responsive interne pour tenir
 * à 375px sans aucun défilement horizontal.
 */
export function SubscriptionCard({ sub }: { sub: SubscriptionCardData }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg sm:p-5"
    >
      {/* En-tête : abonné + statut */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={sub.user.name} className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{sub.user.name}</p>
            <p className="truncate text-xs text-text-secondary">{sub.user.email}</p>
          </div>
        </div>
        <div className="shrink-0">
          <SubStatusPill status={sub.status} />
        </div>
      </div>

      {/* Attributs : formule / renouvellement / période */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-navy/[0.06] pt-4 sm:grid-cols-4">
        <Attr label="Formule">
          <span className="text-sm font-semibold text-navy">
            {SUBSCRIPTION_PLAN[sub.plan] ?? sub.plan}
          </span>
        </Attr>
        <Attr label="Renouvellement">
          <RenewPill autoRenew={sub.autoRenew} />
        </Attr>
        <Attr label="Début">
          <span className="inline-flex items-center gap-1.5 text-sm text-navy">
            <CalendarClock size={13} className="shrink-0 text-text-muted" />
            {formatDate(sub.startDate)}
          </span>
        </Attr>
        <Attr label="Fin">
          <span className="inline-flex items-center gap-1.5 text-sm text-navy">
            <CalendarClock size={13} className="shrink-0 text-text-muted" />
            {formatDate(sub.endDate)}
          </span>
        </Attr>
      </dl>

      {/* Actions */}
      <div
        className={cn(
          "mt-4 flex justify-end border-t border-navy/[0.06] pt-4",
        )}
      >
        <SubscriptionActions id={sub.id} status={sub.status as SubStatus} />
      </div>
    </motion.article>
  );
}
