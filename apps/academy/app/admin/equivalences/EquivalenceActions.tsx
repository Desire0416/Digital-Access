"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, CheckCircle2, Gavel, FileImage } from "lucide-react";
import { cn } from "@da/ui";
import { reviewEquivalence } from "@/lib/equivalence-actions";
import {
  EQUIVALENCE_DECISIONS,
  EQUIVALENCE_STATUS_LABEL,
  EQUIVALENCE_DECISION_EFFECT,
} from "@/lib/equivalence-labels";
import type { EquivalenceStatus } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Validation d'une équivalence (cahier §22.4). Seule cette action ouvre un
   accès (côté serveur). Quatre décisions : acceptée / partielle / conditionnelle
   / refusée. Motif OBLIGATOIRE pour « conditionnelle » et « refusée ».
   ══════════════════════════════════════════════════════════════════════════ */

type Decision = Exclude<EquivalenceStatus, "PENDING">;

const DECISION_STYLE: Record<Decision, string> = {
  ACCEPTED: "border-success/30 bg-success/[0.06] text-success hover:bg-success/10",
  PARTIAL: "border-brand-blue-vif/30 bg-brand-blue-vif/[0.06] text-brand-blue-royal hover:bg-brand-blue-vif/10",
  CONDITIONAL: "border-brand-violet/30 bg-brand-violet/[0.06] text-brand-violet hover:bg-brand-violet/10",
  REJECTED: "border-error/30 bg-error/[0.06] text-error hover:bg-error/10",
};

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
      <div className="fixed inset-0 z-[61] grid place-items-center overflow-y-auto p-4" onClick={onClose}>
        {children}
      </div>
    </>,
    document.body,
  );
}

/* ─── Miniature de preuve → visionneuse ────────────────────────────────────── */
export function ProofThumb({ url }: { url: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Voir la preuve"
        className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-navy/10 bg-surface-secondary transition-transform hover:scale-105"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Preuve d'équivalence" className="h-full w-full object-cover" />
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
                <p className="text-sm font-semibold text-navy">Preuve d'équivalence</p>
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
              <img src={url} alt="Preuve d'équivalence" className="max-h-[70vh] w-auto object-contain" />
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Traiter la demande (uniquement si PENDING) ───────────────────────────── */
export function EquivalenceActions({ id, learnerName }: { id: string; learnerName: string }) {
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [decision, setDecision] = React.useState<Decision | null>(null);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState<Decision | null>(null);

  const needsNote = decision === "CONDITIONAL" || decision === "REJECTED";

  function submit() {
    if (!decision) {
      setError("Choisissez une décision.");
      return;
    }
    if (needsNote && note.trim().length < 3) {
      setError(decision === "REJECTED" ? "Indiquez le motif du refus." : "Précisez la condition.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await reviewEquivalence({ id, decision, note: note.trim() || undefined });
      if (res.ok) {
        setDone(decision);
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
          done === "REJECTED" ? "bg-error/10 text-error" : "bg-success/10 text-success",
        )}
      >
        <CheckCircle2 size={14} />
        {EQUIVALENCE_STATUS_LABEL[done]}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError("");
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
      >
        <Gavel size={13} />
        Traiter
      </button>

      <AnimatePresence>
        {open && (
          <Modal onClose={() => !pending && setOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Traiter la demande d'équivalence"
              className="my-8 w-full max-w-md overflow-hidden rounded-2xl bg-surface-primary text-left shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-navy/[0.07] bg-surface-secondary/60 px-5 py-4">
                <div>
                  <p className="font-display text-base font-bold text-navy">Décision d'équivalence</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{learnerName} sera notifié·e.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  aria-label="Fermer"
                  className="grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-navy/[0.05] hover:text-navy"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-2">
                  {EQUIVALENCE_DECISIONS.map((d) => {
                    const active = decision === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDecision(d);
                          setError("");
                        }}
                        aria-pressed={active}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm font-semibold transition-all",
                          DECISION_STYLE[d],
                          active ? "ring-2 ring-current ring-offset-1" : "",
                        )}
                      >
                        {EQUIVALENCE_STATUS_LABEL[d]}
                      </button>
                    );
                  })}
                </div>

                {decision && (
                  <p className="rounded-xl bg-surface-secondary px-3.5 py-2.5 text-xs text-text-secondary">
                    {EQUIVALENCE_DECISION_EFFECT[decision]}
                  </p>
                )}

                <div>
                  <label htmlFor="equiv-note" className="mb-1.5 block text-sm font-medium text-navy">
                    {needsNote ? "Motif / condition (obligatoire)" : "Note pour l'apprenant (optionnel)"}
                  </label>
                  <textarea
                    id="equiv-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={
                      decision === "REJECTED"
                        ? "Ex. preuve insuffisante, ne couvre pas les objectifs de la formation…"
                        : decision === "CONDITIONAL"
                          ? "Ex. réussir d'abord le test de positionnement…"
                          : "Message éventuel pour l'apprenant…"
                    }
                    className="w-full resize-none rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal/50"
                  />
                </div>

                {error && <p className="text-xs text-error">{error}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-navy/[0.07] px-5 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending || !decision}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-60"
                >
                  {pending && <Loader2 size={14} className="animate-spin" />}
                  Confirmer
                </button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
