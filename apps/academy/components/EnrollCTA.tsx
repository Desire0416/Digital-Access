"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, PlayCircle, ArrowRight, CreditCard, Clock3, AlertCircle } from "lucide-react";
import { Button, buttonClasses, formatFCFA, cn } from "@da/ui";
import { enrollInPath } from "@/lib/learn-actions";

/* ══════════════════════════════════════════════════════════════════════════
   CTA d'inscription à un parcours, sensible à l'état :
   — inscrit → « Continuer le parcours » (reprend la leçon en cours)
   — paiement en attente → bandeau « En cours de validation »
   — payant, non inscrit → « Payer » → page de paiement Mobile Money (/checkout)
   — gratuit, connecté non inscrit → inscription immédiate puis entrée dans le player
   — visiteur → création de compte (avec retour sur la page cible)

   INVARIANT : pour une formation payante, ce CTA ne crée JAMAIS l'inscription.
   Il mène à /checkout où l'apprenant dépose sa preuve ; seul l'admin ouvre l'accès.
   ══════════════════════════════════════════════════════════════════════════ */

export function EnrollCTA({
  slug,
  price,
  isAuthed,
  enrolled,
  status,
  resumeLessonId,
  firstLessonId,
  showPreview = false,
  pending = false,
  rejectionReason = null,
}: {
  slug: string;
  price: number;
  isAuthed: boolean;
  enrolled: boolean;
  status: string | null;
  resumeLessonId: string | null;
  firstLessonId: string | null;
  showPreview?: boolean;
  pending?: boolean;
  rejectionReason?: string | null;
}) {
  const router = useRouter();
  const [busy, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const isPaid = price > 0;
  const priceLabel = isPaid ? formatFCFA(price) : "Gratuit";

  /* Déjà inscrit → reprendre / revoir */
  if (enrolled) {
    const target = resumeLessonId ?? firstLessonId;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={target ? `/apprendre/${slug}/${target}` : "/dashboard/mes-cours"}
          className={buttonClasses({ variant: "primary", size: "lg" })}
        >
          <PlayCircle size={18} />
          {status === "COMPLETED" ? "Revoir le parcours" : "Continuer le parcours"}
        </Link>
        <Link
          href="/dashboard/mes-cours"
          className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10"
        >
          Mon tableau de bord
        </Link>
      </div>
    );
  }

  /* Paiement déposé, en attente de validation admin */
  if (pending) {
    return (
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold text-white">
          <Clock3 size={18} className="text-warning" />
          Paiement reçu — validation en cours. Vous recevrez une notification dès l'ouverture de l'accès.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/mes-cours"
            className={buttonClasses({ variant: "primary", size: "lg" })}
          >
            Mon tableau de bord <ArrowRight size={16} />
          </Link>
          {showPreview && firstLessonId && (
            <Link
              href={`/apprendre/${slug}/${firstLessonId}`}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10"
            >
              <PlayCircle size={17} /> Aperçu gratuit
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* Inscription gratuite immédiate */
  function enrollFree() {
    setError(null);
    startTransition(async () => {
      const res = await enrollInPath(slug);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const target = (res.firstLessonId as string | null) ?? firstLessonId;
      router.push(target ? `/apprendre/${slug}/${target}` : "/dashboard/mes-cours");
    });
  }

  const checkoutHref = `/checkout/${slug}`;
  const registerHref = `/auth/register?callbackUrl=${encodeURIComponent(isPaid ? checkoutHref : `/career-paths/${slug}`)}`;

  return (
    <div className="flex flex-col gap-2">
      {rejectionReason && (
        <div className="flex items-start gap-2 rounded-lg border border-error/40 bg-error/10 px-4 py-2.5 text-sm text-white">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
          <span>Votre précédent paiement n'a pas été validé{rejectionReason ? ` : ${rejectionReason}` : ""}. Vous pouvez réessayer.</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {!isAuthed ? (
          <Link href={registerHref} className={buttonClasses({ variant: "primary", size: "lg" })}>
            <GraduationCap size={18} /> S'inscrire — {priceLabel}
          </Link>
        ) : isPaid ? (
          <Link href={checkoutHref} className={buttonClasses({ variant: "primary", size: "lg" })}>
            <CreditCard size={18} /> Payer — {priceLabel}
          </Link>
        ) : (
          <Button size="lg" onClick={enrollFree} loading={busy}>
            <GraduationCap size={18} /> S'inscrire — {priceLabel}
          </Button>
        )}

        {showPreview && firstLessonId && (
          <Link
            href={`/apprendre/${slug}/${firstLessonId}`}
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10"
          >
            <PlayCircle size={17} /> Aperçu gratuit
          </Link>
        )}
      </div>
      {isPaid && !rejectionReason && (
        <p className="text-xs text-white/60">Paiement Mobile Money (Orange, MTN, Wave) — accès activé après validation.</p>
      )}
      {error && (
        <p className={cn("text-sm font-medium", error.includes("email") ? "text-warning" : "text-error")}>
          {error}{" "}
          {error.includes("email") && (
            <Link href="/auth/verify-email" className="inline-flex items-center gap-1 underline">
              Confirmer <ArrowRight size={13} />
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
