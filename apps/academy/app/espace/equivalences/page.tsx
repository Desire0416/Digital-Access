import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ExternalLink, ArrowRight, Info } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getMyEquivalences } from "@/lib/equivalences";
import { EspaceHeader } from "@/components/espace/parts";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/admin/ui";
import {
  EVIDENCE_TYPE_LABEL,
  EQUIVALENCE_STATUS_LABEL,
  EQUIVALENCE_STATUS_TONE,
} from "@/lib/equivalence-labels";

export const metadata: Metadata = { title: "Mes équivalences" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export default async function MyEquivalencesPage() {
  const user = await requireUser("/espace/equivalences");
  const requests = await getMyEquivalences(user.id);

  return (
    <div>
      <EspaceHeader
        title="Mes équivalences"
        subtitle="Faites reconnaître vos acquis (certificat, diplôme, portfolio, expérience) pour être dispensé·e d'une formation."
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={<BadgeCheck size={40} className="text-brand-blue-royal/30" />}
          title="Aucune demande d'équivalence"
          description="Sur la page d'une formation, cliquez sur « Faire reconnaître une équivalence » si vous possédez déjà ces compétences."
          action={{ label: "Parcourir les formations", href: "/formations" }}
        />
      ) : (
        <>
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-brand-blue-royal/15 bg-brand-blue-royal/[0.04] px-4 py-3 text-sm text-text-secondary">
            <Info size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" />
            <p>
              Une équivalence <strong className="font-semibold text-navy">acceptée</strong> reconnaît la formation
              comme acquise ; <strong className="font-semibold text-navy">partielle</strong>, elle vous ouvre la
              formation gratuitement pour compléter ce qui manque.
            </p>
          </div>

          <ul className="space-y-3">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/formations/${r.courseSlug}`}
                        className="font-display text-base font-bold text-navy transition-colors hover:text-brand-blue-royal"
                      >
                        {r.courseTitle}
                      </Link>
                      <StatusPill label={EQUIVALENCE_STATUS_LABEL[r.status]} tone={EQUIVALENCE_STATUS_TONE[r.status]} />
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {EVIDENCE_TYPE_LABEL[r.evidenceType]} · déposée le {dateFmt.format(r.createdAt)}
                    </p>
                  </div>

                  {(r.status === "ACCEPTED" || r.status === "PARTIAL") && (
                    <Link
                      href={`/apprendre/${r.courseSlug}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-da px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
                    >
                      Accéder à la formation
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{r.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  {r.proofLink && (
                    <a
                      href={r.proofLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-brand-blue-royal hover:underline"
                    >
                      <ExternalLink size={13} />
                      Voir le lien de preuve
                    </a>
                  )}
                  {r.proofUrl && (
                    <a
                      href={r.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-brand-blue-royal hover:underline"
                    >
                      <ExternalLink size={13} />
                      Voir la capture
                    </a>
                  )}
                </div>

                {r.reviewNote && (
                  <div className="mt-3 rounded-xl bg-surface-secondary px-3.5 py-2.5 text-sm text-text-secondary">
                    <span className="font-semibold text-navy">Réponse de l'équipe :</span> {r.reviewNote}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
