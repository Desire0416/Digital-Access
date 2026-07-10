"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Save, Star } from "lucide-react";
import { Button, Input, Textarea, Field, cn } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { ImageUpload } from "@/components/ImageUpload";
import { AdminCard } from "@/components/admin/ui";
import { LEVEL_LABEL, type Level } from "@/lib/types";
import { updateShortCourse } from "@/lib/admin-actions";
import type { AdminShortCourseEdit, SchoolOption } from "@/lib/admin-types";

/* ══════════════════════════════════════════════════════════════════════════
   Édition d'une formation courte. Écrit via la Server Action updateShortCourse,
   dans une transition, puis rafraîchit la vue. Erreurs affichées sous le
   formulaire ; confirmation visuelle à l'enregistrement.
   ══════════════════════════════════════════════════════════════════════════ */

const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

export function ShortCourseEditForm({
  course,
  schools,
}: {
  course: AdminShortCourseEdit;
  schools: SchoolOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [title, setTitle] = React.useState(course.title);
  const [shortDescription, setShortDescription] = React.useState(course.shortDescription);
  const [schoolId, setSchoolId] = React.useState(course.schoolId);
  const [level, setLevel] = React.useState(course.level);
  const [price, setPrice] = React.useState(String(course.price));
  const [duration, setDuration] = React.useState(course.duration ?? "");
  const [courseType, setCourseType] = React.useState(course.courseType ?? "");
  const [coverImage, setCoverImage] = React.useState<string | null>(course.coverImage ?? null);
  const [featured, setFeatured] = React.useState(course.featured);

  const schoolOptions: SelectOption[] = schools.map((s) => ({ value: s.id, label: s.name }));
  const levelOptions: SelectOption[] = LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l] }));

  function dirty() {
    if (saved) setSaved(false);
    if (error) setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (title.trim().length < 3) {
      setError("Le titre doit contenir au moins 3 caractères.");
      return;
    }
    startTransition(async () => {
      const res = await updateShortCourse(course.id, {
        title,
        shortDescription,
        schoolId,
        level,
        price: Number(price) || 0,
        duration,
        courseType: courseType.trim() || undefined,
        coverImage: coverImage || undefined,
        featured,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} onInput={dirty} className="grid gap-6 lg:grid-cols-3">
      {/* Colonne principale — informations */}
      <div className="space-y-6 lg:col-span-2">
        <AdminCard title="Informations">
          <div className="space-y-5">
            <Field label="Titre de la formation" htmlFor="title" required>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Initiation à Figma"
              />
            </Field>

            <Field label="Description courte" htmlFor="shortDescription" hint="Résumé affiché dans le catalogue.">
              <Textarea
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
                placeholder="En quelques phrases, ce que l'apprenant sera capable de faire."
              />
            </Field>

            <Field
              label="Type de formation"
              htmlFor="courseType"
              hint="Ex. initiation, atelier, outil, module bonus…"
            >
              <Input
                id="courseType"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                placeholder="Ex. atelier"
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Image de couverture">
          <ImageUpload
            value={coverImage}
            onChange={(v) => {
              dirty();
              setCoverImage(v);
            }}
            folder="short-courses"
            aspect="16 / 10"
            hint="PNG, JPG ou WebP — 5 Mo max. Affichée sur la carte de la formation (idéalement 1600 × 1000)."
          />
        </AdminCard>
      </div>

      {/* Colonne latérale — paramètres */}
      <div className="space-y-6">
        <AdminCard title="Paramètres">
          <div className="space-y-5">
            <Field label="École de rattachement">
              <Select
                value={schoolId}
                onChange={(v) => {
                  dirty();
                  setSchoolId(v);
                }}
                options={schoolOptions}
                placeholder="Choisir une école"
                ariaLabel="École de la formation"
              />
            </Field>

            <Field label="Niveau">
              <Select
                value={level}
                onChange={(v) => {
                  dirty();
                  setLevel(v);
                }}
                options={levelOptions}
                ariaLabel="Niveau de la formation"
              />
            </Field>

            <Field label="Prix (FCFA)" htmlFor="price" hint="Saisir 0 pour une formation gratuite.">
              <Input
                id="price"
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>

            <Field label="Durée" htmlFor="duration" hint="Ex. 3 heures, 2 semaines…">
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex. 3 heures"
              />
            </Field>

            <button
              type="button"
              onClick={() => {
                dirty();
                setFeatured((f) => !f);
              }}
              aria-pressed={featured}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                featured
                  ? "border-brand-violet/40 bg-brand-violet/[0.06]"
                  : "border-navy/10 hover:border-navy/20",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                  featured ? "bg-gradient-da text-white" : "bg-navy/[0.06] text-text-muted",
                )}
              >
                <Star size={16} className={featured ? "fill-current" : ""} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy">Formation vedette</span>
                <span className="block text-xs text-text-secondary">
                  Mise en avant sur l'accueil et le catalogue.
                </span>
              </span>
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                  featured ? "border-brand-violet bg-brand-violet text-white" : "border-navy/20",
                )}
              >
                {featured && <Check size={13} />}
              </span>
            </button>
          </div>
        </AdminCard>

        <div className="space-y-3">
          {error && (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">{error}</p>
          )}
          {saved && !error && (
            <p className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
              <Check size={15} /> Modifications enregistrées.
            </p>
          )}
          <Button type="submit" loading={pending} className="w-full">
            <Save size={16} /> Enregistrer
          </Button>
        </div>
      </div>
    </form>
  );
}
