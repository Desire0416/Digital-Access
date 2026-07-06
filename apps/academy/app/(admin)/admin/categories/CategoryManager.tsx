"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderPlus,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Field,
  Input,
  Textarea,
  cn,
} from "@da/ui";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/admin-actions";
import type { AdminCategory } from "@/lib/admin-queries";
import { EmptyState } from "@/components/admin/ui";

const DEFAULT_COLOR = "#5B3FA8";

type FormState = {
  name: string;
  description: string;
  icon: string;
  color: string;
};

function toForm(cat?: AdminCategory): FormState {
  return {
    name: cat?.name ?? "",
    description: cat?.description ?? "",
    icon: cat?.icon ?? "",
    color: cat?.color ?? DEFAULT_COLOR,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   CategoryManager — un seul composant, deux points de montage :
     slot="header" → le bouton « Nouvelle catégorie » (dans AdminPageHeader)
     slot="grid"   → la grille de cartes + les dialogues d'édition/suppression
   Chaque slot gère son propre état de dialogue (create vs edit) — pas besoin
   de contexte partagé, ce qui garde le composant simple et robuste.
   ══════════════════════════════════════════════════════════════════════════ */

export function CategoryManager({
  categories,
  slot,
}: {
  categories: AdminCategory[];
  slot: "header" | "grid";
}) {
  if (slot === "header") return <CreateButton />;
  return <CategoryGrid categories={categories} />;
}

/* ───────────────────────── Bouton d'en-tête ─────────────────────────────── */

function CreateButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
      >
        <Plus size={16} strokeWidth={2.5} />
        Nouvelle catégorie
      </motion.button>

      <AnimatePresence>
        {open && (
          <CategoryDialog
            mode="create"
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ────────────────────────────── La grille ──────────────────────────────── */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function CategoryGrid({ categories }: { categories: AdminCategory[] }) {
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<FolderPlus size={22} />}
        title="Aucune catégorie pour l'instant"
        description="Créez votre première catégorie pour commencer à organiser le catalogue de cours."
      />
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </motion.div>
  );
}

/* ────────────────────────── Carte catégorie ────────────────────────────── */

function CategoryCard({ category }: { category: AdminCategory }) {
  const [editing, setEditing] = React.useState(false);
  const color = category.color || DEFAULT_COLOR;

  return (
    <motion.article
      variants={itemVariant}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-lg"
    >
      {/* Barre d'accent couleur */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: color }}
      />

      <div className="flex flex-1 flex-col p-5 pt-6">
        <div className="flex items-start gap-3">
          {/* Pastille couleur + icône/emoji */}
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white shadow-sm"
            style={{ background: color }}
          >
            {category.icon ? (
              <span className="leading-none">{category.icon}</span>
            ) : (
              <Layers size={18} strokeWidth={2.25} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-navy">
              {category.name}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-text-muted">
              /{category.slug}
            </p>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-text-secondary">
          {category.description || (
            <span className="italic text-text-muted">Aucune description</span>
          )}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-navy/[0.06] pt-4">
          <Badge variant={category.courseCount > 0 ? "info" : "default"}>
            {category.courseCount} cours
          </Badge>

          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              onClick={() => setEditing(true)}
              whileTap={{ scale: 0.9 }}
              className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-brand-violet/10 hover:text-brand-violet"
              aria-label={`Éditer ${category.name}`}
            >
              <Pencil size={15} />
            </motion.button>
            <DeleteButton category={category} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <CategoryDialog
            mode="edit"
            category={category}
            onClose={() => setEditing(false)}
          />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ─────────────────── Suppression (confirmation inline) ──────────────────── */

function DeleteButton({ category }: { category: AdminCategory }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteCategory(category.id);
      if (!res.ok) {
        setError(res.error);
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        whileTap={{ scale: 0.9 }}
        className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
        aria-label={`Supprimer ${category.name}`}
      >
        <Trash2 size={15} />
      </motion.button>

      {/* Erreur (ex. cours rattachés) affichée inline sous la carte */}
      {error && (
        <span className="pointer-events-none absolute inset-x-4 bottom-3 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">
          {error}
        </span>
      )}

      <AnimatePresence>
        {confirming && (
          <ConfirmDialog
            title={`Supprimer « ${category.name} » ?`}
            body="Cette action est définitive. La catégorie sera retirée du catalogue."
            confirmLabel="Supprimer"
            pending={pending}
            onCancel={() => setConfirming(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════ Coque de dialogue brandée ══════════════════════ */

function DialogShell({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Fermeture à la touche Échap.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-lg rounded-t-2xl border border-navy/[0.07] bg-surface-primary shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-navy/[0.06] px-6 py-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-da text-white">
                {icon}
              </span>
            )}
            <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-navy/[0.06] hover:text-navy"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────── Dialogue création / édition ────────────────────────── */

function CategoryDialog({
  mode,
  category,
  onClose,
}: {
  mode: "create" | "edit";
  category?: AdminCategory;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(() => toForm(category));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      icon: form.icon.trim() || undefined,
      color: form.color || undefined,
    };

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createCategory(payload)
          : await updateCategory(category!.id, payload);
      if (!res.ok) {
        setError(res.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  const color = form.color || DEFAULT_COLOR;

  return (
    <DialogShell
      title={mode === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"}
      icon={mode === "create" ? <FolderPlus size={18} /> : <Pencil size={18} />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
        {/* Aperçu de la pastille */}
        <div className="flex items-center gap-3 rounded-xl border border-navy/[0.07] bg-surface-secondary p-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white shadow-sm"
            style={{ background: color }}
          >
            {form.icon ? (
              <span className="leading-none">{form.icon}</span>
            ) : (
              <Layers size={18} strokeWidth={2.25} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-navy">
              {form.name.trim() || "Aperçu de la catégorie"}
            </p>
            <p className="truncate text-xs text-text-secondary">
              {form.description.trim() || "La description apparaîtra ici"}
            </p>
          </div>
        </div>

        <Field label="Nom" htmlFor="cat-name" required>
          <Input
            id="cat-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Développement web, Design, Marketing…"
            maxLength={60}
            required
            autoFocus
          />
        </Field>

        <Field label="Description" htmlFor="cat-desc">
          <Textarea
            id="cat-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Une phrase qui résume ce que couvre cette catégorie."
            rows={3}
            maxLength={240}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Icône" htmlFor="cat-icon" hint="Emoji ou nom d'icône">
            <Input
              id="cat-icon"
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
              placeholder="🎨  ou  code"
              maxLength={40}
            />
          </Field>

          <Field label="Couleur d'accent" htmlFor="cat-color">
            <div className="flex items-center gap-3">
              <input
                id="cat-color"
                type="color"
                value={color}
                onChange={(e) => set("color", e.target.value)}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-navy/15 bg-surface-primary p-1"
                aria-label="Choisir la couleur"
              />
              <span className="font-mono text-sm uppercase tracking-wide text-text-secondary">
                {color}
              </span>
            </div>
          </Field>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-error/10 px-3 py-2.5 text-sm font-medium text-error"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            Annuler
          </Button>
          <motion.button
            type="submit"
            disabled={pending}
            whileHover={pending ? undefined : { scale: 1.02 }}
            whileTap={pending ? undefined : { scale: 0.97 }}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {pending
              ? "Enregistrement…"
              : mode === "create"
                ? "Créer la catégorie"
                : "Enregistrer"}
          </motion.button>
        </div>
      </form>
    </DialogShell>
  );
}

/* ───────────────── Dialogue de confirmation (suppression) ───────────────── */

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogShell title={title} icon={<Trash2 size={18} />} onClose={onCancel}>
      <div className="px-6 py-5">
        <p className="text-sm text-text-secondary">{body}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={pending}
          >
            Annuler
          </Button>
          <motion.button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            whileHover={pending ? undefined : { scale: 1.02 }}
            whileTap={pending ? undefined : { scale: 0.97 }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-error px-6 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={15} />
            {pending ? "Suppression…" : confirmLabel}
          </motion.button>
        </div>
      </div>
    </DialogShell>
  );
}
