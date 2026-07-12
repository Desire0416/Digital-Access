import Link from "next/link";
import { UploadCloud, ArrowRight } from "lucide-react";
import { buttonClasses } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Encart « devoir » (§18 · AssessmentType.ASSIGNMENT) — la correction est
   manuelle et le dépôt se fait dans l'espace projets, qui centralise le suivi
   des soumissions et des retours de correcteur (§19).
   ══════════════════════════════════════════════════════════════════════════ */

export function AssignmentPanel({
  title,
  description,
}: {
  title: string;
  description?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-blue-vif/25 bg-gradient-to-br from-brand-blue-vif/[0.05] to-brand-cyan/[0.05] p-6 sm:p-8">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
        <UploadCloud size={26} aria-hidden />
      </span>
      <h2 className="font-display text-lg font-bold text-navy">Devoir à rendre</h2>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">{description}</p>
      ) : (
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
          Ce devoir donne lieu à un livrable corrigé par un formateur. Rendez-vous dans votre espace
          projets pour déposer votre travail et suivre la correction.
        </p>
      )}

      <div className="mt-5 rounded-xl border border-navy/[0.08] bg-white/70 px-4 py-3 text-sm text-navy/80">
        <span className="font-semibold text-navy">« {title} »</span> — dépôt et suivi des versions
        dans l&apos;espace projets.
      </div>

      <Link
        href="/espace/projets"
        className={buttonClasses({ size: "lg", className: "mt-6 inline-flex" })}
      >
        Déposer mon travail
        <ArrowRight size={18} aria-hidden />
      </Link>
    </div>
  );
}
