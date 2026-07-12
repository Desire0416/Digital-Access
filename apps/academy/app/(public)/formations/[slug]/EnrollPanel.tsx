"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, CreditCard, Clock3, UserPlus, LogIn, MailWarning, Loader2 } from "lucide-react";
import { buttonClasses, cn } from "@da/ui";
import { formatFCFA } from "@/lib/site";
import { enrollFreeCourse } from "@/lib/learn-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Panneau d'action de la fiche formation (cahier §11.3) — choisit le bon CTA
   selon l'état de l'utilisateur. L'inscription gratuite passe par le Server
   Action `enrollFreeCourse` (revérifie tout côté serveur) ; le paiement et la
   connexion sont de simples liens.
   ══════════════════════════════════════════════════════════════════════════ */

export interface EnrollPanelProps {
  slug: string;
  price: number;
  authenticated: boolean;
  emailVerified: boolean;
  enrolled: boolean;
  pending: boolean;
}

export function EnrollPanel({ slug, price, authenticated, emailVerified, enrolled, pending }: EnrollPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const callback = `/formations/${slug}`;

  async function handleFreeEnroll() {
    setBusy(true);
    setError(null);
    try {
      const res = await enrollFreeCourse(slug);
      if (res.ok) {
        router.push(`/apprendre/${slug}`);
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

  // ── Déjà inscrit(e) : continuer ──
  if (enrolled) {
    return (
      <div className="space-y-2.5">
        <Link href={`/apprendre/${slug}`} className={buttonClasses({ size: "lg", className: "w-full" })}>
          <PlayCircle size={18} aria-hidden />
          Continuer la formation
        </Link>
        <p className="text-center text-xs font-medium text-success">Vous êtes inscrit(e) à cette formation.</p>
      </div>
    );
  }

  // ── Paiement en attente de validation ──
  if (pending) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3.5">
        <p className="flex items-center gap-2 text-sm font-bold text-[#B45309]">
          <Clock3 size={16} aria-hidden />
          Paiement en cours de validation
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#92400E]">
          Nous vérifions votre preuve de paiement. Votre accès s&apos;ouvrira dès la validation par notre équipe.
        </p>
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
          {price === 0 ? "S'inscrire gratuitement" : "Créer un compte"}
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
          Un email de confirmation vous a été envoyé. Validez-le pour vous inscrire à une formation.
        </p>
      </div>
    );
  }

  // ── Connecté, non inscrit : gratuit → action ; payant → lien de paiement ──
  return (
    <div className="space-y-2.5">
      {price === 0 ? (
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
              S&apos;inscrire gratuitement
            </>
          )}
        </motion.button>
      ) : (
        <Link
          href={`/paiement/formation/${slug}`}
          className={buttonClasses({ size: "lg", className: "w-full" })}
        >
          <CreditCard size={18} aria-hidden />
          Payer {formatFCFA(price)}
        </Link>
      )}

      {error && (
        <p className={cn("rounded-lg bg-error/10 px-3 py-2 text-center text-xs font-medium text-error")}>{error}</p>
      )}
      <p className="text-center text-xs text-text-muted">Accès à vie · certificat inclus</p>
    </div>
  );
}
