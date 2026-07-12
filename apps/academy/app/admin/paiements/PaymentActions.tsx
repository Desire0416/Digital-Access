"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, FileImage, ShieldCheck } from "lucide-react";
import { cn } from "@da/ui";
import { approvePayment, rejectPayment } from "@/lib/payments";

/* ══════════════════════════════════════════════════════════════════════════
   Actions de validation Mobile Money (cahier §27, INVARIANT §41.5). Seule
   l'approbation admin crée l'inscription — géré côté serveur. Le rejet exige
   un motif. Miniature de preuve cliquable → visionneuse plein écran.
   ══════════════════════════════════════════════════════════════════════════ */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-navy/60 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-[61] grid place-items-center p-4" onClick={onClose}>
        {children}
      </div>
    </>,
    document.body,
  );
}

/* ─── Miniature de preuve → visionneuse ────────────────────────────────────── */
export function ProofThumb({ url, reference }: { url: string; reference: string | null }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Voir la preuve de paiement"
        className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-navy/10 bg-surface-secondary transition-transform hover:scale-105"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Preuve ${reference ?? ""}`} className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-navy/0 text-white opacity-0 transition-opacity group-hover:bg-navy/40 group-hover:opacity-100">
          <FileImage size={16} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <Modal onClose={() => setOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl bg-surface-primary shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-navy/[0.07] px-4 py-3">
                <p className="text-sm font-semibold text-navy">Preuve de paiement {reference && <span className="text-text-muted">· {reference}</span>}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-navy/[0.05] hover:text-navy"
                >
                  <X size={16} />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Preuve de paiement" className="max-h-[70vh] w-auto object-contain" />
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Valider / Rejeter (uniquement pour un paiement PENDING) ──────────────── */
export function PaymentActions({ paymentId, learnerName }: { paymentId: string; learnerName: string }) {
  const [pending, startTransition] = React.useTransition();
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = React.useState<"approved" | "rejected" | null>(null);

  function approve() {
    startTransition(async () => {
      const res = await approvePayment(paymentId);
      if (res.ok) setDone("approved");
      else setMsg({ ok: false, text: res.error });
    });
  }

  function submitReject() {
    if (reason.trim().length < 3) {
      setMsg({ ok: false, text: "Indiquez le motif du rejet." });
      return;
    }
    startTransition(async () => {
      const res = await rejectPayment(paymentId, reason.trim());
      if (res.ok) {
        setDone("rejected");
        setRejecting(false);
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  if (done) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
          done === "approved" ? "bg-success/10 text-success" : "bg-error/10 text-error",
        )}
      >
        {done === "approved" ? <ShieldCheck size={14} /> : <X size={14} />}
        {done === "approved" ? "Accès ouvert" : "Rejeté"}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Valider
        </button>
        <button
          type="button"
          onClick={() => {
            setRejecting(true);
            setMsg(null);
          }}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-error/25 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/[0.06] disabled:opacity-60"
        >
          <X size={13} />
          Rejeter
        </button>
      </div>
      {msg && !msg.ok && <p className="text-xs text-error">{msg.text}</p>}

      <AnimatePresence>
        {rejecting && (
          <Modal onClose={() => !pending && setRejecting(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Motif du rejet"
              className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-primary text-left shadow-2xl"
            >
              <div className="border-b border-navy/[0.07] bg-surface-secondary/60 px-5 py-4">
                <p className="font-display text-base font-bold text-navy">Rejeter le paiement</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {learnerName} sera notifié(e) du motif. Aucun accès ne sera ouvert.
                </p>
              </div>
              <div className="p-5">
                <label htmlFor="reject-reason" className="mb-1.5 block text-sm font-medium text-navy">
                  Motif du rejet
                </label>
                <textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Ex. montant incorrect, capture illisible, transaction introuvable…"
                  className="w-full resize-none rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-error/50"
                />
                {msg && !msg.ok && <p className="mt-2 text-xs text-error">{msg.text}</p>}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-navy/[0.07] px-5 py-3">
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  disabled={pending}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitReject}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {pending && <Loader2 size={14} className="animate-spin" />}
                  Confirmer le rejet
                </button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
