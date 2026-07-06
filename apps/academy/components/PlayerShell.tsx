"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Download,
  FileText,
  Flame,
  HelpCircle,
  Lock,
  Menu,
  PenTool,
  PlayCircle,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Monogram, buttonClasses, cn, formatDuration } from "@da/ui";
import { markChapterComplete } from "@/lib/actions";
import type { PlayerChapter, PlayerData } from "@/lib/types";
import { Markdown } from "./Markdown";
import { VideoEmbed } from "./VideoEmbed";
import { QuizRunner } from "./QuizRunner";

const typeIcon: Record<PlayerChapter["type"], React.ElementType> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  EXERCISE: PenTool,
  ASSIGNMENT: Upload,
};

const typeLabel: Record<PlayerChapter["type"], string> = {
  VIDEO: "Vidéo",
  TEXT: "Lecture",
  QUIZ: "Quiz",
  EXERCISE: "Exercice",
  ASSIGNMENT: "Projet",
};

export interface PlayerShellProps {
  data: PlayerData;
  chapterId: string;
  userStreak: number;
  /** Discussion du chapitre (rendue par la page, cf. ChapterComments). */
  commentsSlot?: React.ReactNode;
}

export function PlayerShell({
  data,
  chapterId,
  userStreak,
  commentsSlot,
}: PlayerShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [pendingComplete, setPendingComplete] = React.useState(false);
  const [xpFlash, setXpFlash] = React.useState<number | null>(null);
  // Optimiste : complétions locales en plus de celles du serveur.
  const [localDone, setLocalDone] = React.useState<Set<string>>(new Set());

  const completedIds = React.useMemo(() => {
    const ids = new Set(data.enrollment?.completedChapterIds ?? []);
    for (const id of localDone) ids.add(id);
    return ids;
  }, [data.enrollment, localDone]);

  const flat = data.flatChapters;
  const currentIndex = flat.findIndex((c) => c.id === chapterId);
  const chapter = flat[currentIndex];
  const prev = currentIndex > 0 ? flat[currentIndex - 1] : null;
  const next = currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;
  const progressPct =
    flat.length === 0 ? 0 : Math.round((completedIds.size / flat.length) * 100);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [chapterId]);

  if (!chapter) return null;
  const isDone = completedIds.has(chapter.id);

  async function handleComplete() {
    if (isDone || pendingComplete || !chapter) return;
    setPendingComplete(true);
    const res = await markChapterComplete(chapter.id);
    setPendingComplete(false);
    if (res.ok) {
      setLocalDone((s) => new Set(s).add(chapter.id));
      if (res.xpGained > 0) {
        setXpFlash(res.xpGained);
        setTimeout(() => setXpFlash(null), 2400);
      }
      router.refresh();
    }
  }

  /* ─────────────────────────────── Sidebar ──────────────────────────────── */
  const sidebar = (
    <div className="flex h-full flex-col bg-surface-dark text-white">
      <div className="border-b border-white/10 p-5">
        <Link
          href={`/courses/${data.course.slug}`}
          className="flex items-center gap-2 text-xs font-medium text-white/60 transition-colors hover:text-brand-cyan"
        >
          <ArrowLeft size={14} />
          Retour au cours
        </Link>
        <h2 className="mt-3 font-display text-base font-bold leading-snug">
          {data.course.title}
        </h2>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Progression</span>
            <span className="font-bold text-brand-cyan">{progressPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-da"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {data.modules.map((mod, mi) => (
          <div key={mod.id} className="mb-4">
            <p className="px-2 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/40">
              Module {mi + 1} — {mod.title}
            </p>
            <ul className="mt-1 space-y-0.5">
              {mod.chapters.map((ch) => {
                const ChIcon = typeIcon[ch.type];
                const done = completedIds.has(ch.id);
                const active = ch.id === chapterId;
                return (
                  <li key={ch.id}>
                    <Link
                      href={`/courses/${data.course.slug}/learn/${ch.id}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-white/10 font-semibold text-white"
                          : "text-white/65 hover:bg-white/5 hover:text-white",
                        ch.locked && "opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                          done
                            ? "bg-success text-white"
                            : active
                              ? "bg-gradient-da text-white"
                              : "bg-white/10 text-white/50",
                        )}
                      >
                        {done ? (
                          <Check size={11} strokeWidth={3.5} />
                        ) : ch.locked ? (
                          <Lock size={10} />
                        ) : (
                          <ChIcon size={11} />
                        )}
                      </span>
                      <span className="flex-1 truncate">{ch.title}</span>
                      {ch.videoDuration > 0 && (
                        <span className="shrink-0 text-[0.68rem] text-white/40">
                          {formatDuration(Math.max(1, Math.round(ch.videoDuration / 60)))}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link href="/" className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
          <Monogram size={22} variant="white" />
          <span className="text-xs font-semibold tracking-wide text-white/70">
            ACCESS ACADEMY
          </span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-surface-secondary">
      {/* Barre supérieure */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-surface-dark px-4 text-white">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="hidden h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-white/10 lg:grid"
          aria-label={sidebarOpen ? "Replier le programme" : "Afficher le programme"}
        >
          <Menu size={19} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-white/10 lg:hidden"
          aria-label="Afficher le programme"
        >
          <Menu size={19} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{chapter.title}</p>
          <p className="truncate text-[0.68rem] text-white/50">
            {data.course.title} · {typeLabel[chapter.type]}
          </p>
        </div>

        {/* Streak + progression */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {xpFlash && (
              <motion.span
                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold"
              >
                <Sparkles size={12} /> +{xpFlash} XP
              </motion.span>
            )}
          </AnimatePresence>
          <span
            className="hidden items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold sm:inline-flex"
            title="Jours consécutifs d'apprentissage"
          >
            <Flame size={13} className="text-warning" /> {userStreak}
          </span>
          <div className="hidden w-36 items-center gap-2 md:flex">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full rounded-full bg-gradient-da"
                initial={false}
                animate={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-brand-cyan">{progressPct}%</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar desktop */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="hidden shrink-0 overflow-hidden lg:block"
            >
              <div className="h-full w-80">{sidebar}</div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar mobile (overlay) */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-80 lg:hidden"
              >
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white"
                  aria-label="Fermer le programme"
                >
                  <X size={18} />
                </button>
                {sidebar}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Contenu du chapitre */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* En-tête du chapitre */}
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue-vif/10 px-3 py-1 text-xs font-bold text-brand-blue-royal">
                    {React.createElement(typeIcon[chapter.type], { size: 13 })}
                    {typeLabel[chapter.type]}
                  </span>
                  {isDone && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                      <CircleCheck size={13} /> Terminé
                    </span>
                  )}
                </div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                  {chapter.title}
                </h1>

                {/* Corps selon le type */}
                <div className="mt-7 space-y-8">
                  {chapter.videoUrl && (
                    <VideoEmbed url={chapter.videoUrl} title={chapter.title} />
                  )}

                  {chapter.type === "QUIZ" && chapter.quiz ? (
                    <QuizRunner
                      quiz={chapter.quiz}
                      chapterId={chapter.id}
                      previousScore={data.enrollment?.quizScores[chapter.id] ?? null}
                      alreadyPassed={isDone}
                    />
                  ) : (
                    chapter.content && <Markdown>{chapter.content}</Markdown>
                  )}

                  {/* Ressources téléchargeables */}
                  {chapter.resources.length > 0 && (
                    <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
                        Ressources du chapitre
                      </h2>
                      <ul className="mt-3 space-y-2">
                        {chapter.resources.map((r) => (
                          <li key={r.url}>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue-royal transition-colors hover:text-brand-violet"
                            >
                              <Download size={15} />
                              {r.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Marquer comme terminé (hors quiz : le quiz valide en réussissant) */}
                  {chapter.type !== "QUIZ" && !chapter.locked && (
                    <div className="flex justify-center">
                      <motion.button
                        type="button"
                        onClick={handleComplete}
                        disabled={isDone || pendingComplete}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          buttonClasses({
                            variant: isDone ? "outline" : "primary",
                            size: "lg",
                          }),
                          isDone && "pointer-events-none border-success/40 text-success",
                        )}
                      >
                        {isDone ? (
                          <>
                            <CircleCheck size={19} />
                            Chapitre terminé
                          </>
                        ) : pendingComplete ? (
                          "Enregistrement…"
                        ) : (
                          <>
                            <Check size={19} strokeWidth={3} />
                            Marquer comme terminé
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Discussion du chapitre */}
                {commentsSlot && (
                  <div className="mt-10 border-t border-navy/[0.08] pt-8">
                    {commentsSlot}
                  </div>
                )}

                {/* Navigation précédent / suivant */}
                <div className="mt-10 flex items-center justify-between gap-3 border-t border-navy/[0.08] pt-6">
                  {prev ? (
                    <Link
                      href={`/courses/${data.course.slug}/learn/${prev.id}`}
                      className={cn(buttonClasses({ variant: "outline", size: "md" }), "max-w-[45%]")}
                    >
                      <ChevronLeft size={17} />
                      <span className="truncate">{prev.title}</span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <Link
                      href={`/courses/${data.course.slug}/learn/${next.id}`}
                      className={cn(buttonClasses({ variant: "primary", size: "md" }), "max-w-[55%]")}
                    >
                      <span className="truncate">{next.title}</span>
                      <ChevronRight size={17} />
                    </Link>
                  ) : (
                    <Link
                      href={`/courses/${data.course.slug}`}
                      className={buttonClasses({ variant: "primary", size: "md" })}
                    >
                      Terminer le cours
                      <ChevronRight size={17} />
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
