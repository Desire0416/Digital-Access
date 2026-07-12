"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Layers,
  Blocks,
  Rocket,
  ChevronUp,
  ChevronDown,
  Plus,
  Search,
  Eye,
  BookOpen,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@da/ui";
import type { ContentStatus } from "@da/academy-db/client";
import type { getCareerPathAdmin } from "@/lib/admin-queries";
import { LEVEL_LABEL, formatFCFA } from "@/lib/site";
import { Select } from "@/components/Select";
import { ImageUpload } from "@/components/ImageUpload";
import {
  updateCareerPath,
  setCareerPathStatus,
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhases,
  addCourseToPath,
  removeCourseFromPath,
  reorderPathCourses,
} from "@/lib/admin-actions";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE, StatusPill } from "./ui";
import { inputClass, textareaClass, FieldLabel, linesToArray, arrayToLines } from "./forms";
import { useAdminAction, Feedback, SaveButton, DeleteButton } from "./action-hooks";

/* ══════════════════════════════════════════════════════════════════════════
   Constructeur de parcours métier (§30.3, §13). Cœur du cahier (§3.2) : on
   n'y crée AUCUN contenu — on ASSEMBLE des formations existantes du catalogue
   en phases. Onglets : Fiche · Phases · Composition.
   ══════════════════════════════════════════════════════════════════════════ */

type PathAdmin = NonNullable<Awaited<ReturnType<typeof getCareerPathAdmin>>>;
type PhaseT = PathAdmin["phases"][number];
type CompT = PathAdmin["courses"][number];
type CatalogueItem = { id: string; title: string; slug: string; level: string; price: number; status: string };

type Tab = "fiche" | "phases" | "composition";
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "fiche", label: "Fiche", icon: FileText },
  { id: "phases", label: "Phases", icon: Layers },
  { id: "composition", label: "Composition", icon: Blocks },
];

export function PathBuilder({ path, catalogue }: { path: PathAdmin; catalogue: CatalogueItem[] }) {
  const [tab, setTab] = React.useState<Tab>("fiche");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/parcours" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal">
          ← Tous les parcours
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[1.7rem]">{path.title}</h1>
              <StatusPill label={CONTENT_STATUS_LABEL[path.status]} tone={CONTENT_STATUS_TONE[path.status]} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {path.targetJob} · {path.courses.length} formation{path.courses.length > 1 ? "s" : ""} · {path.phases.length} phase{path.phases.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/parcours-metiers/${path.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal">
              <Eye size={15} /> Aperçu
            </Link>
            <StatusControl pathId={path.id} status={path.status} canPublish={path.courses.length >= 1} />
          </div>
        </div>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-navy/[0.08] px-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("relative inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors", active ? "text-brand-blue-royal" : "text-text-secondary hover:text-navy")}>
              <Icon size={16} />
              {t.label}
              {active && <motion.span layoutId="path-tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-da" />}
            </button>
          );
        })}
      </div>

      {tab === "fiche" && <PathFiche path={path} />}
      {tab === "phases" && <PhasesTab path={path} />}
      {tab === "composition" && <CompositionTab path={path} catalogue={catalogue} />}
    </div>
  );
}

function StatusControl({ pathId, status, canPublish }: { pathId: string; status: ContentStatus; canPublish: boolean }) {
  const { pending, run } = useAdminAction();
  const NEXT: Record<ContentStatus, ContentStatus[]> = {
    DRAFT: ["REVIEW"],
    REVIEW: ["APPROVED", "DRAFT"],
    APPROVED: ["PUBLISHED", "DRAFT"],
    SCHEDULED: ["PUBLISHED", "DRAFT"],
    PUBLISHED: ["SUSPENDED", "ARCHIVED"],
    SUSPENDED: ["PUBLISHED"],
    ARCHIVED: ["DRAFT"],
  };
  const targets = NEXT[status] ?? [];
  const LABEL: Record<ContentStatus, string> = {
    DRAFT: "Brouillon", REVIEW: "Soumettre", APPROVED: "Approuver", SCHEDULED: "Programmer", PUBLISHED: "Publier", SUSPENDED: "Suspendre", ARCHIVED: "Archiver",
  };
  return (
    <div className="flex items-center gap-1.5">
      {targets.map((t) => {
        const blocked = t === "PUBLISHED" && !canPublish;
        return (
          <button
            key={t}
            type="button"
            disabled={pending || blocked}
            onClick={() => run(() => setCareerPathStatus(pathId, t))}
            title={blocked ? "Publier exige au moins une formation dans le parcours." : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50",
              t === "PUBLISHED" ? "bg-gradient-da text-white shadow-brand" : "border border-navy/10 text-navy hover:border-brand-blue-vif/40",
            )}
          >
            {t === "PUBLISHED" && <Rocket size={14} />}
            {LABEL[t]}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Fiche ─────────────────────────────────────────────────────────────────── */

function PathFiche({ path }: { path: PathAdmin }) {
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState(path.title);
  const [targetJob, setTargetJob] = React.useState(path.targetJob);
  const [description, setDescription] = React.useState(path.description ?? "");
  const [missions, setMissions] = React.useState(arrayToLines(path.missions));
  const [outcomes, setOutcomes] = React.useState(arrayToLines(path.outcomes));
  const [entryLevel, setEntryLevel] = React.useState(path.entryLevel);
  const [exitLevel, setExitLevel] = React.useState(path.exitLevel);
  const [duration, setDuration] = React.useState(path.duration ?? "");
  const [rhythm, setRhythm] = React.useState(path.rhythm ?? "");
  const [price, setPrice] = React.useState(path.price.toString());
  const [certificationTitle, setCertificationTitle] = React.useState(path.certificationTitle ?? "");
  const [cover, setCover] = React.useState<string | null>(path.coverImage ?? null);
  const [featured, setFeatured] = React.useState(path.featured);

  const levelOptions = (["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const).map((l) => ({ value: l, label: LEVEL_LABEL[l] }));

  function save() {
    run(() =>
      updateCareerPath(path.id, {
        title,
        targetJob,
        description,
        missions: linesToArray(missions),
        outcomes: linesToArray(outcomes),
        entryLevel,
        exitLevel,
        duration: duration || "",
        rhythm: rhythm || "",
        price: price.trim() ? Number(price) : 0,
        certificationTitle: certificationTitle || "",
        coverImage: cover ?? "",
        featured,
      }),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Métier & présentation</h2>
          <div className="space-y-4">
            <FieldLabel label="Intitulé du parcours" required>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Métier cible" required>
              <input value={targetJob} onChange={(e) => setTargetJob(e.target.value)} className={inputClass} placeholder="Ex. Analyste de données" />
            </FieldLabel>
            <FieldLabel label="Description" hint="Markdown accepté.">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(textareaClass, "min-h-[130px]")} />
            </FieldLabel>
            <FieldLabel label="Missions du métier" hint="Une ligne par mission.">
              <textarea value={missions} onChange={(e) => setMissions(e.target.value)} className={textareaClass} />
            </FieldLabel>
            <FieldLabel label="Débouchés / résultats visés" hint="Une ligne par débouché.">
              <textarea value={outcomes} onChange={(e) => setOutcomes(e.target.value)} className={textareaClass} />
            </FieldLabel>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Couverture</h2>
          <ImageUpload value={cover} onChange={setCover} folder="career-paths" aspect="16 / 9" />
        </div>
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Paramètres</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Niveau d'entrée">
                <Select value={entryLevel} onChange={(v) => setEntryLevel(v as typeof entryLevel)} options={levelOptions} />
              </FieldLabel>
              <FieldLabel label="Niveau de sortie">
                <Select value={exitLevel} onChange={(v) => setExitLevel(v as typeof exitLevel)} options={levelOptions} />
              </FieldLabel>
            </div>
            <FieldLabel label="Durée" hint="Libellé libre.">
              <input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} placeholder="Ex. 9 mois" />
            </FieldLabel>
            <FieldLabel label="Rythme">
              <input value={rhythm} onChange={(e) => setRhythm(e.target.value)} className={inputClass} placeholder="Ex. 10 h / semaine" />
            </FieldLabel>
            <FieldLabel label="Prix plein (FCFA)" hint="Le prix affiché déduira les formations déjà acquises.">
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Intitulé de la certification">
              <input value={certificationTitle} onChange={(e) => setCertificationTitle(e.target.value)} className={inputClass} />
            </FieldLabel>
            <button type="button" onClick={() => setFeatured((v) => !v)} className="flex items-center gap-2.5 text-left">
              <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", featured ? "bg-gradient-da" : "bg-navy/15")}>
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", featured ? "left-[18px]" : "left-0.5")} />
              </span>
              <span className="text-sm font-medium text-navy">Mettre en vedette</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary/95 px-4 py-3 shadow-lg backdrop-blur">
          <Feedback msg={msg} />
          <SaveButton pending={pending} onClick={save}>Enregistrer la fiche</SaveButton>
        </div>
      </div>
    </div>
  );
}

/* ─── Phases ────────────────────────────────────────────────────────────────── */

function PhasesTab({ path }: { path: PathAdmin }) {
  const { pending, msg, run } = useAdminAction();

  function move(index: number, dir: -1 | 1) {
    const next = [...path.phases];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    run(() => reorderPhases(path.id, next.map((p) => p.id)), { silent: true });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-navy">Phases du parcours</h2>
          <p className="text-sm text-text-secondary">Structurez la progression (ex. Fondations, Spécialisation, Professionnalisation).</p>
        </div>
        <div className="flex items-center gap-3">
          <Feedback msg={msg} />
          <button type="button" onClick={() => run(() => createPhase(path.id, { title: "Nouvelle phase" }))} disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-3.5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60">
            <Plus size={15} /> Phase
          </button>
        </div>
      </div>

      {path.phases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/40 px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand"><Layers size={22} /></span>
          <p className="mt-4 font-display font-bold text-navy">Aucune phase</p>
          <p className="mt-1 text-sm text-text-secondary">Les formations pourront ensuite être réparties dans ces phases.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {path.phases.map((ph, i) => (
            <PhaseEditor key={ph.id} phase={ph} index={i} total={path.phases.length} onMove={(dir) => move(i, dir)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseEditor({ phase, index, total, onMove }: { phase: PhaseT; index: number; total: number; onMove: (dir: -1 | 1) => void }) {
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState(phase.title);
  const [description, setDescription] = React.useState(phase.description ?? "");

  return (
    <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-violet/10 font-display text-sm font-bold text-brand-violet">{index + 1}</span>
        <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_1.5fr]">
          <FieldLabel label="Titre">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Description">
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </FieldLabel>
        </div>
        <div className="flex shrink-0 flex-col pt-6">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0 || pending} className="text-text-muted hover:text-brand-blue-royal disabled:opacity-30" aria-label="Monter"><ChevronUp size={16} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1 || pending} className="text-text-muted hover:text-brand-blue-royal disabled:opacity-30" aria-label="Descendre"><ChevronDown size={16} /></button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SaveButton pending={pending} onClick={() => run(() => updatePhase(phase.id, { title, description }))}>Enregistrer</SaveButton>
          <Feedback msg={msg} />
        </div>
        <DeleteButton pending={pending} label="Supprimer la phase" onConfirm={() => run(() => deletePhase(phase.id))} />
      </div>
    </div>
  );
}

/* ─── Composition (§3.2 — assemblage) ───────────────────────────────────────── */

function CompositionTab({ path, catalogue }: { path: PathAdmin; catalogue: CatalogueItem[] }) {
  const { pending, run } = useAdminAction();
  const inPathIds = new Set(path.courses.map((c) => c.courseId));
  const [query, setQuery] = React.useState("");
  const available = catalogue.filter((c) => !inPathIds.has(c.id) && c.title.toLowerCase().includes(query.trim().toLowerCase()));

  function move(index: number, dir: -1 | 1) {
    const next = [...path.courses];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    run(() => reorderPathCourses(path.id, next.map((c) => c.courseId)), { silent: true });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Colonne de composition */}
      <div className="space-y-3">
        <div className="rounded-xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.04] px-4 py-3 text-sm text-brand-blue-royal">
          Un parcours <strong>assemble</strong> des formations existantes. Aucune leçon ne se crée ici : le contenu vit dans chaque formation.
        </div>

        {path.courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/40 px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand"><Blocks size={22} /></span>
            <p className="mt-4 font-display font-bold text-navy">Parcours vide</p>
            <p className="mt-1 text-sm text-text-secondary">Ajoutez des formations depuis le catalogue à droite.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {path.courses.map((c, i) => (
              <CompositionRow key={c.id} entry={c} index={i} total={path.courses.length} phases={path.phases} siblings={path.courses} onMove={(dir) => move(i, dir)} pathId={path.id} />
            ))}
          </div>
        )}
      </div>

      {/* Catalogue */}
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4">
        <h2 className="mb-1 font-display text-base font-bold text-navy">Catalogue de formations</h2>
        <p className="mb-3 text-xs text-text-secondary">Cliquez pour attacher au parcours.</p>
        <div className="relative mb-3">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className={cn(inputClass, "pl-9")} />
        </div>
        <div className="max-h-[520px] space-y-1.5 overflow-y-auto">
          {available.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-text-muted">Aucune formation disponible.</p>
          ) : (
            available.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => run(() => addCourseToPath({ careerPathId: path.id, courseId: c.id }))}
                disabled={pending}
                className="flex w-full items-center gap-2.5 rounded-xl border border-navy/[0.08] p-2.5 text-left transition-colors hover:border-brand-blue-vif/40 hover:bg-brand-blue-vif/[0.03] disabled:opacity-60"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-blue-vif/10 text-brand-blue-royal"><BookOpen size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{c.title}</span>
                  <span className="block text-xs text-text-muted">{LEVEL_LABEL[c.level] ?? c.level} · {c.price > 0 ? formatFCFA(c.price) : "Gratuit"}</span>
                </span>
                <Plus size={16} className="shrink-0 text-brand-blue-royal" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CompositionRow({
  entry,
  index,
  total,
  phases,
  siblings,
  onMove,
  pathId,
}: {
  entry: CompT;
  index: number;
  total: number;
  phases: PhaseT[];
  siblings: CompT[];
  onMove: (dir: -1 | 1) => void;
  pathId: string;
}) {
  const { pending, run } = useAdminAction();
  const prereqOptions = [
    { value: "", label: "Aucun prérequis interne" },
    ...siblings.filter((s) => s.courseId !== entry.courseId).map((s) => ({ value: s.courseId, label: s.course.title })),
  ];
  const phaseOptions = [{ value: "", label: "Sans phase" }, ...phases.map((p) => ({ value: p.id, label: p.title }))];

  return (
    <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-3">
      <div className="flex items-center gap-2.5">
        <div className="flex shrink-0 flex-col">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0 || pending} className="text-text-muted hover:text-brand-blue-royal disabled:opacity-30" aria-label="Monter"><ChevronUp size={15} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1 || pending} className="text-text-muted hover:text-brand-blue-royal disabled:opacity-30" aria-label="Descendre"><ChevronDown size={15} /></button>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-da text-sm font-bold text-white">{index + 1}</span>
        <Link href={`/admin/formations/${entry.courseId}`} className="min-w-0 flex-1">
          <p className="truncate font-semibold text-navy hover:text-brand-blue-royal">{entry.course.title}</p>
          <p className="truncate text-xs text-text-muted">{LEVEL_LABEL[entry.course.level] ?? entry.course.level} · {entry.course.price > 0 ? formatFCFA(entry.course.price) : "Gratuit"}</p>
        </Link>
        <DeleteButton pending={pending} compact label="Retirer" onConfirm={() => run(() => removeCourseFromPath(pathId, entry.courseId))} />
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-muted">Phase</label>
          <Select value={entry.phaseId ?? ""} onChange={(v) => run(() => addCourseToPath({ careerPathId: pathId, courseId: entry.courseId, phaseId: v || null }))} options={phaseOptions} buttonClassName="py-2 text-xs" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-muted">Prérequis interne</label>
          <Select value={entry.prerequisiteCourseId ?? ""} onChange={(v) => run(() => addCourseToPath({ careerPathId: pathId, courseId: entry.courseId, prerequisiteCourseId: v || null }))} options={prereqOptions} buttonClassName="py-2 text-xs" />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => run(() => addCourseToPath({ careerPathId: pathId, courseId: entry.courseId, isRequired: !entry.isRequired }))}
            disabled={pending}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
              entry.isRequired ? "border-success/30 bg-success/10 text-success" : "border-navy/10 text-text-secondary hover:border-navy/20",
            )}
          >
            {entry.isRequired ? <CheckCircle2 size={13} /> : <Lock size={13} />}
            {entry.isRequired ? "Obligatoire" : "Optionnelle"}
          </button>
        </div>
      </div>
    </div>
  );
}
