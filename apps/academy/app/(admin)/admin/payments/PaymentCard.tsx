"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ImageIcon,
  Smartphone,
  X,
} from "lucide-react";
import { Avatar, Badge, Button, Textarea, cn, formatFCFA, formatDate } from "@da/ui";
import { approvePayment, rejectPayment } from "@/lib/payment-actions";
import type { AdminPaymentItem } from "@/lib/payment-queries";

const operatorColors: Record<string, string> = {
  ORANGE: "#FF7900",
  MTN: "#D4A900",
  WAVE: "#00A5D0",
};

const statusBadge: Record<
  AdminPaymentItem["status"],
  { label: string; variant: "warning" | "success" | "default" }
> = {
  PENDING: { label: "En attente", variant: "warning" },
  COMPLETED: { label: "Approuvé", variant: "success" },
  FAILED: { label: "Rejeté", variant: "default" },
  REFUNDED: { label: "Remboursé", variant: "default" },
};

export function PaymentCard({
  payment,
  readonly = false,
}: {
  payment: AdminPaymentItem;
  readonly?: boolean;
}) {
  const router = useRouter();
  const [showProof, setShowProof] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const badge = statusBadge[payment.status];

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approvePayment(payment.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectPayment({
        paymentId: payment.id,
        reason: reason.trim() || undefined,
      });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <motion.article
      layout
      className={cn(
        "rounded-2xl border bg-surface-primary p-5 sm:p-6",
        payment.status === "PENDING"
          ? "border-warning/30"
          : "border-navy/[0.07] opacity-90",
      )}
    >
      {/* En-tête : apprenant + statut */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={payment.learner.name} />
          <div>
            <p className="text-sm font-bold text-navy">{payment.learner.name}</p>
            <p className="text-xs text-text-secondary">{payment.learner.email}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="truncate font-mono text-xs text-text-muted">{payment.reference}</span>
        </div>
      </div>

      {/* Détails */}
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <p className="text-text-secondary">
          Cours : <span className="font-semibold text-navy">{payment.courseTitle}</span>
        </p>
        <p className="text-text-secondary">
          Montant attendu :{" "}
          <span className="font-display font-extrabold text-navy">
            {formatFCFA(payment.amount)}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-text-secondary">
          <Smartphone size={14} style={{ color: operatorColors[payment.operator] ?? "#666" }} />
          {payment.operator} · {payment.payerPhone}
        </p>
        <p className="text-text-secondary">
          Payeur : <span className="font-medium text-navy">{payment.payerName}</span>
        </p>
        <p className="text-text-secondary">
          Transaction :{" "}
          <span className="font-mono text-xs font-semibold text-navy">
            {payment.transactionId ?? "—"}
          </span>
        </p>
        <p className="text-text-secondary">Soumis le {formatDate(payment.createdAt)}</p>
      </div>

      {payment.status === "FAILED" && payment.rejectReason && (
        <p className="mt-3 rounded-lg bg-navy/[0.04] px-3 py-2 text-xs text-text-secondary">
          Motif du rejet : {payment.rejectReason}
        </p>
      )}

      {/* Capture d'écran */}
      {payment.proofImage && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowProof((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            <ImageIcon size={15} />
            {showProof ? "Masquer la capture" : "Voir la capture d'écran"}
            <ChevronDown size={14} className={cn("transition-transform", showProof && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showProof && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={payment.proofImage}
                  alt={`Preuve ${payment.reference}`}
                  className="mt-3 max-h-96 rounded-xl border border-navy/10 object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}

      {/* Actions */}
      {!readonly && payment.status === "PENDING" && (
        <div className="mt-5 border-t border-navy/[0.07] pt-5">
          <AnimatePresence mode="wait">
            {rejecting ? (
              <motion.div
                key="reject"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motif du rejet (visible par l'apprenant) — ex : montant non reçu, ID de transaction introuvable…"
                  className="min-h-20 text-sm"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={handleReject} loading={pending} className="bg-error hover:bg-error/90">
                    <X size={15} /> Confirmer le rejet
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRejecting(false)} disabled={pending}>
                    Annuler
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-2"
              >
                <Button variant="primary" size="sm" onClick={handleApprove} loading={pending}>
                  <BadgeCheck size={16} />
                  Approuver — ouvrir l'accès
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRejecting(true)} disabled={pending}>
                  <X size={15} />
                  Rejeter
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {readonly && payment.status === "COMPLETED" && (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-success">
          <Check size={13} strokeWidth={3} /> Accès ouvert et apprenant notifié
        </p>
      )}
    </motion.article>
  );
}
