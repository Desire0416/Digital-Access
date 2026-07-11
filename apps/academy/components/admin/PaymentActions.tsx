"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@da/ui";
import { approvePayment, rejectPayment } from "@/lib/payment-actions";

/* Actions de validation d'un paiement manuel (file admin).
   « Valider » ouvre l'accès (crée l'inscription). « Rejeter » demande un motif.
   Seuls les paiements en attente sont actionnables. */
export function PaymentActions({ paymentId, actionable }: { paymentId: string; actionable: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = React.useTransition();
  const [mode, setMode] = React.useState<"idle" | "rejecting">("idle");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  if (!actionable) {
    return <span className="text-xs font-medium text-text-muted">Traité</span>;
  }

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await approvePayment(paymentId);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  function confirmReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectPayment(paymentId, reason);
      if (!res.ok) return setError(res.error);
      setMode("idle");
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <AnimatePresence mode="wait" initial={false}>
        {mode === "idle" ? (
          <motion.div key="buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
              Valider
            </button>
            <button
              type="button"
              onClick={() => setMode("rejecting")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-error/40 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-60"
            >
              <X size={14} /> Rejeter
            </button>
          </motion.div>
        ) : (
          <motion.div key="reject" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-xs">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              autoFocus
              placeholder="Motif du rejet (ex. montant incorrect, capture illisible)…"
              className="w-full rounded-lg border border-navy/15 bg-white p-2 text-xs text-navy outline-none focus:border-error focus:ring-2 focus:ring-error/15"
            />
            <div className="mt-1.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setMode("idle"); setReason(""); setError(null); }}
                disabled={busy}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-navy/[0.05]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmReject}
                disabled={busy}
                className={cn("inline-flex items-center gap-1.5 rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60")}
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Confirmer le rejet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
