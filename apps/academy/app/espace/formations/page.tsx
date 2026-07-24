import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Route as RouteIcon, Award, PlayCircle, RotateCcw, Clock, Layers } from "lucide-react";
import { StaggerGroup, StaggerItem, cn } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getMyCourses } from "@/lib/learn-queries";
import { LEVEL_LABEL } from "@/lib/site";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader, EnrollmentBadge } from "@/components/espace/parts";
import { ProgressBar } from "@/components/espace/ProgressBar";

export const metadata: Metadata = { title: "Mes formations" };

export default async function MyCoursesPage() {
  const user = await requireUser("/espace/formations");
  const courses = await getMyCourses(user.id);

  return (
    <div>
      <EspaceHeader
        title="Mes formations"
        subtitle="Une carte par formation. Une formation acquise reste la vôtre — même dans plusieurs parcours."
        action={{ label: "Explorer le catalogue", href: "/formations" }}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} className="text-brand-blue-royal/40" />}
          title="Vous n'êtes inscrit à aucune formation"
          description="Choisissez une formation dans le catalogue pour démarrer votre apprentissage."
          action={{ label: "Parcourir les formations", href: "/formations" }}
        />
      ) : (
        <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {courses.map((item) => {
            const done = item.status === "COMPLETED";
            const started = item.progress > 0 || item.status !== "ACTIVE";
            const continueHref = item.nextLessonId
              ? `/apprendre/${item.course.slug}/${item.nextLessonId}`
              : `/apprendre/${item.course.slug}`;

            return (
              <StaggerItem key={item.enrollmentId}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
                  {/* Cover */}
                  <div className="relative aspect-[16/7] overflow-hidden">
                    {item.course.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.course.coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className="relative h-full w-full"
                        style={{ background: "linear-gradient(125deg,#5b3fa8,#2b5cc6 45%,#1e8fe1 72%,#00bcd4)" }}
                        aria-hidden
                      >
                        <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full border border-white/20" />
                        <span className="absolute inset-0 bg-grid opacity-30" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <EnrollmentBadge status={item.status} />
                      {item.certificate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-navy backdrop-blur-sm">
                          <Award size={11} className="text-brand-violet" aria-hidden />
                          Certifié
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corps */}
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-base font-bold leading-snug text-navy">{item.course.title}</h2>
                    {item.course.subtitle && (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">{item.course.subtitle}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Layers size={13} aria-hidden />
                        {LEVEL_LABEL[item.course.level] ?? item.course.level}
                      </span>
                      {item.course.durationHours != null && item.course.durationHours > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} aria-hidden />
                          {item.course.durationHours} h
                        </span>
                      )}
                    </div>

                    {/* Parcours liés */}
                    {item.linkedPaths.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                          Parcours :
                        </span>
                        {item.linkedPaths.map((p) => (
                          <Link
                            key={p.id}
                            href={`/parcours-metiers/${p.slug}`}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-violet/[0.08] px-2.5 py-1 text-[11px] font-semibold text-brand-violet transition-colors hover:bg-brand-violet/15"
                          >
                            <RouteIcon size={11} aria-hidden />
                            {p.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Progression */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-text-secondary">Progression</span>
                        <span className="font-bold tabular-nums text-navy">{Math.round(item.progress)}%</span>
                      </div>
                      <ProgressBar value={item.progress} />
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-2 pt-5">
                      <Link
                        href={continueHref}
                        className={cn(
                          "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95",
                          done
                            ? "border border-navy/10 bg-surface-secondary text-navy"
                            : "bg-gradient-da text-white shadow-brand",
                        )}
                      >
                        {done ? (
                          <>
                            <RotateCcw size={15} aria-hidden />
                            Revoir
                          </>
                        ) : started ? (
                          <>
                            <PlayCircle size={15} aria-hidden />
                            Continuer
                          </>
                        ) : (
                          <>
                            <PlayCircle size={15} aria-hidden />
                            Commencer
                          </>
                        )}
                      </Link>
                      {item.certificate && (
                        <Link
                          href="/espace/certificats"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-violet/25 px-3 py-2.5 text-sm font-semibold text-brand-violet transition-colors hover:bg-brand-violet/[0.06]"
                        >
                          <Award size={15} aria-hidden />
                          Certificat
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
