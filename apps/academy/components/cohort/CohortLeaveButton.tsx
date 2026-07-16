"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LogOut, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@da/ui";
import { leaveCohort } from "@/lib/cohort-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Quitter une cohorte (cahier §23.5) — contrôle client discret, placé en bas de
   l'espace cohorte. Confirmation en deux temps (le premier clic dévoile les
   boutons Confirmer / Annuler) pour éviter tout départ accidentel. INVARIANT :
   quitter ne retire PAS l'accès pédagogique déjà déverrouillé (géré serveur).
   ══════════════════════════════════════════════════════════════════════════ */

export function CohortLeaveButton({ cohortId }: { cohortId: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  function leave() {
    setError("");
    startTransition(async () => {
      const res = await leaveCohort(cohortId);
      if (res.ok) {
        router.push("/espace/cohortes");
        router.refresh();
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Impossible de quitter la cohorte. Réessayez.");
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={reduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -6 }}
            transition={{ duration: 0.16 }}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-error/25 bg-error/[0.04] p-2 pl-3.5"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-error">
              <AlertTriangle size={14} aria-hidden />
              Quitter cette cohorte ?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={leave}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
              >
                {pending && <Loader2 size={13} className="animate-spin" aria-hidden />}
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-navy/[0.05] disabled:opacity-60"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            onClick={() => setConfirming(true)}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-navy/10 px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors",
              "hover:border-error/30 hover:bg-error/[0.04] hover:text-error",
            )}
          >
            <LogOut size={14} aria-hidden />
            Quitter la cohorte
          </motion.button>
        )}
      </AnimatePresence>

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
}

export default CohortLeaveButton;
