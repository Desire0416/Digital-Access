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
  Headphones,
  Presentation,
  Video,
  Calendar,
  CalendarClock,
  MousePointerClick,
  Clock,
  UploadCloud,
} from "lucide-react";
import { buttonClasses } from "@da/ui";
import { currentUser } from "@/lib/guards";
import {
  getPlayerCourse,
  getPlayerLesson,
  getAssessmentForTaking,
  getAssignmentForLearner,
  type PlayerCourse,
} from "@/lib/learn-queries";
import { getLessonComments } from "@/lib/lesson-comments";
import { LESSON_TYPE_LABEL } from "@/lib/site";
import { Markdown } from "@/components/Markdown";
import { VideoEmbed } from "@/components/VideoEmbed";
import { PlayerShell } from "@/components/player/PlayerShell";
import { QuizRunner } from "@/components/player/QuizRunner";
import { AssignmentSubmission } from "@/components/player/AssignmentSubmission";
import { LessonComments } from "@/components/player/LessonComments";

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

    // Commentaires par leçon (§5.1/§7.3) — le composant se cloisonne lui-même
    // sur `canView` (l'accès est revérifié côté serveur).
    const lessonComments = await getLessonComments(lesson.id, userId);

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
          {course.startsAt ? (
            <NotStartedNotice startsAt={course.startsAt} slug={courseSlug} />
          ) : !lesson.hasAccess ? (
            lesson.locked ? (
              <LockedNotice />
            ) : (
              <EnrollNotice slug={courseSlug} />
            )
          ) : (
            <LessonBody lesson={lesson} />
          )}

          {/* ── Discussion de la leçon (§7.3) ── */}
          {lessonComments && (
            <div className="mt-12 border-t border-navy/[0.08] pt-8">
              <LessonComments lessonId={lesson.id} initial={lessonComments} />
            </div>
          )}
        </article>
      </PlayerShell>
    );
  }

  // ── 2) Sinon, tente une ÉVALUATION ──────────────────────────────────────
  const meta = findAssessmentMeta(course, lessonId);
  if (!meta) notFound();

  // Devoir (dépôt de fichiers corrigé manuellement) — parcours distinct du quiz.
  if (meta.type === "ASSIGNMENT") {
    const assignment = await getAssignmentForLearner(lessonId, userId);
    return (
      <PlayerShell course={course} currentId={lessonId} lessonNav={null} banner={null}>
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <header className="mb-6">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
              <UploadCloud size={14} aria-hidden />
              {meta.moduleTitle ? `Devoir · ${meta.moduleTitle}` : "Devoir"}
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">
              {meta.title}
            </h1>
          </header>

          {course.startsAt ? (
            <NotStartedNotice startsAt={course.startsAt} slug={courseSlug} />
          ) : assignment && (assignment.enrolled || assignment.preview) ? (
            <AssignmentSubmission assignment={assignment} />
          ) : (
            <EnrollNotice slug={courseSlug} assessment />
          )}
        </div>
      </PlayerShell>
    );
  }

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

        {course.startsAt ? (
          <NotStartedNotice startsAt={course.startsAt} slug={courseSlug} />
        ) : !assessment ? (
          <EnrollNotice slug={courseSlug} assessment />
        ) : (
          <QuizRunner assessment={assessment} />
        )}
      </div>
    </PlayerShell>
  );
}

/* ─── Corps d'une leçon selon son type (§12.2) ─────────────────────────────── */

type PlayerLessonT = NonNullable<Awaited<ReturnType<typeof getPlayerLesson>>>;

const isPdf = (url: string) => /\.pdf(\?.*)?$/i.test(url);
const isOfficeDoc = (url: string) => /\.(pptx?|docx?|xlsx?)(\?.*)?$/i.test(url);
const isHttp = (url: string) => /^https?:\/\//i.test(url);
const officeEmbed = (url: string) => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Africa/Abidjan",
});

function LessonBody({ lesson }: { lesson: PlayerLessonT }) {
  const hasMedia = !!(lesson.videoUrl || lesson.fileUrl || lesson.externalUrl || lesson.scheduledAt);
  return (
    <div className="space-y-8">
      {/* Média principal selon le type de leçon */}
      <LessonMedia lesson={lesson} />

      {/* Contenu markdown : cours complet (TEXT, cas, atelier, labo) OU
          notes / consignes / transcription secondaires (vidéo, audio, doc…). */}
      {lesson.content && <Markdown>{lesson.content}</Markdown>}

      {/* Aucun contenu disponible */}
      {!lesson.content && !hasMedia && (
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

/* ─── Média principal, spécifique au type de leçon (§12.2) ─────────────────── */

function LessonMedia({ lesson }: { lesson: PlayerLessonT }) {
  const { lessonType: t, videoUrl, fileUrl, externalUrl, scheduledAt } = lesson;

  // Vidéo & Démonstration → lecteur vidéo intégré.
  if ((t === "VIDEO" || t === "DEMO") && videoUrl) {
    return <VideoEmbed url={videoUrl} title={lesson.title} />;
  }

  // Audio → lecteur audio branché.
  if (t === "AUDIO" && fileUrl) {
    return (
      <div className="rounded-2xl border border-navy/[0.08] bg-surface-secondary/50 p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
            <Headphones size={20} aria-hidden />
          </span>
          <div>
            <p className="font-display font-bold text-navy">Écouter la leçon</p>
            <p className="text-xs text-text-secondary">Support audio</p>
          </div>
        </div>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls preload="metadata" src={fileUrl} className="w-full">
          Votre navigateur ne peut pas lire cet audio.
        </audio>
      </div>
    );
  }

  // Document (PDF, Word, Excel…) → aperçu intégré (PDF) + carte de téléchargement.
  if (t === "PDF" && fileUrl && isHttp(fileUrl)) {
    return (
      <div className="space-y-3">
        {isPdf(fileUrl) && (
          <iframe
            src={fileUrl}
            title={lesson.title}
            className="h-[75vh] min-h-[420px] w-full rounded-2xl border border-navy/10 bg-white"
          />
        )}
        <DownloadCard url={fileUrl} label="Ouvrir le document" icon={FileText} />
      </div>
    );
  }

  // Présentation → PDF intégré, PPTX via visionneuse Office, ou embed direct (Slides/Canva).
  if (t === "PRESENTATION" && fileUrl && isHttp(fileUrl)) {
    const src = isPdf(fileUrl) ? fileUrl : isOfficeDoc(fileUrl) ? officeEmbed(fileUrl) : fileUrl;
    return (
      <div className="space-y-3">
        <iframe
          src={src}
          title={lesson.title}
          allowFullScreen
          className="aspect-video w-full rounded-2xl border border-navy/10 bg-white shadow-brand"
        />
        <DownloadCard url={fileUrl} label="Ouvrir la présentation" icon={Presentation} />
      </div>
    );
  }

  // Ressource interactive → intégration en iframe (H5P, Genially, Figma…).
  if (t === "INTERACTIVE" && externalUrl && isHttp(externalUrl)) {
    return (
      <div className="space-y-3">
        <iframe
          src={externalUrl}
          title={lesson.title}
          allowFullScreen
          allow="fullscreen; accelerometer; gyroscope; clipboard-write; encrypted-media"
          className="min-h-[520px] w-full rounded-2xl border border-navy/10 bg-white shadow-brand"
        />
        <DownloadCard url={externalUrl} label="Ouvrir en plein écran" icon={MousePointerClick} external />
      </div>
    );
  }

  // Classe virtuelle → carte de session avec date et bouton « Rejoindre ».
  if (t === "VIRTUAL_CLASS") {
    const past = scheduledAt ? new Date(scheduledAt).getTime() < Date.now() : false;
    return (
      <div className="overflow-hidden rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
          <Video size={24} aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-navy">Classe virtuelle en direct</h2>
        {scheduledAt && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Calendar size={15} className="text-brand-violet" aria-hidden />
            {dateTimeFmt.format(new Date(scheduledAt))}
          </p>
        )}
        <div className="mt-5">
          {past ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-navy/[0.06] px-4 py-2.5 text-sm font-semibold text-text-secondary">
              <Clock size={16} aria-hidden />
              Session terminée
            </span>
          ) : externalUrl && isHttp(externalUrl) ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "lg", className: "inline-flex" })}
            >
              <Video size={18} aria-hidden />
              Rejoindre la classe
            </a>
          ) : (
            <span className="text-sm text-text-muted">Le lien de connexion sera communiqué prochainement.</span>
          )}
        </div>
      </div>
    );
  }

  // Lien externe → carte d'ouverture.
  if (t === "EXTERNAL_LINK" && externalUrl && isHttp(externalUrl)) {
    return <DownloadCard url={externalUrl} label="Ouvrir la ressource" icon={ExternalLink} external big />;
  }

  return null;
}

/** Carte d'accès à un fichier / lien (téléchargement ou ouverture). */
function DownloadCard({
  url,
  label,
  icon: Icon,
  external = false,
  big = false,
}: {
  url: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  external?: boolean;
  big?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-4 rounded-2xl border border-brand-blue-vif/25 bg-brand-blue-vif/[0.04] transition-colors hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.08] ${big ? "p-5" : "p-4"}`}
    >
      <span className={`grid shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand ${big ? "h-12 w-12" : "h-10 w-10"}`}>
        <Icon size={big ? 22 : 18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-bold text-navy">{label}</span>
        <span className="block truncate text-sm text-text-secondary">{url}</span>
      </span>
      {external ? (
        <ExternalLink size={18} className="shrink-0 text-text-muted transition-colors group-hover:text-brand-blue-royal" aria-hidden />
      ) : (
        <Download size={18} className="shrink-0 text-text-muted transition-colors group-hover:text-brand-blue-royal" aria-hidden />
      )}
    </a>
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

function NotStartedNotice({ startsAt, slug }: { startsAt: Date; slug: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] px-6 py-10 text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
        <CalendarClock size={26} aria-hidden />
      </span>
      <h2 className="font-display text-lg font-bold text-navy">La formation n&apos;a pas encore démarré</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
        Votre cohorte commence le{" "}
        <span className="font-semibold text-navy">{dateTimeFmt.format(new Date(startsAt))}</span>. L&apos;accès au
        contenu s&apos;ouvrira automatiquement à cette date. En attendant, choisissez votre projet fil rouge et
        repérez le calendrier des webinaires.
      </p>
      <Link
        href={`/formations/${slug}`}
        className={buttonClasses({ variant: "outline", size: "lg", className: "mt-5 inline-flex" })}
      >
        <FolderKanban size={18} aria-hidden />
        Revenir à la fiche
      </Link>
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
