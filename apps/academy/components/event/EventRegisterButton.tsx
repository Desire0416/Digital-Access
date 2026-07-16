"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Ticket,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  UserPlus,
  LogIn,
  MailWarning,
  Loader2,
  CalendarX,
  Lock,
} from "lucide-react";
import { buttonClasses, cn } from "@da/ui";
import type { EventAudience } from "@da/academy-db/client";
import { registerForEvent, unregisterFromEvent } from "@/lib/event-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Panneau d'inscription d'un événement (cahier §24.2) — choisit le bon CTA
   selon l'état. L'inscription / la désinscription passent par les Server
   Actions (revérifient tout côté serveur : audience, capacité, unicité). Le lien
   de connexion (meetingUrl) n'est fourni par le serveur qu'aux inscrits.
   ══════════════════════════════════════════════════════════════════════════ */

export interface EventRegisterButtonProps {
  eventId: string;
  slug: string;
  registered: boolean;
  canRegister: boolean;
  isPast: boolean;
  isFull: boolean;
  seatsLeft: number | null;
  meetingUrl: string | null;
  replayUrl: string | null;
  audience: EventAudience;
  authenticated: boolean;
  emailVerified: boolean;
}

export function EventRegisterButton({
  eventId,
  slug,
  registered,
  canRegister,
  isPast,
  isFull,
  meetingUrl,
  replayUrl,
  audience,
  authenticated,
  emailVerified,
}: EventRegisterButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const callback = `/evenements/${slug}`;

  async function handleRegister() {
    setBusy(true);
    setError(null);
    try {
      const res = await registerForEvent(eventId);
      if (res.ok) {
        router.refresh();
        setBusy(false);
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

  async function handleUnregister() {
    setBusy(true);
    setError(null);
    try {
      const res = await unregisterFromEvent(eventId);
      if (res.ok) {
        router.refresh();
        setBusy(false);
        return;
      }
      setError(res.error ?? "La désinscription a échoué. Réessayez.");
      setBusy(false);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setBusy(false);
    }
  }

  // ── Inscrit(e) : rejoindre / replay / se désinscrire ──
  if (registered) {
    return (
      <div className="space-y-2.5">
        <p className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/[0.07] px-3.5 py-2.5 text-sm font-bold text-success">
          <CheckCircle2 size={16} aria-hidden />
          Vous êtes inscrit(e)
        </p>

        {!isPast && meetingUrl && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ size: "lg", className: "w-full" })}
          >
            <ExternalLink size={18} aria-hidden />
            Rejoindre la session
          </a>
        )}

        {isPast && replayUrl && (
          <a
            href={replayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ size: "lg", className: "w-full" })}
          >
            <PlayCircle size={18} aria-hidden />
            Voir le replay
          </a>
        )}

        {!isPast && (
          <button
            type="button"
            onClick={handleUnregister}
            disabled={busy}
            className={buttonClasses({ variant: "ghost", size: "sm", className: "w-full" })}
          >
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
            Se désinscrire
          </button>
        )}

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-xs font-medium text-error">{error}</p>
        )}
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
          S&apos;inscrire à l&apos;événement
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
          Un email de confirmation vous a été envoyé. Validez-le pour vous inscrire à un événement.
        </p>
      </div>
    );
  }

  // ── Événement passé ──
  if (isPast) {
    return (
      <div className="space-y-2.5">
        <p className="flex items-center gap-2 rounded-xl border border-navy/15 bg-surface-secondary px-3.5 py-2.5 text-sm font-bold text-navy">
          <CalendarX size={16} aria-hidden />
          Événement terminé
        </p>
        {replayUrl && (
          <a
            href={replayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ size: "lg", className: "w-full" })}
          >
            <PlayCircle size={18} aria-hidden />
            Voir le replay
          </a>
        )}
      </div>
    );
  }

  // ── Complet ──
  if (isFull) {
    return (
      <div className="rounded-xl border border-navy/15 bg-surface-secondary px-4 py-3.5 text-center">
        <p className="flex items-center justify-center gap-2 text-sm font-bold text-navy">
          <Lock size={16} aria-hidden />
          Événement complet
        </p>
        <p className="mt-1 text-xs text-text-secondary">Toutes les places ont été attribuées.</p>
      </div>
    );
  }

  // ── Inscription possible ──
  if (canRegister) {
    return (
      <div className="space-y-2.5">
        <motion.button
          type="button"
          onClick={handleRegister}
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
              <Ticket size={18} aria-hidden />
              S&apos;inscrire à l&apos;événement
            </>
          )}
        </motion.button>
        {error && (
          <p className={cn("rounded-lg bg-error/10 px-3 py-2 text-center text-xs font-medium text-error")}>{error}</p>
        )}
        <p className="text-center text-xs text-text-muted">Gratuit · rappel avant le début</p>
      </div>
    );
  }

  // ── Audience réservée (non éligible) ──
  return (
    <div className="rounded-xl border border-navy/15 bg-surface-secondary px-4 py-3.5">
      <p className="flex items-center gap-2 text-sm font-bold text-navy">
        <Lock size={16} aria-hidden />
        Événement réservé
      </p>
      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
        {audience === "COHORT"
          ? "Cet événement est réservé aux membres de la cohorte concernée."
          : "Cet événement est réservé aux apprenants inscrits à la formation ou au parcours associé."}
      </p>
    </div>
  );
}
