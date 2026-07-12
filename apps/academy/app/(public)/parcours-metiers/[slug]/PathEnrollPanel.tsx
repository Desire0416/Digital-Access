"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, CreditCard, UserPlus, LogIn, MailWarning, Loader2 } from "lucide-react";
import { buttonClasses, cn } from "@da/ui";
import { formatFCFA } from "@/lib/site";
import { enrollCareerPath } from "@/lib/learn-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Panneau d'action de la fiche parcours (cahier §13.4). Le prix affiché est le
   prix final APRÈS reconnaissance des acquis (§13.7, §27.4), déjà calculé côté
   serveur. Inscrit → espace ; prix final 0 → inscription directe (Server Action
   qui revérifie tout et déduit les acquis) ; sinon → paiement Mobile Money.
   ══════════════════════════════════════════════════════════════════════════ */

export interface PathEnrollPanelProps {
  slug: string;
  finalPrice: number;
  authenticated: boolean;
  emailVerified: boolean;
  enrolled: boolean;
}

export function PathEnrollPanel({ slug, finalPrice, authenticated, emailVerified, enrolled }: PathEnrollPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const callback = `/parcours-metiers/${slug}`;

  async function handleFreeEnroll() {
    setBusy(true);
    setError(null);
    try {
      const res = await enrollCareerPath(slug);
      if (res.ok) {
        router.push("/espace/parcours");
        return;
      }
      if (res.redirect) {
        router.push(res.redirect);
        return;
      }
      setError(res.error ?? "Une erreur est survenue. Réessayez.");
      setBusy(false);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setBusy(false);
    }
  }

  // ── Déjà inscrit(e) : reprendre le parcours ──
  if (enrolled) {
    return (
      <div className="space-y-2.5">
        <Link href="/espace/parcours" className={buttonClasses({ size: "lg", className: "w-full" })}>
          <PlayCircle size={18} aria-hidden />
          Reprendre le parcours
        </Link>
        <p className="text-center text-xs font-medium text-success">Vous êtes inscrit(e) à ce parcours.</p>
      </div>
    );
  }

  // ── Visiteur non connecté ──
  if (!authenticated) {
    return (
      <div className="space-y-2.5">
        <Link
          href={`/inscription?callbackUrl=${encodeURIComponent(callback)}`}
          className={buttonClasses({ size: "lg", className: "w-full" })}
        >
          <UserPlus size={18} aria-hidden />
          Créer un compte
        </Link>
        <p className="text-center text-xs text-text-secondary">
          Déjà membre ?{" "}
          <Link
            href={`/connexion?callbackUrl=${encodeURIComponent(callback)}`}
            className="inline-flex items-center gap-1 font-semibold text-brand-blue-royal hover:text-brand-violet"
          >
            <LogIn size={12} aria-hidden />
            Se connecter
          </Link>
        </p>
      </div>
    );
  }

  // ── Connecté mais email non confirmé ──
  if (!emailVerified) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3.5">
        <p className="flex items-center gap-2 text-sm font-bold text-[#B45309]">
          <MailWarning size={16} aria-hidden />
          Confirmez votre adresse email
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#92400E]">
          Un email de confirmation vous a été envoyé. Validez-le pour vous inscrire à un parcours.
        </p>
      </div>
    );
  }

  // ── Connecté : prix final 0 → inscription directe ; sinon paiement ──
  return (
    <div className="space-y-2.5">
      {finalPrice === 0 ? (
        <motion.button
          type="button"
          onClick={handleFreeEnroll}
          disabled={busy}
          whileTap={{ scale: 0.98 }}
          className={buttonClasses({ size: "lg", className: "w-full" })}
        >
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden />
              Inscription…
            </>
          ) : (
            <>
              <ArrowRight size={18} aria-hidden />
              Démarrer le parcours
            </>
          )}
        </motion.button>
      ) : (
        <Link href={`/paiement/parcours/${slug}`} className={buttonClasses({ size: "lg", className: "w-full" })}>
          <CreditCard size={18} aria-hidden />
          Payer {formatFCFA(finalPrice)}
        </Link>
      )}

      {error && (
        <p className={cn("rounded-lg bg-error/10 px-3 py-2 text-center text-xs font-medium text-error")}>{error}</p>
      )}
      <p className="text-center text-xs text-text-muted">Accès à vie · certification métier incluse</p>
    </div>
  );
}
