"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  PlayCircle,
  FileText,
  HelpCircle,
  Dumbbell,
  FolderGit2,
  type LucideIcon,
} from "lucide-react";
import { Badge, cn, type BadgeVariant } from "@da/ui";
import type { ChapterType, CourseStatus, CourseLevel } from "@/lib/studio-types";

/* ─────────────────────────── Statuts de cours ──────────────────────────────── */

export const STATUS_META: Record<
  CourseStatus,
  { label: string; variant: BadgeVariant }
> = {
  DRAFT: { label: "Brouillon", variant: "default" },
  REVIEW: { label: "En validation", variant: "warning" },
  PUBLISHED: { label: "Publié", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "outline" },
};

/* ─────────────────────────── Niveaux de cours ──────────────────────────────── */

export const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
];

/* ─────────────────────────── Types de chapitre ─────────────────────────────── */

export const CHAPTER_TYPES: {
  value: ChapterType;
  label: string;
  icon: LucideIcon;
  hint: string;
}[] = [
  { value: "VIDEO", label: "Vidéo", icon: PlayCircle, hint: "YouTube ou Vimeo" },
  { value: "TEXT", label: "Texte", icon: FileText, hint: "Leçon rédigée en Markdown" },
  { value: "QUIZ", label: "Quiz", icon: HelpCircle, hint: "Questions à choix" },
  { value: "EXERCISE", label: "Exercice", icon: Dumbbell, hint: "Mise en pratique guidée" },
  { value: "ASSIGNMENT", label: "Projet", icon: FolderGit2, hint: "Travail à rendre" },
];

export const CHAPTER_META: Record<
  ChapterType,
  { label: string; icon: LucideIcon; color: string }
> = {
  VIDEO: { label: "Vidéo", icon: PlayCircle, color: "text-brand-blue-vif" },
  TEXT: { label: "Texte", icon: FileText, color: "text-brand-violet" },
  QUIZ: { label: "Quiz", icon: HelpCircle, color: "text-accent" },
  EXERCISE: { label: "Exercice", icon: Dumbbell, color: "text-success" },
  ASSIGNMENT: { label: "Projet", icon: FolderGit2, color: "text-warning" },
};

/* ─────────────────────────── Petit sur-titre à filet ───────────────────────── */

export function MiniHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
      <span aria-hidden className="h-px w-7 bg-gradient-da" />
      {children}
    </h2>
  );
}

/* ─────────────────────────── Bandeau de statut ─────────────────────────────── */

export function StatusBadge({ status }: { status: CourseStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/* ─────────────────────────── Message inline animé ──────────────────────────── */

export function InlineMessage({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        "text-sm font-medium",
        tone === "success" ? "text-success" : "text-error",
      )}
    >
      {children}
    </motion.p>
  );
}

/* ─────────────────────────── Interrupteur (toggle) ─────────────────────────── */

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40 disabled:opacity-50",
        checked ? "bg-gradient-da" : "bg-navy/15",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm",
          checked ? "ml-[22px]" : "ml-0.5",
        )}
      />
    </button>
  );
}

/* ─────────────────────────── Onglet segmenté ───────────────────────────────── */

export function SegTab({
  active,
  onClick,
  children,
  layoutId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  layoutId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
        active ? "text-navy" : "text-text-secondary hover:text-navy",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="absolute inset-0 rounded-lg bg-surface-primary shadow-sm ring-1 ring-navy/[0.06]"
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
