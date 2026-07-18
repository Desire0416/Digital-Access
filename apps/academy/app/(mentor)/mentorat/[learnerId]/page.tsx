import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Route as RouteIcon,
  ClipboardCheck,
  Award,
  Clock,
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { Container, Avatar, cn } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getMenteeDetail, type MenteeCourseRow, type MenteePathRow, type MenteeAttemptRow } from "@/lib/mentor";
import { Panel, EnrollmentBadge } from "@/components/espace/parts";
import { ProgressBar } from "@/components/espace/ProgressBar";
import { MenteePanel } from "@/components/mentor/MenteePanel";

export const metadata: Metadata = { title: "Mentoré" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default async function MenteeDetailPage({ params }: { params: Promise<{ learnerId: string }> }) {
  const { learnerId } = await params;
  const user = await requireRole(["MENTOR", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"], "/mentorat");
  const m = await getMenteeDetail(user.id, learnerId);
  if (!m) notFound(); // cloisonnement : null = apprenant non assigné

  return (
    <Container className="py-10 sm:py-14">
      <Link
        href="/mentorat"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={15} aria-hidden />
        Mes mentorés
      </Link>

      {/* En-tête du mentoré */}
      <section className="relative mt-4 overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={m.name} src={m.avatar ?? undefined} className="h-16 w-16 shrink-0 ring-2 ring-white/20" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{m.name}</h1>
            <p className="mt-0.5 truncate text-sm text-white/70">{m.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Award size={13} className="text-brand-cyan" aria-hidden />
                {m.certificatesCount} certificat{m.certificatesCount > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-brand-cyan" aria-hidden />
                {m.lastActiveAt ? `Actif le ${dateFmt.format(m.lastActiveAt)}` : "Jamais connecté"}
              </span>
            </div>
          </div>
        </div>

        {(m.objective || m.experienceLevel) && (
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            {m.objective && (
              <div className="rounded-xl bg-white/[0.07] p-4">
                <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-cyan">
                  <Target size={12} aria-hidden />
                  Objectif
                </p>
                <p className="text-sm leading-relaxed text-white/85">{m.objective}</p>
              </div>
            )}
            {m.experienceLevel && (
              <div className="rounded-xl bg-white/[0.07] p-4">
                <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-cyan">
                  <Sparkles size={12} aria-hidden />
                  Niveau
                </p>
                <p className="text-sm leading-relaxed text-white/85">{m.experienceLevel}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Formations */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <BookOpen size={16} className="text-brand-blue-royal" aria-hidden />
                Formations
              </span>
            }
          >
            {m.courses.length > 0 ? (
              <ul className="space-y-3">
                {m.courses.map((c) => (
                  <li key={c.id}>
                    <CourseRow course={c} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-sm text-text-secondary">Aucune inscription à une formation.</p>
            )}
          </Panel>

          {/* Parcours métiers */}
          {m.paths.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <RouteIcon size={16} className="text-brand-blue-royal" aria-hidden />
                  Parcours métiers
                </span>
              }
            >
              <ul className="space-y-3">
                {m.paths.map((p) => (
                  <li key={p.id}>
                    <PathRow path={p} />
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
          >
            {m.recentAttempts.length > 0 ? (
              <ul className="divide-y divide-navy/[0.06]">
                {m.recentAttempts.map((a) => (
                  <li key={a.id}>
                    <AttemptRow attempt={a} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-sm text-text-secondary">Aucune évaluation passée pour le moment.</p>
            )}
          </Panel>
        </div>

        {/* Colonne latérale — note privée + messages + actions */}
        <aside className="min-w-0">
          <MenteePanel learnerId={m.learnerId} note={m.note} messages={m.messages} />
        </aside>
      </div>
    </Container>
  );
}

/* ─── Ligne de formation ────────────────────────────────────────────────────── */
function CourseRow({ course: c }: { course: MenteeCourseRow }) {
  return (
    <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/formations/${c.slug}`}
          className="group inline-flex min-w-0 items-center gap-1.5 font-display text-sm font-bold text-navy transition-colors hover:text-brand-blue-royal"
        >
          <span className="truncate">{c.title}</span>
          <ArrowUpRight
            size={14}
            className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
        <EnrollmentBadge status={c.status} />
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <ProgressBar value={c.progress} className="flex-1" />
        <span className="shrink-0 font-display text-xs font-bold tabular-nums text-navy">{Math.round(c.progress)}%</span>
      </div>
    </div>
  );
}

/* ─── Ligne de parcours ─────────────────────────────────────────────────────── */
function PathRow({ path: p }: { path: MenteePathRow }) {
  return (
    <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy">{p.title}</p>
          <p className="truncate text-xs text-text-secondary">{p.targetJob}</p>
        </div>
        <EnrollmentBadge status={p.status} />
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <ProgressBar value={p.progress} className="flex-1" />
        <span className="shrink-0 font-display text-xs font-bold tabular-nums text-navy">{Math.round(p.progress)}%</span>
      </div>
    </div>
  );
}

/* ─── Ligne d'évaluation ────────────────────────────────────────────────────── */
function AttemptRow({ attempt: a }: { attempt: MenteeAttemptRow }) {
  const graded = a.passed !== null;
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          !graded
            ? "bg-navy/[0.05] text-text-muted"
            : a.passed
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error",
        )}
        aria-hidden
      >
        {!graded ? <Clock size={16} /> : a.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{a.assessmentTitle}</p>
        <p className="truncate text-xs text-text-secondary">
          {a.courseTitle ?? "Évaluation"} · {dateTimeFmt.format(a.startedAt)}
        </p>
      </div>
      {a.score !== null && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
            a.passed ? "bg-success/10 text-success" : "bg-error/10 text-error",
          )}
        >
          {Math.round(a.score)}%
        </span>
      )}
    </div>
  );
}
