"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  ChevronRight,
  ImageIcon,
  Receipt,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar, cn, formatFCFA, formatDate } from "@da/ui";
import {
  StatusPill,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYMENT_PROVIDER,
  type Tone,
} from "@/components/admin/ui";
import type { AdminPaymentItem } from "@/lib/payment-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Carte de paiement — synthèse cliquable (ouvre le panneau de détail). Pour un
   paiement PENDING, deux raccourcis « Approuver / Rejeter » sont exposés
   directement ; toute l'interface tient sans débordement à 375px (empilement).
   ══════════════════════════════════════════════════════════════════════════ */

const OPERATOR_COLORS: Record<string, string> = {
  ORANGE: "#FF7900",
  MTN: "#D4A900",
  WAVE: "#00A5D0",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  COURSE: <Sparkles size={13} />,
  SUBSCRIPTION: <BadgeCheck size={13} />,
  INVOICE: <Receipt size={13} />,
};

export function PaymentCard({
  payment,
  onOpen,
  onApprove,
  onReject,
  busy = false,
}: {
  payment: AdminPaymentItem;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  const reduce = useReducedMotion();
  const statusMeta = PAYMENT_STATUS[payment.status] ?? {
    label: payment.status,
    tone: "slate" as Tone,
  };
  const isPending = payment.status === "PENDING";

  return (
    <motion.article
      layout
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group rounded-2xl border bg-surface-primary p-4 transition-shadow hover:shadow-lg sm:p-5",
        isPending ? "border-warning/30" : "border-navy/[0.07]",
      )}
    >
      {/* Zone cliquable → détail */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Voir le détail du paiement ${payment.reference}`}
        className="block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={payment.learner.name}
              src={payment.learner.avatar ?? undefined}
              className="h-10 w-10 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy">
                {payment.learner.name}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {payment.learner.email}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="font-display text-base font-extrabold text-navy sm:text-lg">
              {formatFCFA(payment.amount)}
            </span>
            <StatusPill label={statusMeta.label} tone={statusMeta.tone} />
          </div>
        </div>

        {/* Méta : article, type, fournisseur, référence, date */}
        <div className="mt-3.5 flex flex-col gap-2 border-t border-navy/[0.06] pt-3.5">
          <p className="truncate text-sm text-text-secondary">
            <span className="font-semibold text-navy">{payment.itemLabel}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2 py-0.5 font-medium">
              <span className="text-brand-blue-royal">
                {TYPE_ICON[payment.type]}
              </span>
              {PAYMENT_TYPE[payment.type] ?? payment.type}
            </span>
            {payment.provider === "MANUAL" && payment.operator !== "—" ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <Smartphone
                  size={13}
                  style={{ color: OPERATOR_COLORS[payment.operator] ?? "#666" }}
                />
                {payment.operator}
              </span>
            ) : (
              <span className="font-medium">
                {PAYMENT_PROVIDER[payment.provider] ?? payment.provider}
              </span>
            )}
            {payment.hasProof && (
              <span className="inline-flex items-center gap-1 text-brand-blue-royal">
                <ImageIcon size={12} />
                Preuve
              </span>
            )}
            <span className="font-mono text-text-muted">{payment.reference}</span>
            <span className="text-text-muted">{formatDate(payment.createdAt)}</span>
          </div>
        </div>

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal transition-colors group-hover:text-brand-violet">
          Voir le détail
          <ChevronRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </button>

      {/* Raccourcis d'action — uniquement pour les paiements en attente */}
      {isPending && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-navy/[0.06] pt-4">
          <motion.button
            type="button"
            onClick={onApprove}
            disabled={busy}
            whileHover={reduce || busy ? undefined : { scale: 1.02 }}
            whileTap={reduce || busy ? undefined : { scale: 0.97 }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-da px-3 py-2 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BadgeCheck size={16} strokeWidth={2.5} />
            Approuver
          </motion.button>
          <motion.button
            type="button"
            onClick={onReject}
            disabled={busy}
            whileHover={reduce || busy ? undefined : { scale: 1.02 }}
            whileTap={reduce || busy ? undefined : { scale: 0.97 }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-navy/[0.12] bg-surface-primary px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-error/40 hover:bg-error/[0.04] hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={15} />
            Rejeter
          </motion.button>
        </div>
      )}
    </motion.article>
  );
}
