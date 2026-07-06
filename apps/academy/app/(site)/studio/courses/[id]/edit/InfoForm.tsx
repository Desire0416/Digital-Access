"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Plus,
  X,
  Target,
  ListChecks,
  Save,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  Textarea,
  Badge,
  cn,
  formatFCFA,
} from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { updateCourseInfo } from "@/lib/studio-actions";
import type { StudioCourseEdit } from "@/lib/studio-types";
import type { CategoryItem } from "@/lib/types";
import { LEVELS, MiniHeading, InlineMessage, Toggle } from "./shared";

interface Props {
  course: StudioCourseEdit;
  categories: CategoryItem[];
  onSaved: (patch: Partial<StudioCourseEdit>) => void;
}

const DESC_MAX = 6000;

export function InfoForm({ course, categories, onSaved }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState(course.title);
  const [subtitle, setSubtitle] = React.useState(course.subtitle ?? "");
  const [description, setDescription] = React.useState(course.description);
  const [categoryId, setCategoryId] = React.useState(course.categoryId);
  const [level, setLevel] = React.useState(course.level);
  const [language, setLanguage] = React.useState(course.language || "fr");
  const [isFree, setIsFree] = React.useState(course.isFree);
  const [price, setPrice] = React.useState<string>(String(course.price || ""));
  const [coverImage, setCoverImage] = React.useState<string | null>(
    course.coverImage ?? null,
  );
  const [objectives, setObjectives] = React.useState<string[]>(
    course.objectives.length ? course.objectives : [""],
  );
  const [prerequisites, setPrerequisites] = React.useState<string[]>(
    course.prerequisites.length ? course.prerequisites : [""],
  );

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  function cleanList(list: string[]): string[] {
    return list.map((s) => s.trim()).filter(Boolean);
  }

  function handleSave() {
    setError(null);
    setFieldErrors({});
    setSaved(false);
    const priceNum = isFree ? 0 : Math.max(0, Math.round(Number(price) || 0));

    startTransition(async () => {
      const res = await updateCourseInfo({
        courseId: course.id,
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        categoryId,
        level,
        language: language.trim() || "fr",
        isFree,
        price: priceNum,
        coverImage: coverImage?.trim() || null,
        objectives: cleanList(objectives),
        prerequisites: cleanList(prerequisites),
      });
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      onSaved({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim(),
        categoryId,
        level,
        language: language.trim() || "fr",
        isFree,
        price: priceNum,
        coverImage: coverImage?.trim() || null,
        objectives: cleanList(objectives),
        prerequisites: cleanList(prerequisites),
      });
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2600);
    });
  }

  return (
    <div className="space-y-10">
      {/* ── Bloc : essentiels ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <MiniHeading>Présentation</MiniHeading>
        <div className="mt-6 grid gap-5">
          <Field
            label="Titre du cours"
            htmlFor="title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Maîtriser React de zéro à la production"
              error={Boolean(fieldErrors.title)}
              maxLength={120}
            />
          </Field>

          <Field
            label="Sous-titre"
            htmlFor="subtitle"
            hint="Une accroche courte affichée sous le titre (facultatif)."
          >
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex : Composants, hooks, state management et déploiement"
              maxLength={160}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            hint="Markdown accepté — décrivez le programme, le public visé et les résultats attendus."
          >
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
              placeholder="## À propos de ce cours&#10;Ce que vous allez apprendre…"
              className="min-h-40 font-mono text-sm"
            />
            <div className="mt-1 flex justify-end">
              <span
                className={cn(
                  "text-xs tabular-nums",
                  description.length >= 30 ? "text-text-muted" : "text-warning",
                )}
              >
                {description.length}/{DESC_MAX}
                {description.length < 30 && " · 30 minimum pour publier"}
              </span>
            </div>
          </Field>
        </div>
      </section>

      {/* ── Bloc : classification ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <MiniHeading>Classification</MiniHeading>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Catégorie" htmlFor="category" required>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 w-full rounded-lg border border-navy/15 bg-surface-primary px-3.5 text-navy transition-all focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Langue" htmlFor="language">
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-11 w-full rounded-lg border border-navy/15 bg-surface-primary px-3.5 text-navy transition-all focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25"
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          </Field>

          <div className="sm:col-span-2">
            <span className="block text-sm font-medium text-navy">Niveau</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {LEVELS.map((l) => {
                const active = level === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      active
                        ? "bg-gradient-da text-white shadow-brand"
                        : "border border-navy/15 text-text-secondary hover:border-brand-blue-vif/50 hover:text-navy",
                    )}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bloc : tarification ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <MiniHeading>Tarification</MiniHeading>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Toggle checked={!isFree} onChange={(v) => setIsFree(!v)} label="Cours payant" />
            <span className="text-sm font-medium text-navy">
              {isFree ? "Cours gratuit" : "Cours payant"}
            </span>
          </div>
          <Badge variant={isFree ? "success" : "gradient"}>
            {isFree ? "Accessible à tous" : "Accès après paiement"}
          </Badge>
        </div>

        <AnimatePresence initial={false}>
          {!isFree && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 max-w-xs">
                <Field label="Prix (FCFA)" htmlFor="price">
                  <div className="relative">
                    <Input
                      id="price"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) =>
                        setPrice(e.target.value.replace(/[^\d]/g, "").slice(0, 8))
                      }
                      placeholder="15000"
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                      FCFA
                    </span>
                  </div>
                </Field>
                {Number(price) > 0 && (
                  <p className="mt-1.5 text-xs text-text-secondary">
                    Affiché : {formatFCFA(Number(price))}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Bloc : illustration ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <MiniHeading>Image de couverture</MiniHeading>
        <p className="mt-3 max-w-prose text-sm text-text-secondary">
          Cette image représente votre cours dans le catalogue et sur sa page.
          Format 16:9, cadrée sur l'essentiel. Facultatif mais fortement
          recommandé.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <ImageUpload
            variant="dropzone"
            folder="courses"
            aspect="16 / 9"
            value={coverImage}
            onChange={setCoverImage}
            hint="PNG, JPG ou WebP — 5 Mo max · 1280×720 idéal"
          />
          <div className="rounded-xl border border-navy/[0.06] bg-surface-secondary/60 p-4 text-sm text-text-secondary">
            <p className="font-semibold text-navy">Conseils pour une belle couverture</p>
            <ul className="mt-2 space-y-1.5">
              <li className="flex gap-2">
                <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-gradient-da" />
                Une image nette, sans texte superposé (le titre s'affiche déjà par-dessus).
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-gradient-da" />
                Des couleurs contrastées qui ressortent sur mobile.
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-gradient-da" />
                Glissez-déposez le fichier ou cliquez pour parcourir.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Bloc : objectifs + prérequis ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EditableList
          icon={<Target size={16} aria-hidden />}
          title="Objectifs pédagogiques"
          hint="Ce que l'apprenant saura faire à la fin."
          placeholder="Ex : Créer une API REST sécurisée"
          items={objectives}
          setItems={setObjectives}
        />
        <EditableList
          icon={<ListChecks size={16} aria-hidden />}
          title="Prérequis"
          hint="Connaissances conseillées avant de commencer."
          placeholder="Ex : Bases de JavaScript"
          items={prerequisites}
          setItems={setPrerequisites}
        />
      </div>

      {/* ── Barre d'action ────────────────────────────────────────────────── */}
      <div className="sticky bottom-4 z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/[0.08] bg-surface-primary/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="min-h-5">
            <AnimatePresence mode="wait">
              {error ? (
                <InlineMessage tone="error" key="err">
                  {error}
                </InlineMessage>
              ) : saved ? (
                <motion.p
                  key="ok"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm font-semibold text-success"
                >
                  <Check size={15} strokeWidth={3} aria-hidden /> Informations enregistrées
                </motion.p>
              ) : (
                <span key="idle" className="text-sm text-text-muted">
                  Pensez à enregistrer vos modifications.
                </span>
              )}
            </AnimatePresence>
          </div>
          <Button variant="primary" size="md" onClick={handleSave} loading={pending}>
            <Save size={16} aria-hidden />
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Liste éditable ────────────────────────────────── */

function EditableList({
  icon,
  title,
  hint,
  placeholder,
  items,
  setItems,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  placeholder: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  function update(i: number, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? value : it)));
  }
  function remove(i: number) {
    setItems((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [""];
    });
  }
  function add() {
    setItems((prev) => (prev.length >= 12 ? prev : [...prev, ""]));
  }

  return (
    <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
      <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da/10 text-brand-blue-royal">
          {icon}
        </span>
        {title}
      </h3>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>

      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 flex-none rounded-full bg-gradient-da"
              />
              <Input
                value={item}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder}
                maxLength={200}
                className="h-10"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Retirer"
                className="grid h-9 w-9 flex-none place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
              >
                <X size={16} aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {items.length < 12 && (
        <button
          type="button"
          onClick={add}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
        >
          <Plus size={15} aria-hidden /> Ajouter
        </button>
      )}
    </section>
  );
}
