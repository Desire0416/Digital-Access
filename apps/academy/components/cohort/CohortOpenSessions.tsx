"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  CalendarClock,
  Users,
  GraduationCap,
  ArrowRight,
  CreditCard,
  Loader2,
  Lock,
} from "lucide-react";
import { buttonClasses, cn, Badge } from "@da/ui";
import type { CohortType } from "@da/academy-db/client";
import type { PublicCohort } from "@/lib/cohorts";
import { joinFreeCohort } from "@/lib/cohort-actions";
import { formatFCFA } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Cohortes ouvertes à l'inscription (cahier §23.4) — affichées sous une fiche
   formation ou parcours. Une cohorte GRATUITE passe par le Server Action
   `joinFreeCohort` (revérifie tout côté serveur) ; une cohorte PAYANTE renvoie
   vers le tunnel de paiement. Rendu déterministe (fuseau fixe Abidjan).
   ══════════════════════════════════════════════════════════════════════════ */

const TZ = "Africa/Abidjan";

const TYPE_LABEL: Record<CohortType, string> = {
  AUTONOMOUS: "Autonome",
  GUIDED: "Accompagnée",
  INTENSIVE: "Intensive",
  ENTERPRISE: "Entreprise",
  HYBRID: "Hybride",
  VIRTUAL_CLASS: "Classe virtuelle",
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: TZ }).format(d);
}

export function CohortOpenSessions({ cohorts }: { cohorts: PublicCohort[] }) {
  if (cohorts.length === 0) return null;
  return (
    <div className="space-y-4">
      {cohorts.map((c) => (
        <CohortRow key={c.id} cohort={c} />
      ))}
    </div>
  );
}

function CohortRow({ cohort }: { cohort: PublicCohort }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isFree = cohort.effectivePrice === 0;

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const res = await joinFreeCohort(cohort.id);
      if (res.ok) {
        router.push(`/espace/cohortes/${cohort.id}`);
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
    <motion.div
      {...(reduce
        ? {}
        : {
            whileHover: { y: -3, boxShadow: "0 18px 40px -20px rgba(43,58,140,0.35)" },
            transition: { type: "spring", stiffness: 300, damping: 24 },
          })}
      className="relative overflow-hidden rounded-xl border border-navy/[0.08] bg-surface-primary p-5"
    >
      <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-blue-vif/[0.06] blur-2xl" aria-hidden />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* ── Infos ── */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gradient">{TYPE_LABEL[cohort.type] ?? cohort.type}</Badge>
            {cohort.code && <Badge variant="outline">{cohort.code}</Badge>}
            {cohort.isFull && <Badge variant="warning">Complète</Badge>}
          </div>

          <h3 className="mt-2.5 font-display text-base font-bold leading-snug text-navy">{cohort.name}</h3>
          {cohort.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">{cohort.description}</p>
          )}

          {/* Méta */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} className="text-brand-blue-royal" aria-hidden />
              {cohort.endDate
                ? `Du ${formatDate(cohort.startDate)} au ${formatDate(cohort.endDate)}`
                : `À partir du ${formatDate(cohort.startDate)}`}
            </span>
            {cohort.rhythm && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={13} className="text-brand-blue-royal" aria-hidden />
                {cohort.rhythm}
              </span>
            )}
            <span className={cn("inline-flex items-center gap-1.5", cohort.isFull && "font-semibold text-error")}>
              <Users size={13} aria-hidden />
              {cohort.capacity == null
                ? "Places illimitées"
                : cohort.isFull
                  ? "Complète"
                  : `${cohort.seatsLeft} place${(cohort.seatsLeft ?? 0) > 1 ? "s" : ""} restante${(cohort.seatsLeft ?? 0) > 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Formateurs */}
          {cohort.instructors.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy/80">
              <GraduationCap size={13} className="text-brand-violet" aria-hidden />
              {cohort.instructors.map((ins, i) => (
                <span key={i}>
                  <span className="font-semibold">{ins.name}</span>
                  <span className="text-text-muted"> · {ins.roleLabel}</span>
                </span>
              ))}
            </div>
          )}

          {cohort.enrollmentDeadline && (
            <p className="mt-2.5 text-[11px] font-medium text-warning">
              Clôture des inscriptions le {formatDate(cohort.enrollmentDeadline)}
            </p>
          )}
        </div>

        {/* ── Prix + action ── */}
        <div className="shrink-0 lg:w-52 lg:text-right">
          <p
            className={cn(
              "font-display text-2xl font-bold",
              isFree ? "text-success" : "text-navy",
            )}
          >
            {isFree ? "Gratuit" : formatFCFA(cohort.effectivePrice)}
          </p>

          <div className="mt-3">
            {cohort.isFull ? (
              <button
                type="button"
                disabled
                className={buttonClasses({ variant: "outline", className: "w-full cursor-not-allowed" })}
              >
                <Lock size={16} aria-hidden />
                Complète
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
              <Link
                href={`/paiement/cohorte/${cohort.slug}`}
                className={buttonClasses({ className: "w-full" })}
              >
                <CreditCard size={16} aria-hidden />
                Rejoindre — {formatFCFA(cohort.effectivePrice)}
              </Link>
            )}
          </div>

          {error && (
            <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-center text-xs font-medium text-error lg:text-right">
              {error}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
