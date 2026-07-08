import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, ListChecks, TriangleAlert, ClipboardCheck, Clock, Trophy } from "lucide-react";
import { GradientText, cn } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getProjectWorkspace } from "@/lib/project-queries";
import { SubmissionForm } from "@/components/SubmissionForm";
import { PROJECT_TYPE_LABEL } from "@/lib/learn-labels";
import { LEVEL_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await currentUser();
  if (!user) redirect(`/auth/login?callbackUrl=/dashboard/projets/${slug}`);
  const ws = await getProjectWorkspace(slug, user.id);
  if (!ws) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/projets" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy">
        <ArrowLeft size={16} /> Tous mes projets
      </Link>

      {/* En-tête */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-violet/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-violet">
            {PROJECT_TYPE_LABEL[ws.projectType] ?? "Projet"}
          </span>
          <span className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-semibold text-text-secondary">{LEVEL_LABEL[ws.level]}</span>
          {ws.estimatedDuration ? (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted"><Clock size={13} /> ≈ {ws.estimatedDuration} h</span>
          ) : null}
        </div>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{ws.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">Parcours : {ws.careerPathTitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Brief */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          {ws.context && <Brief title="Contexte" icon={<ClipboardCheck size={16} />}>{ws.context}</Brief>}
          {ws.problem && <Brief title="Problème à résoudre" icon={<TriangleAlert size={16} />}>{ws.problem}</Brief>}
          {ws.mission && <Brief title="Votre mission" icon={<Target size={16} />} accent>{ws.mission}</Brief>}

          {ws.objectives.length > 0 && (
            <ListCard title="Objectifs" icon={<Target size={16} />} items={ws.objectives} />
          )}
          {ws.deliverables.length > 0 && (
            <ListCard title="Livrables attendus" icon={<ListChecks size={16} />} items={ws.deliverables} tone="blue" />
          )}
          {ws.constraints.length > 0 && (
            <ListCard title="Contraintes" icon={<TriangleAlert size={16} />} items={ws.constraints} tone="amber" />
          )}

          {/* Grille d'évaluation */}
          {ws.rubric && (
            <div className="rounded-2xl border border-brand-violet/15 bg-surface-secondary/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy"><Trophy size={16} className="text-brand-violet" /> Grille d'évaluation</h3>
                <span className="text-xs font-semibold text-text-muted">Réussite ≥ {ws.rubric.passingScore}%</span>
              </div>
              <ul className="flex flex-col gap-2">
                {ws.rubric.criteria.map((c, i) => (
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

        {/* Soumission */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 lg:sticky lg:top-24">
            <SubmissionForm projectId={ws.id} submission={ws.submission} enrolled={ws.enrolled} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Brief({ title, icon, children, accent }: { title: string; icon: React.ReactNode; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-5", accent ? "border-brand-blue-vif/20 bg-brand-blue-vif/[0.04]" : "border-navy/[0.07] bg-surface-primary")}>
      <h3 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-navy"><span className="text-brand-blue-royal">{icon}</span> {title}</h3>
      <p className="text-sm leading-relaxed text-navy/80">{children}</p>
    </div>
  );
}

function ListCard({ title, icon, items, tone = "violet" }: { title: string; icon: React.ReactNode; items: string[]; tone?: "violet" | "blue" | "amber" }) {
  const dot = tone === "blue" ? "bg-brand-blue-vif" : tone === "amber" ? "bg-warning" : "bg-brand-violet";
  return (
    <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-navy"><span className="text-brand-blue-royal">{icon}</span> {title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-navy/80">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
