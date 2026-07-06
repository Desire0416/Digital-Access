"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  FolderPlus,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button, Field, Input, Textarea, cn } from "@da/ui";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/admin-actions";
import type { AdminCategory } from "@/lib/admin-queries";
import { EmptyState } from "@/components/admin/ui";
import { ImageUpload } from "@/components/ImageUpload";

const DEFAULT_COLOR = "#5B3FA8";

/** Palette d'accents suggérée (dégradé signature DA + fonctionnelles). */
const SWATCHES = [
  "#5B3FA8",
  "#2B5CC6",
  "#1E8FE1",
  "#00BCD4",
  "#7C3AED",
  "#059669",
  "#F59E0B",
  "#DC2626",
];

/** Une icône de catégorie peut être une URL Blob (http…) ou un emoji/texte. */
function isImageIcon(icon: string | null | undefined): icon is string {
  return !!icon && /^https?:\/\//i.test(icon);
}

/* ══════════════════════════════════════════════════════════════════════════
   Rendu visuel d'une icône de catégorie — <img> si URL, sinon emoji/texte,
   sinon une icône générique. Réutilisé par la carte et l'aperçu de la modale.
   ══════════════════════════════════════════════════════════════════════════ */
function CategoryGlyph({
  icon,
  color,
  size = 44,
}: {
  icon: string | null | undefined;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl text-white shadow-sm"
      style={{ width: size, height: size, background: color }}
    >
      {isImageIcon(icon) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : icon ? (
        <span
          className="leading-none"
          style={{ fontSize: Math.round(size * 0.44) }}
        >
          {icon}
        </span>
      ) : (
        <Layers size={Math.round(size * 0.42)} strokeWidth={2.25} />
      )}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CategoryManager — un seul composant, deux points de montage :
     slot="header" → le bouton « Nouvelle catégorie » (dans AdminPageHeader)
     slot="grid"   → la grille de cartes + la modale unique (création/édition/
                     suppression), rendue en PORTAIL au niveau de <body>.
   L'état des dialogues vit dans un petit store partagé (useSyncExternalStore)
   pour que les DEUX points de montage pilotent la même et unique modale — une
   seule à la fois, jamais imbriquée dans une carte animée (cause racine du
   scintillement précédent). Le portail n'est monté qu'une fois (slot "grid").
   ══════════════════════════════════════════════════════════════════════════ */

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; category: AdminCategory }
  | { kind: "delete"; category: AdminCategory }
  | null;

// ── Store minimal partagé entre les deux points de montage ─────────────────
let dialogState: DialogState = null;
const listeners = new Set<() => void>();

function openDialog(next: DialogState) {
  dialogState = next;
  listeners.forEach((l) => l());
}
function closeDialog() {
  dialogState = null;
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() {
  return dialogState;
}
function useDialogState(): DialogState {
  // Le serveur ne rend aucune modale → snapshot serveur stable = null.
  return React.useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function CategoryManager({
  categories,
  slot,
}: {
  categories: AdminCategory[];
  slot: "header" | "grid";
}) {
  if (slot === "header") {
    // La modale n'est montée qu'une fois — via le slot "grid".
    return <HeaderButton />;
  }

  return (
    <>
      <CategoryGrid categories={categories} />
      <CategoryDialogPortal />
    </>
  );
}

/* ───────────────────────── Bouton d'en-tête ─────────────────────────────── */

function HeaderButton() {
  const open = openDialog;
  return (
    <motion.button
      type="button"
      onClick={() => open({ kind: "create" })}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <Plus size={16} strokeWidth={2.5} />
      Nouvelle catégorie
    </motion.button>
  );
}

/* ────────────────────────────── La grille ──────────────────────────────── */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function CategoryGrid({ categories }: { categories: AdminCategory[] }) {
  const open = openDialog;

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<FolderPlus size={22} />}
        title="Aucune catégorie pour l'instant"
        description="Créez votre première catégorie pour commencer à organiser le catalogue de cours par thème."
      >
        <button
          type="button"
          onClick={() => open({ kind: "create" })}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nouvelle catégorie
        </button>
      </EmptyState>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </motion.div>
  );
}

/* ────────────────────────── Carte catégorie ────────────────────────────── */

function CategoryCard({ category }: { category: AdminCategory }) {
  const open = openDialog;
  const color = category.color || DEFAULT_COLOR;
  const hasCourses = category.courseCount > 0;

  return (
    <motion.article
      variants={itemVariant}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex flex-col rounded-2xl border border-navy/[0.08] bg-surface-primary transition-shadow hover:shadow-lg"
    >
      {/* Liseré d'accent à gauche */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ background: color }}
      />

      <div className="flex flex-1 flex-col p-6 pl-7">
        <div className="flex items-start gap-4">
          <CategoryGlyph icon={category.icon} color={color} size={52} />

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-bold leading-tight text-navy">
              {category.name}
            </h3>
            <p className="mt-1 truncate font-mono text-xs text-text-muted">
              /{category.slug}
            </p>
          </div>

          {/* Point de couleur */}
          <span
            aria-hidden
            className="mt-1.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
            style={{ background: color }}
          />
        </div>

        <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-text-secondary">
          {category.description || (
            <span className="italic text-text-muted">Aucune description</span>
          )}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-navy/[0.06] pt-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              hasCourses
                ? "bg-brand-blue-vif/10 text-brand-blue-royal"
                : "bg-navy/[0.06] text-text-secondary",
            )}
          >
            <Layers size={13} strokeWidth={2.25} />
            {category.courseCount} cours
          </span>

          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              onClick={() => open({ kind: "edit", category })}
              whileTap={{ scale: 0.9 }}
              className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-brand-violet/10 hover:text-brand-violet"
              aria-label={`Éditer la catégorie ${category.name}`}
            >
              <Pencil size={16} />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => open({ kind: "delete", category })}
              whileTap={{ scale: 0.9 }}
              className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
              aria-label={`Supprimer la catégorie ${category.name}`}
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ═══════════════════════ Portail unique de dialogue ═════════════════════ */

function CategoryDialogPortal() {
  const dialog = useDialogState();
  const onClose = closeDialog;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    // Toute navigation client remonte ce portail : on repart d'un store propre
    // pour ne jamais rouvrir une modale d'une visite précédente.
    return () => {
      dialogState = null;
    };
  }, []);

  // Verrou de défilement du corps tant qu'une modale est ouverte.
  React.useEffect(() => {
    if (!dialog) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dialog]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {dialog?.kind === "create" && (
        <CategoryForm key="create" mode="create" onClose={onClose} />
      )}
      {dialog?.kind === "edit" && (
        <CategoryForm
          key={`edit-${dialog.category.id}`}
          mode="edit"
          category={dialog.category}
          onClose={onClose}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteConfirm
          key={`delete-${dialog.category.id}`}
          category={dialog.category}
          onClose={onClose}
        />
      )}
    </AnimatePresence>,
    document.body,
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
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-navy/[0.07] bg-surface-primary shadow-2xl sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-navy/[0.06] px-6 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white">
                {icon}
              </span>
            )}
            <h2 className="truncate font-display text-lg font-bold text-navy">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-navy/[0.06] hover:text-navy"
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

function CategoryForm({
  mode,
  category,
  onClose,
}: {
  mode: "create" | "edit";
  category?: AdminCategory;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // États locaux stables — initialisés UNE fois (lazy initializer).
  const [name, setName] = React.useState(() => category?.name ?? "");
  const [description, setDescription] = React.useState(
    () => category?.description ?? "",
  );
  const [icon, setIcon] = React.useState<string | null>(
    () => category?.icon ?? null,
  );
  const [color, setColor] = React.useState(
    () => category?.color ?? DEFAULT_COLOR,
  );

  // onChange stable pour ImageUpload → pas de re-render en boucle.
  const handleIconChange = React.useCallback((url: string | null) => {
    setIcon(url);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon: icon?.trim() || undefined,
      color: color || undefined,
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

  const previewColor = color || DEFAULT_COLOR;

  return (
    <DialogShell
      title={mode === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"}
      icon={mode === "create" ? <FolderPlus size={18} /> : <Pencil size={18} />}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Aperçu vivant */}
          <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-surface-secondary p-3.5">
            <CategoryGlyph icon={icon} color={previewColor} size={48} />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-navy">
                {name.trim() || "Aperçu de la catégorie"}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {description.trim() || "La description apparaîtra ici"}
              </p>
            </div>
          </div>

          <Field label="Nom" htmlFor="cat-name" required>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Développement web, Design, Marketing…"
              maxLength={60}
              required
              autoFocus
            />
          </Field>

          <Field label="Description" htmlFor="cat-desc">
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Une phrase qui résume ce que couvre cette catégorie."
              rows={3}
              maxLength={240}
            />
          </Field>

          {/* Icône / image de la catégorie */}
          <Field
            label="Icône de la catégorie"
            hint="Une image carrée qui représente le thème (logo, illustration…)."
          >
            <div className="max-w-[168px]">
              <ImageUpload
                value={icon}
                onChange={handleIconChange}
                folder="categories"
                variant="dropzone"
                aspect="1 / 1"
                hint="PNG, JPG ou WebP"
              />
            </div>
          </Field>

          {/* Couleur d'accent */}
          <Field label="Couleur d'accent" htmlFor="cat-color">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  id="cat-color"
                  type="color"
                  value={previewColor}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-navy/15 bg-surface-primary p-1"
                  aria-label="Choisir la couleur d'accent"
                />
                <span className="font-mono text-sm uppercase tracking-wide text-text-secondary">
                  {previewColor}
                </span>
              </div>
              {/* Palette rapide */}
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((sw) => {
                  const active = sw.toLowerCase() === previewColor.toLowerCase();
                  return (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => setColor(sw)}
                      aria-label={`Couleur ${sw}`}
                      aria-pressed={active}
                      className={cn(
                        "h-7 w-7 rounded-full ring-offset-2 ring-offset-surface-primary transition-transform hover:scale-110",
                        active && "ring-2 ring-navy/40",
                      )}
                      style={{ background: sw }}
                    />
                  );
                })}
              </div>
            </div>
          </Field>

          {error && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm font-medium text-error"
            >
              <AlertTriangle size={15} className="shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* Actions collantes en bas */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-navy/[0.06] bg-surface-primary px-6 py-4 sm:flex-row sm:justify-end">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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

function DeleteConfirm({
  category,
  onClose,
}: {
  category: AdminCategory;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleDelete() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteCategory(category.id);
      if (!res.ok) {
        setError(res.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <DialogShell
      title={`Supprimer « ${category.name} » ?`}
      icon={<Trash2 size={18} />}
      onClose={onClose}
    >
      <div className="px-6 py-5">
        <p className="text-sm leading-relaxed text-text-secondary">
          Cette action est définitive. La catégorie sera retirée du catalogue
          et de tous les filtres. Une catégorie liée à des cours ne peut pas
          être supprimée.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm font-medium text-error"
          >
            <AlertTriangle size={15} className="shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            Annuler
          </Button>
          <motion.button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            whileHover={pending ? undefined : { scale: 1.02 }}
            whileTap={pending ? undefined : { scale: 0.97 }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-error px-6 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={15} />
            {pending ? "Suppression…" : "Supprimer"}
          </motion.button>
        </div>
      </div>
    </DialogShell>
  );
}
