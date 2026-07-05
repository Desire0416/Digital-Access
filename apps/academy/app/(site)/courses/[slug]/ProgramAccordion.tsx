"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  HelpCircle,
  Lock,
  PlayCircle,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Badge, cn, formatDuration } from "@da/ui";
import type { ChapterMeta, ChapterType, ModuleWithChapters } from "@/lib/types";

const typeIcons: Record<ChapterType, LucideIcon> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  EXERCISE: Target,
  ASSIGNMENT: ClipboardList,
};

const typeLabels: Record<ChapterType, string> = {
  VIDEO: "Vidéo",
  TEXT: "Lecture",
  QUIZ: "Quiz",
  EXERCISE: "Exercice",
  ASSIGNMENT: "Devoir",
};

/** Durée d'un chapitre : minutes vidéo, sinon le type de contenu. */
function chapterMeta(chapter: ChapterMeta): string {
  if (chapter.videoDuration > 0) {
    return `${Math.max(1, Math.round(chapter.videoDuration / 60))} min`;
  }
  return typeLabels[chapter.type];
}

export interface ProgramAccordionProps {
  slug: string;
  modules: ModuleWithChapters[];
  /** Inscrit → tous les chapitres deviennent cliquables. */
  enrolled: boolean;
  /** Chapitres complétés (coche verte). */
  completedChapterIds?: string[];
}

/**
 * Programme du cours — accordéon par module, animé (AnimatePresence height),
 * chevron rotatif, liens vers le player pour les aperçus gratuits (et tout le
 * cours si l'apprenant est inscrit).
 */
export function ProgramAccordion({
  slug,
  modules,
  enrolled,
  completedChapterIds = [],
}: ProgramAccordionProps) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(modules[0] ? [modules[0].id] : []),
  );
  const completed = new Set(completedChapterIds);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      {modules.map((mod, index) => {
        const isOpen = open.has(mod.id);
        const minutes = Math.round(
          mod.chapters.reduce((s, c) => s + c.videoDuration, 0) / 60,
        );

        return (
          <div
            key={mod.id}
            className={cn(
              "overflow-hidden rounded-xl border bg-surface-primary transition-colors",
              isOpen ? "border-brand-blue-vif/30" : "border-navy/[0.08]",
            )}
          >
            {/* ── En-tête du module ─────────────────────────────────────── */}
            <button
              type="button"
              onClick={() => toggle(mod.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-secondary sm:px-5"
            >
              <span
                aria-hidden
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-extrabold transition-colors",
                  isOpen
                    ? "bg-gradient-da text-white shadow-brand"
                    : "bg-navy/[0.05] text-navy",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[0.95rem] font-bold text-navy sm:text-base">
                  {mod.title}
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">
                  {mod.chapters.length} chapitre
                  {mod.chapters.length > 1 ? "s" : ""}
                  {minutes > 0 && <> · {formatDuration(minutes)}</>}
                </span>
              </span>
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="shrink-0 text-text-muted"
              >
                <ChevronDown size={18} />
              </motion.span>
            </button>

            {/* ── Chapitres ─────────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ul className="border-t border-navy/[0.06]">
                    {mod.chapters.map((chapter) => {
                      const IconCmp = typeIcons[chapter.type];
                      const done = completed.has(chapter.id);
                      const clickable = enrolled || chapter.isPreview;

                      const row = (
                        <>
                          <span
                            aria-hidden
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                              done
                                ? "bg-success/10 text-success"
                                : chapter.isPreview
                                  ? "bg-brand-blue-vif/10 text-brand-blue-royal"
                                  : "bg-navy/[0.05] text-text-secondary",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <IconCmp size={16} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-sm",
                                clickable
                                  ? "font-medium text-navy group-hover/chap:text-brand-blue-royal"
                                  : "text-text-secondary",
                              )}
                            >
                              {chapter.title}
                            </span>
                          </span>
                          {chapter.isPreview && !enrolled && (
                            <Badge variant="soft" className="hidden shrink-0 sm:inline-flex">
                              <PlayCircle size={12} aria-hidden />
                              Aperçu gratuit
                            </Badge>
                          )}
                          {!clickable && (
                            <Lock
                              size={14}
                              aria-label="Chapitre réservé aux inscrits"
                              className="shrink-0 text-text-muted"
                            />
                          )}
                          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-text-muted">
                            {chapterMeta(chapter)}
                          </span>
                        </>
                      );

                      return (
                        <li key={chapter.id} className="border-b border-navy/[0.04] last:border-b-0">
                          {clickable ? (
                            <Link
                              href={`/courses/${slug}/learn/${chapter.id}`}
                              className="group/chap flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-blue-vif/[0.05] sm:px-5"
                            >
                              {row}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                              {row}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
