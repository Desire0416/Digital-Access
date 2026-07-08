"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, PlayCircle, ArrowRight } from "lucide-react";
import { Button, buttonClasses, formatFCFA, cn } from "@da/ui";
import { enrollInPath } from "@/lib/learn-actions";

/* ══════════════════════════════════════════════════════════════════════════
   CTA d'inscription à un parcours, sensible à l'état :
   — inscrit → « Continuer le parcours » (reprend la leçon en cours)
   — connecté non inscrit → inscription (gratuite) puis entrée dans le player
   — visiteur → création de compte (avec retour sur la page du parcours)
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
}: {
  slug: string;
  price: number;
  isAuthed: boolean;
  enrolled: boolean;
  status: string | null;
  resumeLessonId: string | null;
  firstLessonId: string | null;
  showPreview?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const priceLabel = price <= 0 ? "Gratuit" : formatFCFA(price);

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

  function enroll() {
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {isAuthed ? (
          <Button size="lg" onClick={enroll} loading={pending}>
            <GraduationCap size={18} /> S'inscrire — {priceLabel}
          </Button>
        ) : (
          <Link
            href={`/auth/register?callbackUrl=${encodeURIComponent(`/career-paths/${slug}`)}`}
            className={buttonClasses({ variant: "primary", size: "lg" })}
          >
            <GraduationCap size={18} /> S'inscrire — {priceLabel}
          </Link>
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
