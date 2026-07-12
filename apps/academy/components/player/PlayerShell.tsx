"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  PlayCircle,
  FileText,
  Headphones,
  Presentation,
  MousePointerClick,
  MonitorPlay,
  ExternalLink,
  Video,
  Briefcase,
  Wrench,
  FlaskConical,
  ClipboardList,
  FolderKanban,
  Check,
  Lock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  CheckCircle2,
  Loader2,
  Trophy,
  Award,
  Sparkles,
} from "lucide-react";
import { buttonClasses, cn } from "@da/ui";
import { markLessonComplete, type MarkLessonResult } from "@/lib/learn-actions";
import type { PlayerCourse } from "@/lib/learn-queries";

/* ══════════════════════════════════════════════════════════════════════════
   PlayerShell (§17.1) — coque immersive à trois zones :
     · colonne latérale sombre rétractable (sommaire + progression),
     · zone centrale claire (contenu de la leçon / évaluation, en children),
     · barre inférieure de navigation (Précédent / Terminer / Suivant).
   La progression et les coches se mettent à jour de façon OPTIMISTE ; le
   serveur reste l'autorité (markLessonComplete revérifie tout).
   ══════════════════════════════════════════════════════════════════════════ */

type Lesson = PlayerCourse["modules"][number]["lessons"][number];
type ModuleT = PlayerCourse["modules"][number];

export interface LessonNav {
  lessonId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  completed: boolean;
  canComplete: boolean;
}

export interface PlayerShellProps {
  course: PlayerCourse;
  currentId: string;
  lessonNav: LessonNav | null;
  banner: "preview" | null;
  children: React.ReactNode;
}

const LESSON_ICON: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  PDF: FileText,
  AUDIO: Headphones,
  PRESENTATION: Presentation,
  INTERACTIVE: MousePointerClick,
  DEMO: MonitorPlay,
  EXTERNAL_LINK: ExternalLink,
  VIRTUAL_CLASS: Video,
  CASE_STUDY: Briefcase,
  WORKSHOP: Wrench,
  LAB: FlaskConical,
};

/** Recalcule le verrouillage séquentiel côté client à partir des leçons terminées. */
function computeLocked(flat: Lesson[], completed: Set<string>, seq: boolean, enrolled: boolean): Map<string, boolean> {
  const map = new Map<string, boolean>();
  let blocked = false;
  for (const l of flat) {
    if (!enrolled) {
      map.set(l.id, !l.isPreview);
      continue;
    }
    if (seq) {
      map.set(l.id, blocked);
      if (l.isRequired && !completed.has(l.id)) blocked = true;
    } else {
      map.set(l.id, false);
    }
  }
  return map;
}

export function PlayerShell({ course, currentId, lessonNav, banner, children }: PlayerShellProps) {
  const reduce = useReducedMotion();
  const seq = course.unlockMode === "SEQUENTIAL";

  const flat = React.useMemo(() => course.modules.flatMap((m) => m.lessons), [course.modules]);

  const [completed, setCompleted] = React.useState<Set<string>>(
    () => new Set(flat.filter((l) => l.completed).map((l) => l.id)),
  );
  const [progress, setProgress] = React.useState<number>(course.enrollment?.progress ?? 0);
  const [marking, setMarking] = React.useState(false);
  const [markError, setMarkError] = React.useState<string | null>(null);
  const [celebrate, setCelebrate] = React.useState(false);

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [deskCollapsed, setDeskCollapsed] = React.useState(false);

  const lockMap = React.useMemo(
    () => computeLocked(flat, completed, seq, course.enrolled),
    [flat, completed, seq, course.enrolled],
  );

  // Module ouvert par défaut : celui qui contient l'élément courant.
  const initialOpen = React.useMemo(() => {
    const idx = course.modules.findIndex(
      (m) => m.lessons.some((l) => l.id === currentId) || m.assessments.some((a) => a.id === currentId),
    );
    return new Set<string>(idx >= 0 ? [course.modules[idx].id] : course.modules.map((m) => m.id).slice(0, 1));
  }, [course.modules, currentId]);
  const [openModules, setOpenModules] = React.useState<Set<string>>(initialOpen);

  // Verrou de défilement quand le tiroir mobile est ouvert.
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  function toggleModule(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleComplete() {
    if (!lessonNav || marking) return;
    const id = lessonNav.lessonId;
    setMarking(true);
    setMarkError(null);
    // Optimiste : coche immédiate.
    setCompleted((prev) => new Set(prev).add(id));
    try {
      const res: MarkLessonResult = await markLessonComplete(id);
      if (res.ok) {
        setProgress(res.progress);
        if (res.courseCompleted) setCelebrate(true);
      } else {
        // Revert.
        setCompleted((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setMarkError(res.error);
      }
    } catch {
      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setMarkError("Une erreur est survenue. Réessayez.");
    } finally {
      setMarking(false);
    }
  }

  const isCompleted = lessonNav ? completed.has(lessonNav.lessonId) : false;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-dark">
      {/* ══ Overlay mobile ══ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Fermer le sommaire"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ══ Colonne latérale sombre ══ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-xs flex-col bg-surface-dark-card text-white shadow-2xl transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:z-auto lg:w-80 lg:max-w-none lg:translate-x-0 lg:shadow-none lg:transition-none",
          deskCollapsed && "lg:hidden",
        )}
      >
        {/* En-tête sommaire */}
        <div className="shrink-0 border-b border-white/10 p-4">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/espace/formations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white"
            >
              <ChevronLeft size={14} aria-hidden />
              Mes formations
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDeskCollapsed(true)}
                className="hidden rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex"
                aria-label="Réduire le sommaire"
              >
                <PanelLeftClose size={18} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Fermer le sommaire"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>

          <h1 className="mt-3 font-display text-base font-bold leading-snug text-white">{course.title}</h1>

          {/* Progression globale */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-white/60">Progression</span>
              <span className="font-display font-bold text-brand-cyan">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-da"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        </div>

        {/* Sommaire défilant */}
        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <ol className="space-y-1.5">
            {course.modules.map((m, mi) => (
              <ModuleBlock
                key={m.id}
                module={m}
                index={mi}
                slug={course.slug}
                currentId={currentId}
                completed={completed}
                lockMap={lockMap}
                open={openModules.has(m.id)}
                onToggle={() => toggleModule(m.id)}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </ol>

          {/* Évaluation finale du cours */}
          {course.courseAssessments.length > 0 && (
            <div className="mt-4">
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/40">
                Évaluation finale
              </p>
              <ul className="space-y-1">
                {course.courseAssessments.map((a) => (
                  <AssessmentRow
                    key={a.id}
                    assessment={a}
                    slug={course.slug}
                    active={a.id === currentId}
                    enrolled={course.enrolled}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Projets à rendre */}
          {course.projects.length > 0 && (
            <div className="mt-4">
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/40">
                Projets
              </p>
              <Link
                href="/espace/projets"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <FolderKanban size={16} className="shrink-0 text-brand-cyan" aria-hidden />
                <span className="flex-1">
                  {course.projects.length} projet{course.projects.length > 1 ? "s" : ""} à rendre
                </span>
                <ChevronRight size={14} className="text-white/40" aria-hidden />
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* ══ Zone centrale ══ */}
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {/* Barre supérieure */}
        <header className="flex shrink-0 items-center gap-3 border-b border-navy/[0.08] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-navy/70 transition-colors hover:bg-navy/[0.06] lg:hidden"
            aria-label="Ouvrir le sommaire"
          >
            <Menu size={20} aria-hidden />
          </button>
          {deskCollapsed && (
            <button
              type="button"
              onClick={() => setDeskCollapsed(false)}
              className="hidden rounded-lg p-2 text-navy/70 transition-colors hover:bg-navy/[0.06] lg:inline-flex"
              aria-label="Afficher le sommaire"
            >
              <PanelLeftOpen size={20} aria-hidden />
            </button>
          )}

          <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-navy lg:hidden">
            {course.title}
          </p>

          {/* Progression compacte (desktop) */}
          <div className="ml-auto hidden items-center gap-2.5 lg:flex">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-navy/[0.08]">
              <span className="block h-full rounded-full bg-gradient-da" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-display text-sm font-bold text-brand-blue-royal">{progress}%</span>
          </div>

          <Link
            href="/espace"
            className="ml-auto rounded-lg p-2 text-navy/60 transition-colors hover:bg-navy/[0.06] hover:text-navy lg:ml-3"
            aria-label="Quitter le lecteur"
          >
            <X size={20} aria-hidden />
          </Link>
        </header>

        {/* Bandeau aperçu gratuit */}
        {banner === "preview" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-brand-violet/15 bg-gradient-to-r from-brand-violet/[0.08] to-brand-cyan/[0.08] px-4 py-2.5 text-sm sm:px-6">
            <span className="inline-flex items-center gap-1.5 font-semibold text-brand-violet">
              <Sparkles size={15} aria-hidden />
              Aperçu gratuit
            </span>
            <span className="text-text-secondary">Inscrivez-vous pour débloquer toute la formation.</span>
            <Link
              href={`/inscription?callbackUrl=${encodeURIComponent(`/formations/${course.slug}`)}`}
              className={buttonClasses({ size: "sm", className: "ml-auto" })}
            >
              M&apos;inscrire
            </Link>
          </div>
        )}

        {/* Contenu défilant */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>

        {/* Barre de navigation (leçons uniquement) */}
        {lessonNav && (
          <footer className="shrink-0 border-t border-navy/[0.08] bg-white px-4 py-3 sm:px-6">
            {markError && (
              <p className="mb-2 rounded-lg bg-error/10 px-3 py-1.5 text-center text-xs font-medium text-error">
                {markError}
              </p>
            )}
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <NavButton
                href={lessonNav.prevLessonId ? `/apprendre/${course.slug}/${lessonNav.prevLessonId}` : null}
                direction="prev"
                onNavigate={() => setMobileOpen(false)}
              />

              {(lessonNav.canComplete || isCompleted) &&
                (isCompleted ? (
                  <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-success/10 px-5 text-sm font-semibold text-success">
                    <CheckCircle2 size={18} aria-hidden />
                    Terminé
                  </span>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleComplete}
                    disabled={marking}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    className={buttonClasses({ className: "px-5" })}
                  >
                    {marking ? (
                      <>
                        <Loader2 size={17} className="animate-spin" aria-hidden />
                        <span className="hidden sm:inline">Enregistrement…</span>
                      </>
                    ) : (
                      <>
                        <Check size={17} aria-hidden />
                        <span className="hidden sm:inline">Marquer comme terminé</span>
                        <span className="sm:hidden">Terminer</span>
                      </>
                    )}
                  </motion.button>
                ))}

              <NavButton
                href={lessonNav.nextLessonId ? `/apprendre/${course.slug}/${lessonNav.nextLessonId}` : null}
                direction="next"
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </footer>
        )}
      </div>

      {/* ══ Célébration de fin de formation ══ */}
      <AnimatePresence>
        {celebrate && <Celebration onClose={() => setCelebrate(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Bloc module (accordéon) ──────────────────────────────────────────────── */

function ModuleBlock({
  module,
  index,
  slug,
  currentId,
  completed,
  lockMap,
  open,
  onToggle,
  onNavigate,
}: {
  module: ModuleT;
  index: number;
  slug: string;
  currentId: string;
  completed: Set<string>;
  lockMap: Map<string, boolean>;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const total = module.lessons.filter((l) => l.isRequired).length;
  const done = module.lessons.filter((l) => l.isRequired && completed.has(l.id)).length;
  const allDone = total > 0 && done === total;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
      >
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold",
            allDone ? "bg-success text-white" : "bg-white/10 text-white/70",
          )}
        >
          {allDone ? <Check size={13} aria-hidden /> : index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white/90">{module.title}</span>
          <span className="text-[11px] text-white/45">
            {module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""}
            {total > 0 && ` · ${done}/${total}`}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-white/40 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ul className="space-y-0.5 py-1 pl-3">
              {module.lessons.map((l) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  slug={slug}
                  active={l.id === currentId}
                  isDone={completed.has(l.id)}
                  locked={lockMap.get(l.id) ?? false}
                  onNavigate={onNavigate}
                />
              ))}
              {module.assessments.map((a) => (
                <AssessmentRow
                  key={a.id}
                  assessment={a}
                  slug={slug}
                  active={a.id === currentId}
                  enrolled
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ─── Ligne de leçon ───────────────────────────────────────────────────────── */

function LessonRow({
  lesson,
  slug,
  active,
  isDone,
  locked,
  onNavigate,
}: {
  lesson: Lesson;
  slug: string;
  active: boolean;
  isDone: boolean;
  locked: boolean;
  onNavigate: () => void;
}) {
  const Icon = LESSON_ICON[lesson.lessonType] ?? FileText;

  const inner = (
    <>
      <span className="grid h-5 w-5 shrink-0 place-items-center">
        {isDone ? (
          <Check size={15} className="text-success" aria-hidden />
        ) : locked ? (
          <Lock size={13} className="text-white/30" aria-hidden />
        ) : (
          <Icon size={15} className={active ? "text-brand-cyan" : "text-white/45"} aria-hidden />
        )}
      </span>
      <span className={cn("min-w-0 flex-1 truncate text-sm", active ? "font-semibold text-white" : "text-white/70")}>
        {lesson.title}
      </span>
      {lesson.isPreview && !isDone && (
        <span className="shrink-0 rounded bg-brand-cyan/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-cyan">
          Aperçu
        </span>
      )}
      {lesson.durationMinutes != null && lesson.durationMinutes > 0 && !lesson.isPreview && (
        <span className="shrink-0 text-[11px] text-white/35">{lesson.durationMinutes} min</span>
      )}
    </>
  );

  const base = "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors";

  if (locked) {
    return (
      <li>
        <div className={cn(base, "cursor-not-allowed opacity-70")} aria-disabled title="Leçon verrouillée">
          {inner}
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={`/apprendre/${slug}/${lesson.id}`}
        onClick={onNavigate}
        aria-current={active ? "true" : undefined}
        className={cn(
          base,
          active ? "bg-gradient-to-r from-brand-violet/25 to-brand-blue-vif/10" : "hover:bg-white/[0.06]",
        )}
      >
        {inner}
      </Link>
    </li>
  );
}

/* ─── Ligne d'évaluation ───────────────────────────────────────────────────── */

type AssessmentT = PlayerCourse["courseAssessments"][number];

function AssessmentRow({
  assessment,
  slug,
  active,
  enrolled,
  onNavigate,
}: {
  assessment: AssessmentT;
  slug: string;
  active: boolean;
  enrolled: boolean;
  onNavigate: () => void;
}) {
  const Icon = assessment.type === "ASSIGNMENT" ? FolderKanban : ClipboardList;
  return (
    <li>
      <Link
        href={`/apprendre/${slug}/${assessment.id}`}
        onClick={onNavigate}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
          active ? "bg-gradient-to-r from-brand-violet/25 to-brand-blue-vif/10" : "hover:bg-white/[0.06]",
        )}
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center">
          {assessment.passed ? (
            <Trophy size={14} className="text-success" aria-hidden />
          ) : !enrolled ? (
            <Lock size={13} className="text-white/30" aria-hidden />
          ) : (
            <Icon size={15} className={active ? "text-brand-cyan" : "text-brand-violet/80"} aria-hidden />
          )}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            active ? "font-semibold text-white" : "text-white/70",
          )}
        >
          {assessment.title}
        </span>
        {assessment.passed && (
          <span className="shrink-0 rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
            Réussi
          </span>
        )}
      </Link>
    </li>
  );
}

/* ─── Boutons Précédent / Suivant ──────────────────────────────────────────── */

function NavButton({
  href,
  direction,
  onNavigate,
}: {
  href: string | null;
  direction: "prev" | "next";
  onNavigate: () => void;
}) {
  const isPrev = direction === "prev";
  const label = isPrev ? "Précédent" : "Suivant";
  const content = (
    <>
      {isPrev && <ChevronLeft size={17} aria-hidden />}
      <span className="hidden sm:inline">{label}</span>
      {!isPrev && <ChevronRight size={17} aria-hidden />}
    </>
  );
  const cls = cn(
    "inline-flex h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors",
  );

  if (!href) {
    return (
      <span className={cn(cls, "cursor-not-allowed text-navy/25")} aria-disabled>
        {content}
      </span>
    );
  }
  return (
    <Link href={href} onClick={onNavigate} className={cn(cls, "text-navy/70 hover:bg-navy/[0.06] hover:text-navy")}>
      {content}
    </Link>
  );
}

/* ─── Célébration de fin de formation (§17) ────────────────────────────────── */

function Celebration({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const pieces = React.useMemo(
    () =>
      Array.from({ length: reduce ? 0 : 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 1.6,
        color: ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#00BCD4", "#F59E0B"][i % 5],
        size: 6 + Math.random() * 8,
      })),
    [reduce],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* Confettis DA */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            className="absolute top-[-5%] rounded-sm"
            style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.6, backgroundColor: p.color }}
            initial={{ y: "-10vh", rotate: 0, opacity: 1 }}
            animate={{ y: "110vh", rotate: 540, opacity: [1, 1, 0.8] }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeIn", repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div
        initial={reduce ? false : { scale: 0.9, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl"
      >
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-da" aria-hidden />
        <motion.span
          initial={reduce ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-da text-white shadow-brand"
        >
          <Award size={40} aria-hidden />
        </motion.span>
        <h2 className="font-display text-2xl font-bold text-navy">Félicitations ! 🎉</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Vous avez terminé cette formation à 100 %. Votre certificat vous attend dans votre espace.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/espace/certificats" className={buttonClasses({ size: "lg", className: "w-full" })}>
            <Award size={18} aria-hidden />
            Voir mon certificat
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={buttonClasses({ variant: "ghost", size: "md", className: "w-full" })}
          >
            Continuer à réviser
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
