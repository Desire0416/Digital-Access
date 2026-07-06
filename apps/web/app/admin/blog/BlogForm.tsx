"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Save,
  Send,
  FileText,
  Settings2,
  AlertCircle,
  X,
  Tag,
  Clock,
  ImageIcon,
  Eye,
  PenLine,
} from "lucide-react";
import {
  cn,
  buttonClasses,
  formatDate,
  Field,
  Input,
  Textarea,
} from "@da/ui";
import { createBlogPost, updateBlogPost } from "@/lib/admin-actions";
import { StatusPill, BLOG_STATUS, type Tone } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Formulaire d'article de blog — création & édition.
   Deux colonnes en lg : contenu à gauche (titre, extrait, corps markdown),
   réglages à droite (catégorie, couverture, tags, statut, temps de lecture,
   aperçu). Création → createBlogPost puis redirection vers l'édition.
   Édition → updateBlogPost puis router.refresh().
   ══════════════════════════════════════════════════════════════════════════ */

type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type BlogFormPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  status: string;
  readMinutes: number;
  publishedAt: string | null;
};

const STATUS_ORDER: BlogStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

/** Estime le temps de lecture (≈ 200 mots / minute), plancher à 1 min. */
function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogForm({
  mode = "create",
  post,
}: {
  mode?: "create" | "edit";
  post?: BlogFormPost;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [title, setTitle] = React.useState(post?.title ?? "");
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [content, setContent] = React.useState(post?.content ?? "");
  const [category, setCategory] = React.useState(post?.category ?? "");
  const [coverImage, setCoverImage] = React.useState(post?.coverImage ?? "");
  const [tags, setTags] = React.useState<string[]>(post?.tags ?? []);
  const [tagDraft, setTagDraft] = React.useState("");
  const [status, setStatus] = React.useState<BlogStatus>(
    (post?.status as BlogStatus) ?? "DRAFT",
  );
  const [readMinutes, setReadMinutes] = React.useState<string>(
    post?.readMinutes ? String(post.readMinutes) : "",
  );
  // Suit si l'utilisateur a saisi le temps de lecture manuellement.
  const [readTouched, setReadTouched] = React.useState(
    Boolean(post?.readMinutes),
  );

  // Auto-estimation du temps de lecture tant que non modifié à la main.
  React.useEffect(() => {
    if (!readTouched) {
      setReadMinutes(content.trim() ? String(estimateReadMinutes(content)) : "");
    }
  }, [content, readTouched]);

  /* ── Gestion des tags (découpage sur virgule / Entrée) ── */
  const commitTags = (raw: string) => {
    const parts = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setTags((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setTagDraft("");
  };

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTags(tagDraft);
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const onTagChange = (value: string) => {
    // Si l'utilisateur colle/tape une virgule, on valide immédiatement.
    if (value.includes(",")) {
      const [head] = value.split(",");
      commitTags(value);
      // Rien à conserver après la virgule (commitTags gère le reste).
      if (!head) setTagDraft("");
    } else {
      setTagDraft(value);
    }
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const canSubmit = title.trim() !== "" && excerpt.trim() !== "" && content.trim() !== "";

  const submit = () => {
    setError(null);
    setSaved(false);

    if (title.trim() === "") return setError("Le titre est requis.");
    if (excerpt.trim() === "") return setError("L’extrait est requis.");
    if (content.trim() === "") return setError("Le contenu est requis.");

    // On intègre un éventuel tag en cours de saisie.
    const pendingTags = tagDraft.trim()
      ? Array.from(
          new Set(
            [...tags, tagDraft.trim()].map((t) => t.trim()).filter(Boolean),
          ),
        )
      : tags;

    const parsedRead = parseInt(readMinutes, 10);
    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category: category.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      tags: pendingTags,
      status,
      readMinutes: Number.isFinite(parsedRead) && parsedRead > 0 ? parsedRead : undefined,
    };

    startTransition(async () => {
      if (mode === "create") {
        const res = await createBlogPost(payload);
        if (res.ok) {
          router.push(`/admin/blog/${res.id}/edit`);
        } else {
          setError(res.error);
        }
      } else {
        const res = await updateBlogPost({ id: post!.id, ...payload });
        if (res.ok) {
          setSaved(true);
          router.refresh();
          setTimeout(() => setSaved(false), 2500);
        } else {
          setError(res.error);
        }
      }
    });
  };

  const statusMeta = BLOG_STATUS[status]!;

  const selectClasses = cn(
    "h-11 w-full appearance-none rounded-lg border border-navy/15 bg-surface-primary px-4 pr-10 text-sm font-medium text-navy",
    "transition-all focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25 disabled:opacity-60",
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ─────────────── Colonne principale : rédaction ─────────────── */}
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
              <PenLine className="h-4 w-4" />
            </span>
            Rédaction
          </h2>

          <div className="mt-5 flex flex-col gap-5">
            <Field label="Titre" htmlFor="blog-title" required>
              <Input
                id="blog-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Un titre accrocheur pour l’article…"
                disabled={pending}
                className="font-display text-base font-semibold"
              />
            </Field>

            <Field
              label="Extrait"
              htmlFor="blog-excerpt"
              required
              hint="Résumé affiché dans les listes et le partage social."
            >
              <Textarea
                id="blog-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="En deux ou trois phrases, donnez envie de lire l’article."
                disabled={pending}
                className="min-h-24"
              />
            </Field>

            <Field
              label="Contenu"
              htmlFor="blog-content"
              required
              hint="Markdown supporté (titres ##, listes -, gras **, liens […](…))."
            >
              <Textarea
                id="blog-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"## Introduction\n\nRédigez le corps de l’article en Markdown…"}
                disabled={pending}
                className="min-h-[380px] font-mono text-[13px] leading-relaxed"
              />
            </Field>
          </div>
        </section>

        {/* Aperçu simple (titre + extrait) */}
        <section className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-secondary/40">
          <div className="flex items-center gap-2 border-b border-navy/[0.06] px-5 py-3">
            <Eye className="h-4 w-4 text-brand-blue-royal" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Aperçu
            </span>
          </div>
          <div className="p-5 sm:p-6">
            {coverImage.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt="Aperçu de l'image de couverture de l'article"
                className="mb-4 aspect-[16/7] w-full rounded-xl border border-navy/[0.06] object-cover"
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {category.trim() && (
                <span className="rounded-full bg-gradient-da px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {category.trim()}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                <Clock className="h-3 w-3" />
                {readMinutes || "—"} min de lecture
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight text-navy">
              {title.trim() || "Titre de l’article"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {excerpt.trim() || "L’extrait apparaîtra ici pour donner un aperçu au lecteur."}
            </p>
          </div>
        </section>
      </div>

      {/* ─────────────── Colonne latérale : réglages + publication ─────────────── */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        {/* Publication */}
        <section className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
          <div className="h-1 bg-gradient-da" />
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
                <Settings2 className="h-4 w-4 text-brand-blue-royal" />
                Publication
              </h2>
              <StatusPill label={statusMeta.label} tone={statusMeta.tone as Tone} />
            </div>

            <div className="mt-4">
              <Field label="Statut" htmlFor="blog-status">
                <div className="relative">
                  <select
                    id="blog-status"
                    value={status}
                    disabled={pending}
                    onChange={(e) => setStatus(e.target.value as BlogStatus)}
                    className={selectClasses}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {BLOG_STATUS[s]!.label}
                      </option>
                    ))}
                  </select>
                  <Chevron />
                </div>
              </Field>
            </div>

            {mode === "edit" && post?.publishedAt && (
              <p className="mt-3 text-xs text-text-muted">
                Publié le {formatDate(post.publishedAt)}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={pending || !canSubmit}
              className={cn(
                buttonClasses({ variant: "primary", size: "md" }),
                "mt-5 w-full disabled:opacity-50",
              )}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "create" ? "Création…" : "Enregistrement…"}
                </>
              ) : mode === "create" ? (
                <>
                  <Send className="h-4 w-4" />
                  Créer l’article
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-start gap-1.5 text-xs font-medium text-error"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </motion.p>
              ) : saved ? (
                <motion.p
                  key="ok"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success"
                >
                  <Save className="h-3.5 w-3.5" /> Modifications enregistrées
                </motion.p>
              ) : null}
            </AnimatePresence>

            {mode === "create" && (
              <p className="mt-3 text-center text-[11px] text-text-muted">
                Créé en brouillon par défaut — passez en « Publié » pour le rendre visible.
              </p>
            )}
          </div>
        </section>

        {/* Métadonnées */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
            <FileText className="h-4 w-4 text-brand-blue-royal" />
            Métadonnées
          </h2>

          <div className="mt-4 flex flex-col gap-5">
            <Field label="Catégorie" htmlFor="blog-category" hint="Optionnel.">
              <Input
                id="blog-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Développement, Design, Stratégie…"
                disabled={pending}
              />
            </Field>

            <Field
              label="Image de couverture"
              htmlFor="blog-cover"
              hint="URL d’une image (WebP/JPG). Optionnel."
            >
              <div className="relative">
                <Input
                  id="blog-cover"
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://…"
                  disabled={pending}
                  className="pl-10"
                />
                <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </Field>

            <Field
              label="Tags"
              htmlFor="blog-tags"
              hint="Séparez par une virgule ou la touche Entrée."
            >
              <div className="relative">
                <Input
                  id="blog-tags"
                  value={tagDraft}
                  onChange={(e) => onTagChange(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  onBlur={() => tagDraft.trim() && commitTags(tagDraft)}
                  placeholder="nextjs, seo, performance…"
                  disabled={pending}
                  className="pl-10"
                />
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
              {tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <AnimatePresence initial={false}>
                    {tags.map((tag) => (
                      <motion.span
                        key={tag}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-violet/10 py-1 pl-2.5 pr-1 text-xs font-semibold text-brand-violet"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          disabled={pending}
                          aria-label={`Retirer le tag ${tag}`}
                          className="grid h-4 w-4 place-items-center rounded-full text-brand-violet/70 transition-colors hover:bg-brand-violet/20 hover:text-brand-violet"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Field>

            <Field
              label="Temps de lecture"
              htmlFor="blog-read"
              hint="En minutes. Estimé automatiquement, ajustable."
            >
              <div className="relative w-full">
                <Input
                  id="blog-read"
                  inputMode="numeric"
                  value={readMinutes}
                  onChange={(e) => {
                    setReadTouched(true);
                    setReadMinutes(e.target.value.replace(/[^\d]/g, "").slice(0, 3));
                  }}
                  placeholder="5"
                  disabled={pending}
                  className="pl-10 pr-14"
                />
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                  min
                </span>
              </div>
            </Field>
          </div>
        </section>
      </aside>
    </div>
  );
}

/* Chevron décoratif pour les <select> personnalisés. */
function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 8l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
