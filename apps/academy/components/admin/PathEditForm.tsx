"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Save, Star } from "lucide-react";
import { Button, Input, Textarea, Field, cn } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { AdminCard } from "@/components/admin/ui";
import { LEVEL_LABEL, type Level } from "@/lib/types";
import { updateCareerPath } from "@/lib/admin-actions";
import type { AdminPathEdit, SchoolOption } from "@/lib/admin-types";

/* ══════════════════════════════════════════════════════════════════════════
   Édition d'un parcours métier. Écrit via la Server Action updateCareerPath,
   dans une transition, puis rafraîchit la vue. Erreurs affichées sous le
   formulaire ; confirmation visuelle à l'enregistrement.
   ══════════════════════════════════════════════════════════════════════════ */

const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

export function PathEditForm({ path, schools }: { path: AdminPathEdit; schools: SchoolOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [title, setTitle] = React.useState(path.title);
  const [targetJob, setTargetJob] = React.useState(path.targetJob);
  const [shortDescription, setShortDescription] = React.useState(path.shortDescription);
  const [schoolId, setSchoolId] = React.useState(path.schoolId);
  const [level, setLevel] = React.useState(path.level);
  const [price, setPrice] = React.useState(String(path.price));
  const [duration, setDuration] = React.useState(path.duration ?? "");
  const [featured, setFeatured] = React.useState(path.featured);

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
      const res = await updateCareerPath(path.id, {
        title,
        targetJob,
        shortDescription,
        schoolId,
        level,
        price: Number(price) || 0,
        duration,
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
            <Field label="Titre du parcours" htmlFor="title" required>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Développeur Web Full-Stack"
              />
            </Field>

            <Field label="Métier visé" htmlFor="targetJob" hint="Le poste auquel ce parcours prépare l'apprenant.">
              <Input
                id="targetJob"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Ex. Développeur Full-Stack junior"
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
          </div>
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
                ariaLabel="École du parcours"
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
                ariaLabel="Niveau du parcours"
              />
            </Field>

            <Field label="Prix (FCFA)" htmlFor="price" hint="Saisir 0 pour un parcours gratuit.">
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

            <Field label="Durée" htmlFor="duration" hint="Ex. 6 mois, 120 heures…">
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex. 6 mois"
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
                <span className="block text-sm font-semibold text-navy">Parcours vedette</span>
                <span className="block text-xs text-text-secondary">
                  Mis en avant sur l'accueil et le catalogue.
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
