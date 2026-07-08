import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Link2, FileText, Sparkles, Target, ListChecks, Trophy, User, CheckCircle2 } from "lucide-react";
import { GradientText, cn } from "@da/ui";
import { getSubmissionForReview } from "@/lib/project-queries";
import { ReviewForm } from "@/components/ReviewForm";
import { SubmissionBadge } from "@/components/project-ui";
import { PROJECT_TYPE_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getSubmissionForReview(id);
  if (!r) notFound();
  const finalized = r.status === "VALIDATED" || r.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/reviews" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy">
        <ArrowLeft size={16} /> File de relecture
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-violet/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-violet">
            {PROJECT_TYPE_LABEL[r.project.projectType] ?? "Projet"}
          </span>
          <SubmissionBadge status={r.status} />
          {r.version > 1 && <span className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-semibold text-text-muted">Version {r.version}</span>}
        </div>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{r.project.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
          <User size={14} /> {r.learner.name} · {r.project.careerPathTitle}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Soumission + brief */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          {/* Livrables */}
          <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
            <h2 className="mb-3 font-display text-base font-bold text-navy">Livrables soumis</h2>
            {r.links.length === 0 && r.files.length === 0 ? (
              <p className="text-sm text-text-muted">Aucun livrable.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {r.links.map((l, i) => (
                  <li key={`l${i}`}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue-royal hover:text-brand-violet">
                      <Link2 size={14} /> {l.label}
                    </a>
                  </li>
                ))}
                {r.files.map((f, i) => (
                  <li key={`f${i}`}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue-royal hover:text-brand-violet">
                      <FileText size={14} /> {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {r.comment && (
              <div className="mt-4 border-t border-navy/[0.06] pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Note de l'apprenant</p>
                <p className="whitespace-pre-wrap text-sm text-navy/80">{r.comment}</p>
              </div>
            )}
            {r.aiDeclaration && (
              <div className="mt-4 rounded-lg bg-accent/[0.05] p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent"><Sparkles size={12} /> Déclaration IA</p>
                <p className="whitespace-pre-wrap text-sm text-navy/80">{r.aiDeclaration}</p>
              </div>
            )}
          </div>

          {/* Brief de référence */}
          {r.project.mission && (
            <div className="rounded-2xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.04] p-5">
              <h3 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-navy"><Target size={16} className="text-brand-blue-royal" /> Mission demandée</h3>
              <p className="text-sm leading-relaxed text-navy/80">{r.project.mission}</p>
            </div>
          )}
          {r.project.objectives.length > 0 && (
            <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-navy"><ListChecks size={16} className="text-brand-blue-royal" /> Objectifs</h3>
              <ul className="flex flex-col gap-2">
                {r.project.objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-navy/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet" /> {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Grille */}
          {r.rubric && (
            <div className="rounded-2xl border border-brand-violet/15 bg-surface-secondary/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy"><Trophy size={16} className="text-brand-violet" /> Grille d'évaluation</h3>
                <span className="text-xs font-semibold text-text-muted">Réussite ≥ {r.rubric.passingScore}%</span>
              </div>
              <ul className="flex flex-col gap-2">
                {r.rubric.criteria.map((c, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg bg-surface-primary px-3.5 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-navy">{c.label}</p>
                      {c.description && <p className="text-xs text-text-muted">{c.description}</p>}
                    </div>
                    <span className="shrink-0 rounded-md bg-brand-violet/10 px-2 py-0.5 text-xs font-bold text-brand-violet">{c.points} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Évaluation */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 lg:sticky lg:top-24">
            {finalized ? (
              <div className="flex flex-col gap-3">
                <h2 className="font-display text-lg font-bold text-navy">Évaluation finalisée</h2>
                <div className={cn("rounded-xl border p-4", r.status === "VALIDATED" ? "border-success/25 bg-success/[0.05]" : "border-error/25 bg-error/[0.05]")}>
                  <p className={cn("flex items-center gap-2 text-sm font-bold", r.status === "VALIDATED" ? "text-success" : "text-error")}>
                    <CheckCircle2 size={16} /> {r.status === "VALIDATED" ? "Projet validé" : "Projet non retenu"}
                    {r.score != null && <span className="ml-auto">{r.score}%</span>}
                  </p>
                  {r.feedback && <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{r.feedback}</p>}
                </div>
              </div>
            ) : (
              <ReviewForm submissionId={r.submissionId} passingScore={r.rubric?.passingScore ?? 70} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
