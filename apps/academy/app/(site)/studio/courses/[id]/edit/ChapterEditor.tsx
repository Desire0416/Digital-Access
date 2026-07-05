"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, Plus, Eye, Link2, FileText, Play } from "lucide-react";
import { Button, Field, Input, Textarea, cn } from "@da/ui";
import { VideoEmbed } from "@/components/VideoEmbed";
import { Markdown } from "@/components/Markdown";
import { updateChapter } from "@/lib/studio-actions";
import type { StudioChapter, ChapterType } from "@/lib/studio-types";
import { CHAPTER_TYPES, InlineMessage, Toggle } from "./shared";
import { QuizEditor } from "./QuizEditor";

interface Props {
  chapter: StudioChapter;
  onClose: () => void;
  onSaved: (patch: Partial<StudioChapter>) => void;
}

const usesMarkdown = (t: ChapterType) => t === "TEXT" || t === "EXERCISE" || t === "ASSIGNMENT";

export function ChapterEditor({ chapter, onClose, onSaved }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState(chapter.title);
  const [type, setType] = React.useState<ChapterType>(chapter.type);
  const [isPreview, setIsPreview] = React.useState(chapter.isPreview);
  const [videoUrl, setVideoUrl] = React.useState(chapter.videoUrl ?? "");
  const [minutes, setMinutes] = React.useState<string>(
    chapter.videoDuration ? String(Math.round(chapter.videoDuration / 60)) : "",
  );
  const [content, setContent] = React.useState(chapter.content ?? "");
  const [resources, setResources] = React.useState<{ label: string; url: string }[]>(
    chapter.resources.length ? chapter.resources : [],
  );
  const [mdTab, setMdTab] = React.useState<"edit" | "preview">("edit");
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  // Escape ferme le panneau.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function updateResource(i: number, field: "label" | "url", value: string) {
    setResources((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    if (title.trim().length < 2) {
      setError("Le titre du chapitre doit contenir au moins 2 caractères.");
      return;
    }
    const videoDuration = type === "VIDEO" ? Math.max(0, Math.round(Number(minutes) || 0) * 60) : 0;
    const cleanResources = resources
      .map((r) => ({ label: r.label.trim(), url: r.url.trim() }))
      .filter((r) => r.label && r.url);

    startTransition(async () => {
      const res = await updateChapter({
        chapterId: chapter.id,
        title: title.trim(),
        type,
        content: usesMarkdown(type) ? content : null,
        videoUrl: type === "VIDEO" ? videoUrl.trim() || null : null,
        videoDuration,
        isPreview,
        resources: cleanResources,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSaved({
        title: title.trim(),
        type,
        content: usesMarkdown(type) ? content : null,
        videoUrl: type === "VIDEO" ? videoUrl.trim() || null : null,
        videoDuration,
        isPreview,
        resources: cleanResources,
      });
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2400);
    });
  }

  return (
    <>
      {/* Voile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm"
        aria-hidden
      />

      {/* Panneau */}
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`Édition du chapitre : ${chapter.title}`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-navy/10 bg-surface-secondary shadow-2xl"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 border-b border-navy/[0.08] bg-surface-primary px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
              <FileText size={17} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
                Chapitre
              </p>
              <p className="truncate text-sm font-bold text-navy">{title || "Sans titre"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 flex-none place-items-center rounded-lg text-text-secondary transition-colors hover:bg-navy/[0.06] hover:text-navy"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Corps défilant */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
          <Field label="Titre du chapitre" htmlFor="ch-title" required>
            <Input
              id="ch-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Installer l'environnement de développement"
              maxLength={160}
            />
          </Field>

          {/* Type */}
          <div>
            <span className="block text-sm font-medium text-navy">Type de contenu</span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CHAPTER_TYPES.map((t) => {
                const active = type === t.value;
                const TypeIcon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-brand-blue-vif bg-brand-blue-vif/[0.06] ring-1 ring-brand-blue-vif/30"
                        : "border-navy/12 hover:border-brand-blue-vif/40 hover:bg-surface-primary",
                    )}
                  >
                    <TypeIcon
                      size={18}
                      className={active ? "text-brand-blue-royal" : "text-text-muted"}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold text-navy">{t.label}</span>
                    <span className="text-[11px] leading-tight text-text-muted">{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aperçu gratuit */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-navy/[0.08] bg-surface-primary p-4">
            <div className="flex items-center gap-2.5">
              <Eye size={17} className="text-brand-blue-royal" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-navy">Aperçu gratuit</p>
                <p className="text-xs text-text-muted">
                  Accessible sans inscription ni paiement.
                </p>
              </div>
            </div>
            <Toggle checked={isPreview} onChange={setIsPreview} label="Aperçu gratuit" />
          </div>

          {/* Contenu selon le type */}
          {type === "VIDEO" && (
            <div className="space-y-4">
              <Field
                label="URL de la vidéo"
                htmlFor="video-url"
                hint="Lien YouTube ou Vimeo."
              >
                <Input
                  id="video-url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  maxLength={500}
                />
              </Field>
              <Field label="Durée (minutes)" htmlFor="video-min">
                <Input
                  id="video-min"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                  placeholder="12"
                  className="max-w-32"
                />
              </Field>
              {videoUrl.trim() ? (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <Play size={12} aria-hidden /> Aperçu
                  </p>
                  <VideoEmbed url={videoUrl} title={title || "Aperçu de la vidéo"} />
                </div>
              ) : null}
            </div>
          )}

          {usesMarkdown(type) && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-navy">Contenu (Markdown)</span>
                <div className="flex gap-1 rounded-lg bg-navy/[0.05] p-0.5">
                  {(["edit", "preview"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setMdTab(tab)}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                        mdTab === tab
                          ? "bg-surface-primary text-navy shadow-sm"
                          : "text-text-secondary hover:text-navy",
                      )}
                    >
                      {tab === "edit" ? "Éditer" : "Aperçu"}
                    </button>
                  ))}
                </div>
              </div>
              {mdTab === "edit" ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"## Titre de section\nRédigez votre leçon en Markdown…"}
                  className="min-h-64 font-mono text-sm"
                  maxLength={50000}
                />
              ) : (
                <div className="min-h-64 rounded-lg border border-navy/12 bg-surface-primary p-4">
                  {content.trim() ? (
                    <Markdown>{content}</Markdown>
                  ) : (
                    <p className="text-sm text-text-muted">Rien à prévisualiser pour l'instant.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {type === "QUIZ" && (
            <div className="rounded-2xl border border-accent/25 bg-accent/[0.03] p-4">
              <p className="mb-4 text-sm font-semibold text-navy">Questions du quiz</p>
              <QuizEditor
                chapterId={chapter.id}
                quiz={chapter.quiz}
                onSaved={() => onSaved({ type: "QUIZ" })}
              />
            </div>
          )}

          {/* Ressources */}
          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-navy">
              <Link2 size={15} aria-hidden /> Ressources téléchargeables
            </span>
            <p className="mt-0.5 text-xs text-text-muted">
              Fichiers, liens utiles ou supports complémentaires.
            </p>
            <div className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {resources.map((r, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2"
                  >
                    <Input
                      value={r.label}
                      onChange={(e) => updateResource(i, "label", e.target.value)}
                      placeholder="Intitulé"
                      className="h-10 text-sm"
                      maxLength={120}
                    />
                    <Input
                      value={r.url}
                      onChange={(e) => updateResource(i, "url", e.target.value)}
                      placeholder="https://…"
                      className="h-10 text-sm"
                      maxLength={500}
                    />
                    <button
                      type="button"
                      onClick={() => setResources((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Retirer la ressource"
                      className="grid h-9 w-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <X size={15} aria-hidden />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {resources.length < 12 && (
              <button
                type="button"
                onClick={() => setResources((prev) => [...prev, { label: "", url: "" }])}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
              >
                <Plus size={14} aria-hidden /> Ajouter une ressource
              </button>
            )}
          </div>
        </div>

        {/* Pied : enregistrer */}
        <div className="flex items-center justify-between gap-3 border-t border-navy/[0.08] bg-surface-primary px-5 py-4">
          <div className="min-h-5">
            <AnimatePresence mode="wait">
              {error ? (
                <InlineMessage tone="error" key="err">
                  {error}
                </InlineMessage>
              ) : saved ? (
                <InlineMessage tone="success" key="ok">
                  Chapitre enregistré ✓
                </InlineMessage>
              ) : (
                <span key="idle" className="text-xs text-text-muted">
                  {type === "QUIZ"
                    ? "Le quiz possède son propre bouton d'enregistrement."
                    : "Échap pour fermer."}
                </span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
              Fermer
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={pending}>
              <Save size={15} aria-hidden /> Enregistrer
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
