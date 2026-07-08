"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Check, Lock, ChevronLeft, ChevronRight, PlayCircle, FileText,
  HelpCircle, PenTool, Download, CheckCircle2, Circle, ArrowLeft, Loader2,
} from "lucide-react";
import { Button, cn } from "@da/ui";
import { Markdown } from "./Markdown";
import { VideoEmbed } from "./VideoEmbed";
import { QuizRunner } from "./QuizRunner";
import { markLessonComplete } from "@/lib/learn-actions";
import type { PlayerCourse, PlayerLesson } from "@/lib/learn-types";

function typeIcon(type: string, size = 15) {
  switch (type) {
    case "VIDEO": return <PlayCircle size={size} />;
    case "QUIZ": return <HelpCircle size={size} />;
    case "EXERCISE": return <PenTool size={size} />;
    case "RESOURCE": return <Download size={size} />;
    default: return <FileText size={size} />;
  }
}

export function PlayerShell({
  course,
  lesson,
  isAuthed,
}: {
  course: PlayerCourse;
  lesson: PlayerLesson;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [completed, setCompleted] = React.useState(lesson.completed);
  const [pending, startTransition] = React.useTransition();

  // Resynchronise l'état local quand on change de leçon (navigation).
  React.useEffect(() => setCompleted(lesson.completed), [lesson.id, lesson.completed]);

  function complete(then?: "next") {
    startTransition(async () => {
      const res = await markLessonComplete(lesson.id);
      if (res.ok) {
        setCompleted(true);
        if (then === "next" && lesson.nextLessonId) {
          router.push(`/apprendre/${course.slug}/${lesson.nextLessonId}`);
        } else {
          router.refresh();
        }
      }
    });
  }

  const showVideo = lesson.lessonType === "VIDEO" && lesson.videoUrl;

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      {/* ══ Sidebar programme ══ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-navy/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[85%] max-w-sm flex-col bg-navy text-white transition-transform duration-300 lg:static lg:w-80 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
          <Link href={`/career-paths/${course.slug}`} className="flex min-w-0 items-center gap-2 text-white/80 transition-colors hover:text-white">
            <ArrowLeft size={16} className="shrink-0" />
            <span className="truncate text-sm font-semibold">{course.title}</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 text-white/60 hover:bg-white/10 lg:hidden" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Progression */}
        <div className="border-b border-white/10 px-5 py-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-white/70">Progression</span>
            <span className="font-bold text-white">{course.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-da"
              initial={{ width: 0 }} animate={{ width: `${course.progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-white/50">
            {course.completedLessons} / {course.totalLessons} leçons terminées
          </p>
        </div>

        {/* Programme */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {course.modules.map((m, mi) => (
            <div key={m.id} className="mb-4">
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/40">
                Module {mi + 1} · {m.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {m.lessons.map((l) => {
                  const locked = !course.enrolled && !l.isPreview;
                  const active = l.id === lesson.id;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/apprendre/${course.slug}/${l.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          active ? "bg-white/[0.12] font-semibold text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                        )}
                      >
                        <span className={cn("shrink-0", l.completed ? "text-brand-cyan" : active ? "text-brand-blue-vif" : "text-white/40")}>
                          {l.completed ? <CheckCircle2 size={17} /> : locked ? <Lock size={15} /> : active ? <Circle size={17} /> : typeIcon(l.lessonType, 15)}
                        </span>
                        <span className="flex-1 leading-snug">{l.title}</span>
                        {l.hasQuiz && <HelpCircle size={13} className="shrink-0 text-accent" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* ══ Contenu principal ══ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-navy/10 bg-surface-primary/90 px-4 py-3 backdrop-blur sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-navy hover:bg-navy/[0.06] lg:hidden" aria-label="Programme">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-text-muted">{lesson.moduleTitle}</p>
            <p className="text-xs font-semibold text-brand-blue-royal">{lesson.positionLabel}</p>
          </div>
          <Link href={course.enrolled ? "/dashboard/mes-cours" : `/career-paths/${course.slug}`} className="rounded-lg p-1.5 text-text-muted hover:bg-navy/[0.06] hover:text-navy" aria-label="Quitter">
            <X size={20} />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {!lesson.canAccess ? (
            <LockedPanel course={course} isAuthed={isAuthed} />
          ) : (
            <>
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-violet/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-violet">
                  {typeIcon(lesson.lessonType, 12)} {lessonTypeLabel(lesson.lessonType)}
                </span>
                <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{lesson.title}</h1>
                {lesson.estimatedDuration ? (
                  <p className="mt-1 text-sm text-text-muted">≈ {lesson.estimatedDuration} min</p>
                ) : null}
              </div>

              {showVideo && <VideoEmbed url={lesson.videoUrl!} title={lesson.title} className="mb-8" />}

              {lesson.content && <Markdown>{lesson.content}</Markdown>}

              {lesson.quiz && (
                <div className="mt-8">
                  <QuizRunner quiz={lesson.quiz} onPassed={() => { setCompleted(true); router.refresh(); }} />
                </div>
              )}

              {/* Barre d'action */}
              <div className="mt-10 flex flex-col gap-3 border-t border-navy/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {course.enrolled ? (
                    completed ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3.5 py-2 text-sm font-semibold text-success">
                        <Check size={16} /> Leçon terminée
                      </span>
                    ) : (
                      <Button onClick={() => complete()} loading={pending} variant="outline">
                        {pending ? "…" : "Marquer comme terminé"}
                      </Button>
                    )
                  ) : (
                    <span className="text-sm text-text-muted">Aperçu gratuit — inscrivez-vous pour suivre votre progression.</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {lesson.prevLessonId && (
                    <Link href={`/apprendre/${course.slug}/${lesson.prevLessonId}`} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal">
                      <ChevronLeft size={16} /> Précédent
                    </Link>
                  )}
                  {lesson.nextLessonId && (
                    course.enrolled && !completed ? (
                      <Button onClick={() => complete("next")} loading={pending} className="gap-1">
                        Terminer & continuer <ChevronRight size={16} />
                      </Button>
                    ) : (
                      <Link href={`/apprendre/${course.slug}/${lesson.nextLessonId}`} className="inline-flex items-center gap-1 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]">
                        Suivant <ChevronRight size={16} />
                      </Link>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function lessonTypeLabel(type: string): string {
  const map: Record<string, string> = {
    VIDEO: "Vidéo", TEXT: "Lecture", EXERCISE: "Exercice", QUIZ: "Quiz", RESOURCE: "Ressource", LIVE: "Session live",
  };
  return map[type] ?? "Leçon";
}

function LockedPanel({ course, isAuthed }: { course: PlayerCourse; isAuthed: boolean }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-surface-primary px-6 py-14 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
        <Lock size={26} />
      </span>
      <h2 className="mt-5 font-display text-xl font-bold text-navy">Cette leçon est réservée aux inscrits</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
        Inscrivez-vous au parcours « {course.title} » pour débloquer toutes les leçons, les projets et le certificat.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/career-paths/${course.slug}`} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]">
          Voir le parcours & s'inscrire
        </Link>
        {!isAuthed && (
          <Link href={`/auth/login?callbackUrl=/career-paths/${course.slug}`} className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/50">
            Se connecter
          </Link>
        )}
      </div>
    </div>
  );
}
