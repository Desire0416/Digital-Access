import type { Metadata } from "next";
import Link from "next/link";
import {
  PlayCircle,
  BookOpen,
  Award,
  Route as RouteIcon,
  Flame,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Bell,
  Sparkles,
  GraduationCap,
  CalendarClock,
  Video,
  Megaphone,
  Pin,
} from "lucide-react";
import { buttonClasses } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getLearnerDashboard } from "@/lib/learn-queries";
import { getRecommendations } from "@/lib/recommendations";
import { getMyNotifications } from "@/lib/notify";
import { getUpcomingAgenda } from "@/lib/events";
import { getMyAnnouncements } from "@/lib/announcements";
import { LEVEL_LABEL } from "@/lib/site";
import { RecommendationGrid } from "@/components/RecommendationGrid";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader, StatTile, Panel } from "@/components/espace/parts";
import { ProgressBar } from "@/components/espace/ProgressBar";

export const metadata: Metadata = { title: "Tableau de bord" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function EspaceDashboardPage() {
  const user = await requireUser("/espace");

  const [dashboard, notifData, agenda, announcements] = await Promise.all([
    getLearnerDashboard(user.id),
    getMyNotifications(user.id, { unreadOnly: true, take: 5 }),
    getUpcomingAgenda(user.id, { take: 4 }),
    getMyAnnouncements(user.id, { take: 3 }),
  ]);

  const { resume, enrollments, pathEnrollments, recentAttempts, certificates, stats } = dashboard;

  // Formations en cours (ACTIVE) triées par avancement.
  const inProgress = enrollments.filter((e) => e.status === "ACTIVE").slice(0, 4);

  // Parcours actif (le plus récent en cours) — récupère la phase courante.
  const activePath = pathEnrollments.find((p) => p.status === "ACTIVE") ?? null;

  // Recommandations personnalisées (§33) — moteur déterministe (niveau,
  // objectif, historique, résultats, compétences, favoris, parcours actifs).
  const recommendations = await getRecommendations(user.id, { limit: 3 });

  const resumeHref = resume
    ? resume.lessonId
      ? `/apprendre/${resume.courseSlug}/${resume.lessonId}`
      : `/formations/${resume.courseSlug}`
    : null;

  return (
    <div className="space-y-8">
      <EspaceHeader
        title={`Bonjour, ${user.name.split(" ")[0]} 👋`}
        subtitle="Voici l'essentiel de votre progression."
      />

      {/* ── Reprendre ── */}
      {resume && resumeHref ? (
        <section className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
          <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-cyan">
                <PlayCircle size={15} aria-hidden />
                Reprendre là où vous en étiez
              </p>
              <h2 className="mt-2 font-display text-xl font-bold leading-snug sm:text-2xl">{resume.courseTitle}</h2>
              <div className="mt-4 max-w-md">
                <div className="mb-1.5 flex items-center justify-between text-xs text-white/70">
                  <span>Progression</span>
                  <span className="font-bold text-white">{Math.round(resume.progress)}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-cyan to-white"
                    style={{ width: `${Math.max(4, Math.round(resume.progress))}%` }}
                    aria-hidden
                  />
                </div>
              </div>
            </div>
            <Link
              href={resumeHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-display text-sm font-bold text-navy shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
            >
              {resume.lessonId ? "Continuer" : "Revoir la formation"}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Aucune formation en cours"
          description="Explorez le catalogue et commencez votre première formation dès aujourd'hui."
          action={{ label: "Parcourir les formations", href: "/formations" }}
        />
      )}

      {/* ── Statistiques ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<BookOpen size={18} />}
          value={stats.activeCourses}
          label="Formations en cours"
          href="/espace/formations"
        />
        <StatTile
          icon={<CheckCircle2 size={18} />}
          value={stats.completedCourses}
          label="Formations terminées"
          href="/espace/formations"
          accent="text-success"
        />
        <StatTile
          icon={<RouteIcon size={18} />}
          value={stats.activePaths}
          label="Parcours actifs"
          href="/espace/parcours"
          accent="text-brand-violet"
        />
        <StatTile
          icon={<Award size={18} />}
          value={stats.certificatesCount}
          label="Certificats"
          href="/espace/certificats"
          accent="text-warning"
        />
      </div>

      {/* ── Prochains rendez-vous (§16.1) — cohortes & événements ── */}
      {agenda.length > 0 && (
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <CalendarClock size={16} className="text-brand-violet" aria-hidden />
              Prochains rendez-vous
            </span>
          }
          action={
            <Link
              href="/espace/agenda"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal hover:text-brand-violet"
            >
              Agenda complet <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {agenda.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-xl border border-navy/[0.06] p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-da text-white" aria-hidden>
                  <CalendarClock size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-navy">{it.title}</p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {dateTimeFmt.format(it.startAt)}
                    {it.cohortName ? ` · ${it.cohortName}` : it.source === "SESSION" ? " · Session de cohorte" : ""}
                  </p>
                </div>
                {it.meetingUrl && (
                  <a
                    href={it.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-da px-2.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
                  >
                    <Video size={13} aria-hidden /> Rejoindre
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Colonne principale ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Formations en cours */}
          {inProgress.length > 0 && (
            <Panel
              title="Vos formations en cours"
              action={
                <Link
                  href="/espace/formations"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal hover:text-brand-violet"
                >
                  Tout voir <ArrowRight size={13} aria-hidden />
                </Link>
              }
            >
              <ul className="space-y-3">
                {inProgress.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/apprendre/${e.course.slug}`}
                      className="flex items-center gap-4 rounded-xl border border-navy/[0.06] p-3 transition-colors hover:border-brand-blue-vif/40 hover:bg-brand-blue-vif/[0.03]"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-da text-white" aria-hidden>
                        <BookOpen size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-bold text-navy">{e.course.title}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <ProgressBar value={e.progress} height="h-1.5" />
                          <span className="shrink-0 text-xs font-bold tabular-nums text-navy">{Math.round(e.progress)}%</span>
                        </div>
                      </div>
                      <span className="hidden text-xs font-medium text-text-muted sm:block">
                        {LEVEL_LABEL[e.course.level] ?? e.course.level}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Parcours actif */}
          {activePath && (
            <Panel title="Votre parcours métier">
              <Link
                href="/espace/parcours"
                className="block rounded-xl border border-navy/[0.06] bg-surface-secondary/40 p-4 transition-colors hover:border-brand-violet/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-violet">
                      <RouteIcon size={12} aria-hidden />
                      {activePath.careerPath.targetJob}
                    </p>
                    <h3 className="mt-1 truncate font-display text-sm font-bold text-navy">{activePath.careerPath.title}</h3>
                  </div>
                  <span className="shrink-0 font-display text-lg font-bold text-navy">
                    {Math.round(activePath.progress)}%
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={activePath.progress} />
                </div>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal">
                  Continuer le parcours
                  <ArrowRight size={13} aria-hidden />
                </p>
              </Link>
            </Panel>
          )}

          {/* Recommandations personnalisées (§33) */}
          {recommendations.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-blue-vif" aria-hidden />
                  Recommandé pour vous
                </span>
              }
              action={
                <Link
                  href="/espace/recommandations"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal hover:underline"
                >
                  Voir tout
                  <ArrowRight size={13} />
                </Link>
              }
            >
              <RecommendationGrid recommendations={recommendations} columns={3} />
            </Panel>
          )}
        </div>

        {/* ── Colonne secondaire ── */}
        <div className="space-y-6">
          {/* Notifications non lues */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <Bell size={16} className="text-brand-blue-royal" aria-hidden />
                Notifications
              </span>
            }
          >
            {notifData.notifications.length > 0 ? (
              <ul className="space-y-2.5">
                {notifData.notifications.map((n) => {
                  const body = (
                    <div className="rounded-xl border border-navy/[0.06] bg-surface-secondary/40 p-3">
                      <p className="text-sm font-semibold text-navy">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">{n.message}</p>
                      <p className="mt-1.5 text-[11px] text-text-muted">{dateFmt.format(n.createdAt)}</p>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link href={n.link} className="block transition-opacity hover:opacity-80">
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-text-secondary">Vous êtes à jour. Aucune notification.</p>
            )}
          </Panel>

          {/* Annonces (§16.1) — cohortes & formations */}
          {announcements.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <Megaphone size={16} className="text-accent" aria-hidden />
                  Annonces
                </span>
              }
            >
              <ul className="space-y-2.5">
                {announcements.map((an) => (
                  <li key={an.id} className="rounded-xl border border-navy/[0.06] bg-surface-secondary/40 p-3">
                    <div className="flex items-center gap-1.5">
                      {an.pinned && <Pin size={12} className="shrink-0 text-accent" aria-hidden />}
                      <p className="truncate text-sm font-semibold text-navy">{an.title}</p>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">{an.body}</p>
                    <p className="mt-1.5 text-[11px] text-text-muted">
                      {an.cohortName ?? an.courseTitle ?? "Annonce"} · {dateFmt.format(an.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Évaluations récentes */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck size={16} className="text-brand-blue-royal" aria-hidden />
                Évaluations récentes
              </span>
            }
            action={
              <Link
                href="/espace/evaluations"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal hover:text-brand-violet"
              >
                Tout voir <ArrowRight size={13} aria-hidden />
              </Link>
            }
          >
            {recentAttempts.length > 0 ? (
              <ul className="space-y-2.5">
                {recentAttempts.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.passed ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                      aria-hidden
                    >
                      {a.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{a.assessment.title}</p>
                      <p className="truncate text-xs text-text-secondary">{a.assessment.course?.title}</p>
                    </div>
                    {a.score !== null && (
                      <span className={`shrink-0 text-sm font-bold tabular-nums ${a.passed ? "text-success" : "text-error"}`}>
                        {a.score}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-text-secondary">Aucune évaluation passée pour l'instant.</p>
            )}
          </Panel>

          {/* Certificats récents */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <Award size={16} className="text-warning" aria-hidden />
                Derniers certificats
              </span>
            }
          >
            {certificates.length > 0 ? (
              <ul className="space-y-2.5">
                {certificates.map((c) => (
                  <li key={c.id}>
                    <Link
                      href="/espace/certificats"
                      className="flex items-center gap-3 rounded-xl border border-navy/[0.06] p-3 transition-colors hover:border-warning/40"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-violet/15 to-brand-cyan/15 text-brand-violet" aria-hidden>
                        <GraduationCap size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">{c.title}</p>
                        <p className="text-xs text-text-muted">{dateFmt.format(c.issuedAt)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-3 text-center">
                <p className="text-sm text-text-secondary">Vos certificats apparaîtront ici.</p>
                <Link
                  href="/formations"
                  className={buttonClasses({ variant: "outline", size: "sm", className: "mt-3" })}
                >
                  Commencer une formation
                </Link>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
