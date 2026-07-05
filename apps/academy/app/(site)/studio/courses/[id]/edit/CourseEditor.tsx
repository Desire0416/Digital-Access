"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, PlayCircle, Info, ListTree, Rocket } from "lucide-react";
import { buttonClasses, cn } from "@da/ui";
import type { StudioCourseEdit, StudioModule } from "@/lib/studio-types";
import type { CategoryItem } from "@/lib/types";
import { StatusBadge, SegTab } from "./shared";
import { InfoForm } from "./InfoForm";
import { ProgramBuilder } from "./ProgramBuilder";
import { PublishPanel } from "./PublishPanel";

type TabId = "info" | "program" | "publish";

const TABS: { id: TabId; label: string; icon: typeof Info }[] = [
  { id: "info", label: "Informations", icon: Info },
  { id: "program", label: "Programme", icon: ListTree },
  { id: "publish", label: "Publication", icon: Rocket },
];

const PREFERS_REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function CourseEditor({
  course: initial,
  categories,
}: {
  course: StudioCourseEdit;
  categories: CategoryItem[];
}) {
  const [course, setCourse] = React.useState<StudioCourseEdit>(initial);
  const [tab, setTab] = React.useState<TabId>("info");

  // Re-synchronise si le server component re-fournit des données (après refresh).
  React.useEffect(() => {
    setCourse(initial);
  }, [initial]);

  const firstChapterId = React.useMemo(() => {
    for (const m of course.modules) {
      if (m.chapters.length > 0) return m.chapters[0].id;
    }
    return null;
  }, [course.modules]);

  function patchCourse(patch: Partial<StudioCourseEdit>) {
    setCourse((prev) => ({ ...prev, ...patch }));
  }

  function setModules(modules: StudioModule[]) {
    setCourse((prev) => ({
      ...prev,
      modules,
      chapterCount: modules.reduce((n, m) => n + m.chapters.length, 0),
    }));
  }

  const motionProps = PREFERS_REDUCED
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.22, ease: "easeInOut" as const },
      };

  return (
    <div className="relative isolate min-h-screen pb-24">
      {/* Décor de fond DA */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand-violet/10 blur-[120px]" />
        <div className="absolute left-[-8%] top-40 h-72 w-72 rounded-full bg-brand-cyan/10 blur-[120px]" />
      </div>

      {/* ── Barre supérieure sticky ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-navy/[0.07] bg-surface-primary/85 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy"
            >
              <ArrowLeft size={16} aria-hidden /> Studio
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate font-display text-base font-bold text-navy sm:text-lg">
                  {course.title || "Cours sans titre"}
                </h1>
                <StatusBadge status={course.status} />
              </div>
            </div>

            {firstChapterId ? (
              <Link
                href={`/courses/${course.slug}/learn/${firstChapterId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "outline", size: "sm" })}
              >
                <PlayCircle size={15} aria-hidden /> Prévisualiser
              </Link>
            ) : (
              <span
                className={cn(
                  buttonClasses({ variant: "outline", size: "sm" }),
                  "pointer-events-none opacity-40",
                )}
                aria-disabled="true"
                title="Ajoutez un chapitre pour prévisualiser"
              >
                <Eye size={15} aria-hidden /> Prévisualiser
              </span>
            )}
          </div>

          {/* Onglets */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {TABS.map((t) => {
              const TabIcon = t.icon;
              return (
                <SegTab
                  key={t.id}
                  active={tab === t.id}
                  onClick={() => setTab(t.id)}
                  layoutId="studio-edit-tab"
                >
                  <span className="flex items-center gap-1.5">
                    <TabIcon size={14} aria-hidden />
                    {t.label}
                  </span>
                </SegTab>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Contenu de l'onglet ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div key={tab} {...motionProps}>
            {tab === "info" && (
              <InfoForm course={course} categories={categories} onSaved={patchCourse} />
            )}
            {tab === "program" && (
              <ProgramBuilder course={course} onChange={setModules} />
            )}
            {tab === "publish" && <PublishPanel course={course} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
