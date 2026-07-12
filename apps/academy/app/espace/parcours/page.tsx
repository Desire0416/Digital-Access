import type { Metadata } from "next";
import Link from "next/link";
import {
  Route as RouteIcon,
  CheckCircle2,
  CircleDot,
  Circle,
  Award,
  Briefcase,
  ArrowRight,
  FolderKanban,
} from "lucide-react";
import { StaggerGroup, StaggerItem, cn } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getMyPaths } from "@/lib/learn-queries";
import { LEVEL_LABEL } from "@/lib/site";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader, EnrollmentBadge, Panel } from "@/components/espace/parts";
import { ProgressBar } from "@/components/espace/ProgressBar";

export const metadata: Metadata = { title: "Mes parcours" };

const STATE_META: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  validee: { icon: CheckCircle2, className: "text-success" },
  "en-cours": { icon: CircleDot, className: "text-info" },
  "a-venir": { icon: Circle, className: "text-text-muted" },
};

export default async function MyPathsPage() {
  const user = await requireUser("/espace/parcours");
  const paths = await getMyPaths(user.id);

  return (
    <div>
      <EspaceHeader
        title="Mes parcours métiers"
        subtitle="Suivez votre progression phase par phase jusqu'à la certification métier."
        action={{ label: "Explorer les parcours", href: "/parcours-metiers" }}
      />

      {paths.length === 0 ? (
        <EmptyState
          icon={<RouteIcon size={40} className="text-brand-violet/40" />}
          title="Aucun parcours en cours"
          description="Un parcours métier assemble plusieurs formations vers un objectif professionnel précis."
          action={{ label: "Découvrir les parcours", href: "/parcours-metiers" }}
        />
      ) : (
        <StaggerGroup className="space-y-6">
          {paths.map((path) => (
            <StaggerItem key={path.enrollmentId}>
              <Panel className="overflow-hidden !p-0">
                {/* En-tête sombre du parcours */}
                <div className="relative overflow-hidden bg-surface-dark-card p-5 sm:p-6">
                  <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gradient-da opacity-25 blur-2xl" aria-hidden />
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-cyan">
                        <Briefcase size={12} aria-hidden />
                        {path.careerPath.targetJob}
                      </p>
                      <h2 className="mt-1.5 font-display text-lg font-bold leading-snug text-white sm:text-xl">
                        {path.careerPath.title}
                      </h2>
                      <div className="mt-2 flex items-center gap-2">
                        <EnrollmentBadge status={path.status} />
                        {path.certificate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                            <Award size={11} className="text-brand-cyan" aria-hidden />
                            Certifié
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl font-bold text-white">{Math.round(path.progress)}%</p>
                      <p className="text-[11px] text-white/60">
                        {path.completedCourses}/{path.totalCourses} formations
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-4">
                    <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-cyan to-white"
                        style={{ width: `${Math.max(3, Math.round(path.progress))}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline des phases */}
                <div className="p-5 sm:p-6">
                  <ol className="space-y-5">
                    {path.phases.map((phase, idx) => {
                      const isCurrent = phase.id === path.currentPhaseId;
                      return (
                        <li key={phase.id} className="relative pl-8">
                          {/* Ligne verticale */}
                          {idx < path.phases.length - 1 && (
                            <span className="absolute left-[11px] top-7 h-full w-px bg-navy/10" aria-hidden />
                          )}
                          {/* Puce de phase */}
                          <span
                            className={cn(
                              "absolute left-0 top-0.5 grid h-6 w-6 place-items-center rounded-full text-white",
                              phase.completed ? "bg-success" : isCurrent ? "bg-gradient-da" : "bg-navy/15",
                            )}
                            aria-hidden
                          >
                            {phase.completed ? <CheckCircle2 size={14} /> : <span className="text-[11px] font-bold">{idx + 1}</span>}
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-sm font-bold text-navy">{phase.title}</h3>
                            {isCurrent && !phase.completed && (
                              <span className="rounded-full bg-gradient-da px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                En cours
                              </span>
                            )}
                            <span className="text-xs text-text-muted">
                              {phase.completedCount}/{phase.requiredCount} validée{phase.requiredCount > 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Formations de la phase */}
                          <ul className="mt-2 space-y-1.5">
                            {phase.courses.map((c) => {
                              const meta = STATE_META[c.state] ?? STATE_META["a-venir"];
                              const Icon = meta.icon;
                              return (
                                <li key={c.course.id}>
                                  <Link
                                    href={`/apprendre/${c.course.slug}`}
                                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-navy/[0.03]"
                                  >
                                    <Icon size={15} className={cn("shrink-0", meta.className)} aria-hidden />
                                    <span
                                      className={cn(
                                        "flex-1 truncate text-sm",
                                        c.state === "validee" ? "text-text-secondary line-through" : "font-medium text-navy",
                                      )}
                                    >
                                      {c.course.title}
                                    </span>
                                    <span className="shrink-0 text-[11px] text-text-muted">
                                      {LEVEL_LABEL[c.course.level] ?? c.course.level}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      );
                    })}
                  </ol>

                  {/* Formations hors phase */}
                  {path.unphasedCourses.length > 0 && (
                    <div className="mt-5 border-t border-navy/[0.06] pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Formations</p>
                      <ul className="space-y-1.5">
                        {path.unphasedCourses.map((c) => {
                          const meta = STATE_META[c.state] ?? STATE_META["a-venir"];
                          const Icon = meta.icon;
                          return (
                            <li key={c.course.id}>
                              <Link
                                href={`/apprendre/${c.course.slug}`}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-navy/[0.03]"
                              >
                                <Icon size={15} className={cn("shrink-0", meta.className)} aria-hidden />
                                <span
                                  className={cn(
                                    "flex-1 truncate text-sm",
                                    c.state === "validee" ? "text-text-secondary line-through" : "font-medium text-navy",
                                  )}
                                >
                                  {c.course.title}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Projets transversaux */}
                  {path.transversalProjects.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-navy/[0.06] pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                        <FolderKanban size={13} aria-hidden />
                        Projet{path.transversalProjects.length > 1 ? "s" : ""} transversal
                        {path.transversalProjects.length > 1 ? "aux" : ""} :
                      </span>
                      {path.transversalProjects.map((p) => (
                        <span key={p.id} className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-medium text-navy">
                          {p.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Lien fiche */}
                  <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-4">
                    <Link
                      href={`/parcours-metiers/${path.careerPath.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet"
                    >
                      Voir la fiche du parcours
                      <ArrowRight size={14} aria-hidden />
                    </Link>
                    {path.careerPath.certificationTitle && (
                      <span className="hidden items-center gap-1.5 text-xs text-text-secondary sm:inline-flex">
                        <Award size={13} className="text-brand-violet" aria-hidden />
                        {path.careerPath.certificationTitle}
                      </span>
                    )}
                  </div>
                </div>
              </Panel>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
