import { redirect } from "next/navigation";
import Link from "next/link";
import { Rocket, ArrowRight, Clock, FolderKanban } from "lucide-react";
import { GradientText } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getMyProjects } from "@/lib/project-queries";
import { DashboardHeading, EmptyState } from "@/components/learner-ui";
import { SubmissionBadge } from "@/components/project-ui";
import { PROJECT_TYPE_LABEL } from "@/lib/learn-labels";
import { LEVEL_LABEL } from "@/lib/types";
import type { ProjectCard } from "@/lib/project-types";

export const dynamic = "force-dynamic";

export default async function ProjetsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard/projets");
  const projects = await getMyProjects(user.id);

  // Regroupement par parcours.
  const groups = new Map<string, ProjectCard[]>();
  for (const p of projects) {
    const arr = groups.get(p.careerPathTitle) ?? [];
    arr.push(p);
    groups.set(p.careerPathTitle, arr);
  }
  const validated = projects.filter((p) => p.status === "VALIDATED" || p.status === "PORTFOLIO_READY").length;

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Apprendre en faisant"
        title={<>Mes <GradientText>projets</GradientText></>}
        description="Prouvez vos compétences en réalisant des projets professionnels. Chaque projet validé décerne un badge et enrichit votre portfolio."
        action={
          projects.length > 0 ? (
            <span className="rounded-full bg-success/10 px-3.5 py-1.5 text-sm font-semibold text-success">
              {validated} / {projects.length} validés
            </span>
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<Rocket size={22} />}
          title="Aucun projet pour l'instant"
          message="Inscrivez-vous à un parcours métier : ses projets professionnels apparaîtront ici, prêts à être réalisés."
          action={{ href: "/career-paths", label: "Explorer les parcours" }}
        />
      ) : (
        [...groups.entries()].map(([pathTitle, items]) => (
          <section key={pathTitle}>
            <h2 className="mb-4 font-display text-lg font-bold text-navy">{pathTitle}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projets/${p.slug}`}
                  className="group flex flex-col rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-violet/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-violet">
                      <FolderKanban size={12} /> {PROJECT_TYPE_LABEL[p.projectType] ?? "Projet"}
                    </span>
                    <SubmissionBadge status={p.status} />
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold leading-snug text-navy">{p.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span>{LEVEL_LABEL[p.level]}</span>
                    {p.estimatedDuration ? <span className="inline-flex items-center gap-1"><Clock size={12} /> ≈ {p.estimatedDuration} h</span> : null}
                    {p.isPortfolioEligible && <span className="text-brand-blue-royal">Éligible portfolio</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {p.score != null ? (
                      <span className="text-sm font-bold text-success">{p.score}%</span>
                    ) : (
                      <span className="text-xs text-text-muted">Non évalué</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal group-hover:text-brand-violet">
                      {p.status === "NOT_STARTED" ? "Démarrer" : "Ouvrir"} <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
