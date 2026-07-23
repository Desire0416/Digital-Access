"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CreditCard, Loader2, Lock } from "lucide-react";
import { buttonClasses } from "@da/ui";
import { joinFreeCohort } from "@/lib/cohort-actions";
import { formatFCFA } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Bouton d'inscription à une cohorte — réutilisable (fiche détaillée §23.4).
   Une cohorte GRATUITE passe par le Server Action `joinFreeCohort` (revérifie
   tout côté serveur) ; une cohorte PAYANTE renvoie vers le tunnel de paiement.
   Aucune logique de prix côté client : `effectivePrice` est calculé au serveur.
   ══════════════════════════════════════════════════════════════════════════ */

export function CohortEnrollButton({
  cohortId,
  slug,
  effectivePrice,
  isFull,
  className,
}: {
  cohortId: string;
  slug: string;
  effectivePrice: number;
  isFull: boolean;
  className?: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isFree = effectivePrice === 0;

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const res = await joinFreeCohort(cohortId);
      if (res.ok) {
        router.push(`/espace/cohortes/${cohortId}`);
        return;
      }
      if (res.redirect) {
        router.push(res.redirect);
        return;
      }
      setError(res.error ?? "L'inscription a échoué. Réessayez.");
      setBusy(false);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      {isFull ? (
        <button
          type="button"
          disabled
          className={buttonClasses({ variant: "outline", className: "w-full cursor-not-allowed" })}
        >
          <Lock size={16} aria-hidden />
          Cohorte complète
        </button>
      ) : isFree ? (
        <motion.button
          type="button"
          onClick={handleJoin}
          disabled={busy}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          className={buttonClasses({ className: "w-full" })}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              Inscription…
            </>
          ) : (
            <>
              <ArrowRight size={16} aria-hidden />
              Rejoindre la cohorte
            </>
          )}
        </motion.button>
      ) : (
        <Link href={`/paiement/cohorte/${slug}`} className={buttonClasses({ className: "w-full" })}>
          <CreditCard size={16} aria-hidden />
          Rejoindre — {formatFCFA(effectivePrice)}
        </Link>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-center text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
