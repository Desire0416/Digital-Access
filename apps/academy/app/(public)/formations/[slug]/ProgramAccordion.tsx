"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  Lock,
  PlayCircle,
  Video,
  FileText,
  FileType2,
  Headphones,
  Presentation,
  MousePointerClick,
  MonitorPlay,
  ExternalLink,
  Users,
  ClipboardList,
  FlaskConical,
  Wrench,
} from "lucide-react";
import { cn } from "@da/ui";
import { LESSON_TYPE_LABEL } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Programme de la formation (cahier §11.4) — accordéon modules → leçons.
   Icône par type, durée, cadenas si la leçon n'est pas un aperçu gratuit.
   ══════════════════════════════════════════════════════════════════════════ */

export interface AccordionLesson {
  id: string;
  title: string;
  lessonType: string;
  durationMinutes: number | null;
  isPreview: boolean;
}

export interface AccordionModule {
  id: string;
  title: string;
  description: string | null;
  objectives: string[];
  durationMinutes: number | null;
  lessons: AccordionLesson[];
}

const LESSON_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  VIDEO: Video,
  TEXT: FileText,
  PDF: FileType2,
  AUDIO: Headphones,
  PRESENTATION: Presentation,
  INTERACTIVE: MousePointerClick,
  DEMO: MonitorPlay,
  EXTERNAL_LINK: ExternalLink,
  VIRTUAL_CLASS: Users,
  CASE_STUDY: ClipboardList,
  WORKSHOP: Wrench,
  LAB: FlaskConical,
};

function fmtMinutes(min: number | null): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`;
}

export function ProgramAccordion({ modules }: { modules: AccordionModule[] }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(modules[0] ? [modules[0].id] : []));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      {modules.map((m, i) => {
        const isOpen = open.has(m.id);
        const totalLabel = fmtMinutes(m.durationMinutes);
        return (
          <div
            key={m.id}
            className={cn(
              "overflow-hidden rounded-xl border bg-surface-primary transition-colors",
              isOpen ? "border-brand-blue-vif/30 shadow-[0_10px_30px_-20px_rgba(43,58,140,0.5)]" : "border-navy/[0.09]",
            )}
          >
            <button
              type="button"
              onClick={() => toggle(m.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold transition-colors",
                  isOpen ? "bg-gradient-da text-white" : "bg-navy/[0.06] text-navy",
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[0.95rem] font-bold leading-snug text-navy">{m.title}</span>
                <span className="mt-0.5 block text-xs text-text-secondary">
                  {m.lessons.length} leçon{m.lessons.length > 1 ? "s" : ""}
                  {totalLabel && <> · {totalLabel}</>}
                </span>
              </span>
              <ChevronDown
                size={18}
                className={cn("shrink-0 text-text-muted transition-transform duration-300", isOpen && "rotate-180 text-brand-blue-royal")}
                aria-hidden
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={reduce ? undefined : { height: 0, opacity: 0 }}
                  animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-navy/[0.06] px-4 pb-4 pt-2 sm:px-5">
                    {m.description && (
                      <p className="mb-3 mt-1 text-sm leading-relaxed text-text-secondary">{m.description}</p>
                    )}
                    <ul className="divide-y divide-navy/[0.05]">
                      {m.lessons.map((l) => {
                        const Icon = LESSON_ICONS[l.lessonType] ?? FileText;
                        const dur = fmtMinutes(l.durationMinutes);
                        return (
                          <li key={l.id} className="flex items-center gap-3 py-2.5">
                            <Icon size={16} className="shrink-0 text-brand-blue-royal" aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-navy">{l.title}</span>
                              <span className="text-[11px] uppercase tracking-wide text-text-muted">
                                {LESSON_TYPE_LABEL[l.lessonType] ?? l.lessonType}
                              </span>
                            </span>
                            {dur && <span className="shrink-0 text-xs text-text-secondary">{dur}</span>}
                            {l.isPreview ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                                <PlayCircle size={12} aria-hidden />
                                Aperçu
                              </span>
                            ) : (
                              <Lock size={14} className="shrink-0 text-text-muted" aria-hidden />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
