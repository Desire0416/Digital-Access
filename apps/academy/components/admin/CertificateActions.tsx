"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldX, ShieldCheck, Check, X, Loader2 } from "lucide-react";
import { cn } from "@da/ui";
import { setCertificateStatus } from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Actions de modération d'un certificat.
   - Certificat ACTIF        → bouton « Révoquer »  (setCertificateStatus REVOKED)
   - Certificat RÉVOQUÉ/SUSP. → bouton « Réactiver » (setCertificateStatus ACTIVE)
   Confirmation en deux temps (inline, brandée) plutôt qu'une boîte native.
   ══════════════════════════════════════════════════════════════════════════ */

export function CertificateActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isActive = status === "ACTIVE";
  const nextStatus = isActive ? "REVOKED" : "ACTIVE";

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await setCertificateStatus(id, nextStatus);
      if (!res.ok) {
        setError(res.error);
        setConfirming(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            <span className="mr-0.5 text-xs font-medium text-text-secondary">
              {isActive ? "Révoquer ?" : "Réactiver ?"}
            </span>
            <button
              type="button"
              onClick={run}
              disabled={pending}
              className={cn(
                "inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-60",
                isActive ? "bg-error" : "bg-success",
              )}
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-navy/25 hover:text-navy disabled:opacity-60"
            >
              <X size={13} />
              Annuler
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            onClick={() => {
              setError(null);
              setConfirming(true);
            }}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "border-error/25 text-error hover:bg-error/10"
                : "border-success/30 text-success hover:bg-success/10",
            )}
          >
            {isActive ? <ShieldX size={13} /> : <ShieldCheck size={13} />}
            {isActive ? "Révoquer" : "Réactiver"}
          </motion.button>
        )}
      </AnimatePresence>
      {error && <p className="max-w-[12rem] text-right text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
