"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, RotateCcw, Loader2, X } from "lucide-react";
import { cn } from "@da/ui";
import { revokeCertificateAction, restoreCertificateAction } from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Actions certificat (règle 40.12 : toute révocation exige un motif et est
   tracée au journal d'audit côté serveur). Restauration réservée aux
   certificats révoqués/suspendus.
   ══════════════════════════════════════════════════════════════════════════ */

export function CertificateActions({
  certificateId,
  status,
  title,
}: {
  certificateId: string;
  status: string;
  title: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const canRestore = status === "REVOKED" || status === "SUSPENDED";
  const canRevoke = status === "ACTIVE";

  function submitRevoke() {
    if (reason.trim().length < 3) {
      setMsg({ ok: false, text: "Le motif de révocation est obligatoire." });
      return;
    }
    startTransition(async () => {
      const res = await revokeCertificateAction(certificateId, reason.trim());
      if (res.ok) setConfirming(false);
      else setMsg({ ok: false, text: res.error });
    });
  }

  function restore() {
    startTransition(async () => {
      const res = await restoreCertificateAction(certificateId);
      if (!res.ok) setMsg({ ok: false, text: res.error });
    });
  }

  if (!canRevoke && !canRestore) return null;

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canRevoke && (
        <button
          type="button"
          onClick={() => {
            setConfirming(true);
            setMsg(null);
          }}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-error/25 px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/[0.06] disabled:opacity-60"
        >
          <Ban size={13} />
          Révoquer
        </button>
      )}
      {canRestore && (
        <button
          type="button"
          onClick={restore}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 px-2.5 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/[0.06] disabled:opacity-60"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
          Restaurer
        </button>
      )}
      {msg && !msg.ok && !confirming && <span className="text-xs text-error">{msg.text}</span>}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {confirming && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !pending && setConfirming(false)}
                  className="fixed inset-0 z-[60] bg-navy/60 backdrop-blur-sm"
                />
                <div className="fixed inset-0 z-[61] grid place-items-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Révoquer le certificat"
                    className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-primary text-left shadow-2xl"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-navy/[0.07] bg-surface-secondary/60 px-5 py-4">
                      <div>
                        <p className="font-display text-base font-bold text-navy">Révoquer le certificat</p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">{title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        aria-label="Fermer"
                        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-navy/[0.05] hover:text-navy"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-5">
                      <p className="mb-3 rounded-lg bg-error/[0.05] px-3 py-2 text-xs text-error">
                        La révocation invalide la vérification publique du certificat. L'apprenant en sera notifié. Action tracée au journal d'audit.
                      </p>
                      <label htmlFor="revoke-reason" className="mb-1.5 block text-sm font-medium text-navy">
                        Motif de la révocation
                      </label>
                      <textarea
                        id="revoke-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        autoFocus
                        placeholder="Ex. fraude avérée, erreur de délivrance, demande de l'organisme…"
                        className="w-full resize-none rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-error/50"
                      />
                      {msg && !msg.ok && <p className="mt-2 text-xs text-error">{msg.text}</p>}
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-navy/[0.07] px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={pending}
                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05]"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={submitRevoke}
                        disabled={pending}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60",
                        )}
                      >
                        {pending && <Loader2 size={14} className="animate-spin" />}
                        Révoquer
                      </button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
