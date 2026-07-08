import Link from "next/link";
import { ClipboardCheck, ArrowRight, User, Inbox } from "lucide-react";
import { GradientText } from "@da/ui";
import { getReviewQueue } from "@/lib/project-queries";
import { DashboardHeading, EmptyState } from "@/components/learner-ui";
import { SubmissionBadge } from "@/components/project-ui";
import { PROJECT_TYPE_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default async function ReviewsPage() {
  const queue = await getReviewQueue();

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Espace relecteur"
        title={<>File de <GradientText>relecture</GradientText></>}
        description="Évaluez les projets soumis à la grille de compétences. Une validation décerne un badge et enrichit le portfolio de l'apprenant."
        action={
          <span className="rounded-full bg-accent/10 px-3.5 py-1.5 text-sm font-semibold text-accent">
            {queue.length} en attente
          </span>
        }
      />

      {queue.length === 0 ? (
        <EmptyState icon={<Inbox size={22} />} title="Aucun projet à évaluer" message="La file est vide pour le moment. Les nouvelles soumissions apparaîtront ici." />
      ) : (
        <div className="flex flex-col gap-3">
          {queue.map((s) => (
            <Link
              key={s.submissionId}
              href={`/reviews/${s.submissionId}`}
              className="group flex flex-col gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg sm:flex-row sm:items-center"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                <ClipboardCheck size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-navy">{s.projectTitle}</h3>
                  <span className="rounded-full bg-brand-violet/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-violet">
                    {PROJECT_TYPE_LABEL[s.projectType] ?? "Projet"}
                  </span>
                  {s.version > 1 && <span className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[10px] font-semibold text-text-muted">v{s.version}</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1"><User size={13} /> {s.learnerName}</span>
                  <span>{s.careerPathTitle}</span>
                  {s.submittedAt && <span>Soumis le {DATE.format(new Date(s.submittedAt))}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SubmissionBadge status={s.status} />
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal group-hover:text-brand-violet">
                  Évaluer <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
