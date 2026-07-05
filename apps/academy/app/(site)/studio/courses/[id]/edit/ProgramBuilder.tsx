"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import {
  GripVertical,
  Plus,
  Trash2,
  Check,
  X,
  Pencil,
  ChevronDown,
  Eye,
  BookOpen,
} from "lucide-react";
import { Button, Badge, cn } from "@da/ui";
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createChapter,
  deleteChapter,
  reorderChapters,
} from "@/lib/studio-actions";
import type {
  StudioCourseEdit,
  StudioModule,
  StudioChapter,
  ChapterType,
} from "@/lib/studio-types";
import { CHAPTER_TYPES, CHAPTER_META, MiniHeading, InlineMessage } from "./shared";
import { ChapterEditor } from "./ChapterEditor";

interface Props {
  course: StudioCourseEdit;
  onChange: (modules: StudioModule[]) => void;
}

export function ProgramBuilder({ course, onChange }: Props) {
  const router = useRouter();
  const modules = course.modules;
  const [openChapter, setOpenChapter] = React.useState<{
    moduleId: string;
    chapterId: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, startTransition] = React.useTransition();

  const activeChapter: StudioChapter | null = React.useMemo(() => {
    if (!openChapter) return null;
    const mod = modules.find((m) => m.id === openChapter.moduleId);
    return mod?.chapters.find((c) => c.id === openChapter.chapterId) ?? null;
  }, [openChapter, modules]);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Une erreur est survenue.");
      else router.refresh();
    });
  }

  /* ── Modules ────────────────────────────────────────────────────────── */

  function handleReorderModules(next: StudioModule[]) {
    onChange(next);
    run(() => reorderModules(course.id, next.map((m) => m.id)));
  }

  function handleAddModule() {
    setError(null);
    startTransition(async () => {
      const res = await createModule(course.id, `Module ${modules.length + 1}`);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function patchModule(moduleId: string, patch: Partial<StudioModule>) {
    onChange(modules.map((m) => (m.id === moduleId ? { ...m, ...patch } : m)));
  }

  /* ── Chapitres ──────────────────────────────────────────────────────── */

  function handleReorderChapters(moduleId: string, next: StudioChapter[]) {
    patchModule(moduleId, { chapters: next });
    run(() => reorderChapters(moduleId, next.map((c) => c.id)));
  }

  function handleAddChapter(moduleId: string, type: ChapterType) {
    setError(null);
    startTransition(async () => {
      const res = await createChapter(moduleId, type);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      // Ouvre l'éditeur sur le nouveau chapitre.
      if (res.ok && "chapterId" in res) {
        setOpenChapter({ moduleId, chapterId: res.chapterId });
      }
    });
  }

  function patchChapter(chapterId: string, patch: Partial<StudioChapter>) {
    onChange(
      modules.map((m) => ({
        ...m,
        chapters: m.chapters.map((c) => (c.id === chapterId ? { ...c, ...patch } : c)),
      })),
    );
  }

  const totalChapters = modules.reduce((n, m) => n + m.chapters.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MiniHeading>Programme du cours</MiniHeading>
        <Badge variant="soft">
          {modules.length} module{modules.length > 1 ? "s" : ""} · {totalChapters} chapitre
          {totalChapters > 1 ? "s" : ""}
        </Badge>
      </div>

      <AnimatePresence>
        {error && (
          <div className="rounded-xl border border-error/30 bg-error/[0.05] px-4 py-2.5">
            <InlineMessage tone="error">{error}</InlineMessage>
          </div>
        )}
      </AnimatePresence>

      {modules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 bg-surface-primary p-10 text-center">
          <BookOpen size={30} className="mx-auto text-text-muted" aria-hidden />
          <p className="mt-3 font-semibold text-navy">Aucun module pour l'instant</p>
          <p className="mt-1 text-sm text-text-secondary">
            Structurez votre cours en modules, puis ajoutez-y des chapitres.
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={modules}
          onReorder={handleReorderModules}
          className="space-y-4"
        >
          {modules.map((mod) => (
            <ModuleRow
              key={mod.id}
              module={mod}
              busy={busy}
              onRename={(title) => {
                patchModule(mod.id, { title });
                run(() => updateModule(mod.id, title));
              }}
              onDelete={() => run(() => deleteModule(mod.id))}
              onReorderChapters={(next) => handleReorderChapters(mod.id, next)}
              onAddChapter={(type) => handleAddChapter(mod.id, type)}
              onOpenChapter={(chapterId) => setOpenChapter({ moduleId: mod.id, chapterId })}
              onDeleteChapter={(chapterId) => run(() => deleteChapter(chapterId))}
            />
          ))}
        </Reorder.Group>
      )}

      <button
        type="button"
        onClick={handleAddModule}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-blue-vif/40 bg-brand-blue-vif/[0.03] py-4 text-sm font-semibold text-brand-blue-royal transition-colors hover:border-brand-blue-vif hover:bg-brand-blue-vif/[0.07] disabled:opacity-50"
      >
        <Plus size={17} aria-hidden /> Ajouter un module
      </button>

      <AnimatePresence>
        {activeChapter && openChapter && (
          <ChapterEditor
            key={activeChapter.id}
            chapter={activeChapter}
            onClose={() => setOpenChapter(null)}
            onSaved={(patch) => patchChapter(activeChapter.id, patch)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────── Module ────────────────────────────────────── */

function ModuleRow({
  module: mod,
  busy,
  onRename,
  onDelete,
  onReorderChapters,
  onAddChapter,
  onOpenChapter,
  onDeleteChapter,
}: {
  module: StudioModule;
  busy: boolean;
  onRename: (title: string) => void;
  onDelete: () => void;
  onReorderChapters: (next: StudioChapter[]) => void;
  onAddChapter: (type: ChapterType) => void;
  onOpenChapter: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
}) {
  const controls = useDragControls();
  const [collapsed, setCollapsed] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(mod.title);
  const [confirming, setConfirming] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => setDraft(mod.title), [mod.title]);

  function commitRename() {
    const t = draft.trim();
    if (t && t !== mod.title) onRename(t);
    else setDraft(mod.title);
    setEditing(false);
  }

  return (
    <Reorder.Item
      value={mod}
      dragListener={false}
      dragControls={controls}
      className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary"
    >
      {/* En-tête du module */}
      <div className="flex items-center gap-2 border-b border-navy/[0.06] bg-surface-secondary/40 px-3 py-3">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label="Réordonner le module"
          className="cursor-grab touch-none text-text-muted transition-colors hover:text-navy active:cursor-grabbing"
        >
          <GripVertical size={18} aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Déplier" : "Replier"}
          className="grid h-7 w-7 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-navy/[0.06]"
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform", collapsed && "-rotate-90")}
            aria-hidden
          />
        </button>

        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraft(mod.title);
                  setEditing(false);
                }
              }}
              maxLength={120}
              className="h-9 flex-1 rounded-lg border border-brand-blue-vif/50 bg-surface-primary px-3 text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25"
            />
            <button
              type="button"
              onClick={commitRename}
              aria-label="Valider"
              className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da text-white"
            >
              <Check size={15} aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group flex flex-1 items-center gap-2 text-left"
          >
            <span className="font-display text-sm font-bold text-navy">{mod.title}</span>
            <Pencil
              size={13}
              className="text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          </button>
        )}

        <Badge variant="default" className="hidden sm:inline-flex">
          {mod.chapters.length} chap.
        </Badge>

        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onDelete();
                setConfirming(false);
              }}
              disabled={busy}
              className="rounded-lg bg-error px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              aria-label="Annuler"
              className="grid h-7 w-7 place-items-center rounded-lg text-text-muted hover:bg-navy/[0.06]"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Supprimer le module"
            className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        )}
      </div>

      {/* Chapitres */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-3">
              {mod.chapters.length === 0 ? (
                <p className="rounded-lg bg-surface-secondary/50 px-4 py-3 text-center text-xs text-text-muted">
                  Aucun chapitre — ajoutez-en un ci-dessous.
                </p>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={mod.chapters}
                  onReorder={onReorderChapters}
                  className="space-y-2"
                >
                  {mod.chapters.map((ch) => (
                    <ChapterRow
                      key={ch.id}
                      chapter={ch}
                      onOpen={() => onOpenChapter(ch.id)}
                      onDelete={() => onDeleteChapter(ch.id)}
                    />
                  ))}
                </Reorder.Group>
              )}

              {/* Menu d'ajout de chapitre */}
              <div className="relative pt-1">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/[0.06] hover:text-brand-violet"
                >
                  <Plus size={15} aria-hidden /> Ajouter un chapitre
                  <ChevronDown
                    size={13}
                    className={cn("transition-transform", menuOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute z-20 mt-1 w-56 overflow-hidden rounded-xl border border-navy/10 bg-surface-primary p-1 shadow-xl"
                    >
                      {CHAPTER_TYPES.map((t) => {
                        const TypeIcon = t.icon;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onAddChapter(t.value);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-secondary"
                          >
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da/10 text-brand-blue-royal">
                              <TypeIcon size={16} aria-hidden />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-navy">
                                {t.label}
                              </span>
                              <span className="block text-[11px] text-text-muted">{t.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

/* ─────────────────────────────── Chapitre ──────────────────────────────────── */

function ChapterRow({
  chapter,
  onOpen,
  onDelete,
}: {
  chapter: StudioChapter;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  const meta = CHAPTER_META[chapter.type];
  const MetaIcon = meta.icon;

  return (
    <Reorder.Item
      value={chapter}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 rounded-xl border border-navy/[0.07] bg-surface-primary px-2.5 py-2 transition-colors hover:border-brand-blue-vif/40"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        aria-label="Réordonner le chapitre"
        className="cursor-grab touch-none text-text-muted transition-colors hover:text-navy active:cursor-grabbing"
      >
        <GripVertical size={16} aria-hidden />
      </button>

      <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-2.5 text-left">
        <span className={cn("grid h-8 w-8 flex-none place-items-center rounded-lg bg-navy/[0.04]", meta.color)}>
          <MetaIcon size={16} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy">{chapter.title}</span>
          <span className="text-[11px] text-text-muted">{meta.label}</span>
        </span>
      </button>

      {chapter.isPreview && (
        <Badge variant="info" className="hidden sm:inline-flex">
          <Eye size={11} aria-hidden /> Aperçu
        </Badge>
      )}

      <button
        type="button"
        onClick={onOpen}
        aria-label="Éditer le chapitre"
        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-brand-blue-vif/10 hover:text-brand-blue-royal"
      >
        <Pencil size={14} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Supprimer le chapitre"
        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </Reorder.Item>
  );
}
