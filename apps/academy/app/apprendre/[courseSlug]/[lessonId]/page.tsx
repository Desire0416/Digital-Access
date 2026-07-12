import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Lock,
  UserPlus,
  FileText,
  ExternalLink,
  Paperclip,
  Download,
  ClipboardList,
  FolderKanban,
} from "lucide-react";
import { buttonClasses } from "@da/ui";
import { currentUser } from "@/lib/guards";
import {
  getPlayerCourse,
  getPlayerLesson,
  getAssessmentForTaking,
  type PlayerCourse,
} from "@/lib/learn-queries";
import { LESSON_TYPE_LABEL } from "@/lib/site";
import { Markdown } from "@/components/Markdown";
import { VideoEmbed } from "@/components/VideoEmbed";
import { PlayerShell } from "@/components/player/PlayerShell";
import { QuizRunner } from "@/components/player/QuizRunner";
import { AssignmentPanel } from "@/components/player/AssignmentPanel";

/* ══════════════════════════════════════════════════════════════════════════
   /apprendre/[courseSlug]/[lessonId] — cœur du lecteur (§17).
   Le segment [lessonId] désigne une LEÇON ou, quand aucune leçon ne correspond,
   une ÉVALUATION du même identifiant (les cuid de tables distinctes ne se
   chevauchent pas). La sécurité d'accès est portée par la couche de données :
   `content`/`videoUrl` sont nullés côté serveur si l'utilisateur n'a pas accès.
   ══════════════════════════════════════════════════════════════════════════ */

/** Trouve une évaluation par id dans la structure du cours (module ou finale). */
function findAssessmentMeta(course: PlayerCourse, id: string) {
  for (const m of course.modules) {
    const a = m.assessments.find((x) => x.id === id);
    if (a) return { ...a, moduleTitle: m.title };
  }
  const c = course.courseAssessments.find((x) => x.id === id);
  return c ? { ...c, moduleTitle: null } : null;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const user = await currentUser();
  const userId = user?.id ?? null;

  const course = await getPlayerCourse(courseSlug, userId);
  if (!course) notFound();

  // ── 1) Tente une LEÇON ──────────────────────────────────────────────────
  const lesson = await getPlayerLesson(lessonId, userId);

  if (lesson) {
    const canComplete = lesson.enrolled && lesson.hasAccess && !lesson.locked;
    const banner: "preview" | null =
      !lesson.enrolled && lesson.isPreview && lesson.hasAccess ? "preview" : null;

    return (
      <PlayerShell
        course={course}
        currentId={lesson.id}
        lessonNav={{
          lessonId: lesson.id,
          prevLessonId: lesson.prevLessonId,
          nextLessonId: lesson.nextLessonId,
          completed: lesson.completed,
          canComplete,
        }}
        banner={banner}
      >
        <article className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <header className="mb-6">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
              {lesson.module.title}
              <span className="text-text-muted">·</span>
              <span className="text-text-secondary">
                {LESSON_TYPE_LABEL[lesson.lessonType] ?? lesson.lessonType}
              </span>
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">
              {lesson.title}
            </h1>
          </header>

          {/* ── Contenu selon l'accès et le type ── */}
          {!lesson.hasAccess ? (
            lesson.locked ? (
              <LockedNotice />
            ) : (
              <EnrollNotice slug={courseSlug} />
            )
          ) : (
            <LessonBody lesson={lesson} />
          )}
        </article>
      </PlayerShell>
    );
  }

  // ── 2) Sinon, tente une ÉVALUATION ──────────────────────────────────────
  const meta = findAssessmentMeta(course, lessonId);
  if (!meta) notFound();

  const assessment = userId ? await getAssessmentForTaking(lessonId, userId) : null;

  return (
    <PlayerShell course={course} currentId={lessonId} lessonNav={null} banner={null}>
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-6">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-violet">
            <ClipboardList size={14} aria-hidden />
            {meta.moduleTitle ? `Évaluation · ${meta.moduleTitle}` : "Évaluation finale"}
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">
            {meta.title}
          </h1>
        </header>

        {!assessment ? (
          <EnrollNotice slug={courseSlug} assessment />
        ) : assessment.type === "ASSIGNMENT" ? (
          <AssignmentPanel title={assessment.title} description={assessment.description} />
        ) : (
          <QuizRunner assessment={assessment} />
        )}
      </div>
    </PlayerShell>
  );
}

/* ─── Corps d'une leçon selon son type (§12.2) ─────────────────────────────── */

function LessonBody({ lesson }: { lesson: NonNullable<Awaited<ReturnType<typeof getPlayerLesson>>> }) {
  return (
    <div className="space-y-8">
      {/* Vidéo */}
      {lesson.lessonType === "VIDEO" && lesson.videoUrl && (
        <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
      )}

      {/* Lien externe */}
      {lesson.lessonType === "EXTERNAL_LINK" && lesson.externalUrl && (
        <a
          href={lesson.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-brand-blue-vif/25 bg-brand-blue-vif/[0.04] p-5 transition-colors hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.08]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
            <ExternalLink size={22} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-bold text-navy">
              Ouvrir la ressource
            </span>
            <span className="block truncate text-sm text-text-secondary">{lesson.externalUrl}</span>
          </span>
        </a>
      )}

      {/* Contenu markdown (TEXT, CASE_STUDY, WORKSHOP, LAB, DEMO, PRESENTATION…) */}
      {lesson.content && <Markdown>{lesson.content}</Markdown>}

      {/* Aucun contenu disponible */}
      {!lesson.content && !lesson.videoUrl && !lesson.externalUrl && (
        <p className="rounded-xl border border-navy/10 bg-surface-secondary px-4 py-6 text-center text-sm text-text-secondary">
          Le contenu de cette leçon sera bientôt disponible.
        </p>
      )}

      {/* Ressources téléchargeables (§12.3) */}
      {lesson.resources.length > 0 && (
        <section className="rounded-2xl border border-navy/[0.08] bg-surface-secondary/60 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-navy">
            <Paperclip size={15} className="text-brand-blue-royal" aria-hidden />
            Ressources de la leçon
          </h2>
          <ul className="space-y-2">
            {lesson.resources.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-navy/[0.08] bg-white px-3.5 py-2.5 text-sm transition-colors hover:border-brand-blue-vif/40"
                >
                  <FileText size={16} className="shrink-0 text-brand-blue-vif" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium text-navy">{r.title}</span>
                  <Download
                    size={15}
                    className="shrink-0 text-text-muted transition-colors group-hover:text-brand-blue-royal"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ─── Encarts d'accès ──────────────────────────────────────────────────────── */

function LockedNotice() {
  return (
    <div className="rounded-2xl border border-navy/10 bg-surface-secondary px-6 py-10 text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-navy/[0.06] text-navy/60">
        <Lock size={26} aria-hidden />
      </span>
      <h2 className="font-display text-lg font-bold text-navy">Leçon verrouillée</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
        Cette formation suit une progression séquentielle. Terminez d&apos;abord les leçons
        précédentes pour débloquer celle-ci.
      </p>
    </div>
  );
}

function EnrollNotice({ slug, assessment = false }: { slug: string; assessment?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] px-6 py-10 text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
        <UserPlus size={26} aria-hidden />
      </span>
      <h2 className="font-display text-lg font-bold text-navy">
        {assessment ? "Inscrivez-vous pour passer l'évaluation" : "Inscrivez-vous pour continuer"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
        {assessment
          ? "Les évaluations sont réservées aux apprenants inscrits. Rejoignez la formation pour valider vos acquis et obtenir votre certificat."
          : "L'accès complet à cette formation est réservé aux apprenants inscrits. L'inscription vous donne accès à vie au contenu et au certificat."}
      </p>
      <Link
        href={`/formations/${slug}`}
        className={buttonClasses({ size: "lg", className: "mt-5 inline-flex" })}
      >
        <FolderKanban size={18} aria-hidden />
        Voir la fiche et m&apos;inscrire
      </Link>
    </div>
  );
}
