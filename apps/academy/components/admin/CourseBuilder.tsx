"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ListTree,
  Link2,
  Rocket,
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  BookOpen,
  ClipboardList,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Star,
  ArrowUp,
  ArrowDown,
  Target,
  Route,
  X,
  Headphones,
  Presentation,
  Video,
  Calendar,
  PlayCircle,
} from "lucide-react";
import { cn, GradientText } from "@da/ui";
import type { ContentStatus } from "@da/academy-db/client";
import type { getCourseAdmin } from "@/lib/admin-queries";
import { LESSON_TYPE_LABEL, LEVEL_LABEL, formatFCFA } from "@/lib/site";
import { Select } from "@/components/Select";
import { ImageUpload } from "@/components/ImageUpload";
import { FileUpload } from "@/components/FileUpload";
import {
  updateCourse,
  setCourseStatus,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  attachCourseToSchool,
  detachCourseFromSchool,
  submitCourseForReview,
  type QuestionInput,
} from "@/lib/admin-actions";
import { setCourseSkill, removeCourseSkill } from "@/lib/skill-actions";
import { addCoursePrerequisite, removeCoursePrerequisite } from "@/lib/prerequisite-actions";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE, StatusPill } from "./ui";
import { inputClass, textareaClass, FieldLabel, linesToArray, arrayToLines } from "./forms";
import { useAdminAction, Feedback, SaveButton, DeleteButton } from "./action-hooks";

/* ══════════════════════════════════════════════════════════════════════════
   Constructeur de formation (§30.2, §11-12, §18). Onglets : Fiche · Programme ·
   Rattachements · Publication. Toute mutation passe par une Server Action
   gardée (requireAdminFresh). Le scoring reste 100 % serveur : ici on n'édite
   que l'énoncé et l'encodage de la bonne réponse (§5).
   ══════════════════════════════════════════════════════════════════════════ */

type CourseAdmin = NonNullable<Awaited<ReturnType<typeof getCourseAdmin>>>;
type ModuleT = CourseAdmin["modules"][number];
type LessonT = ModuleT["lessons"][number];
type AssessmentT = ModuleT["assessments"][number];
type QuestionT = AssessmentT["questions"][number];

type Tab = "fiche" | "programme" | "competences" | "rattachements" | "publication";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "fiche", label: "Fiche", icon: FileText },
  { id: "programme", label: "Programme", icon: ListTree },
  { id: "competences", label: "Compétences", icon: Target },
  { id: "rattachements", label: "Rattachements", icon: Link2 },
  { id: "publication", label: "Publication", icon: Rocket },
];

/* Niveaux CourseSkill (enum SkillLevel) — libellés côté client. */
const SKILL_LEVELS = ["DISCOVERY", "BEGINNER", "OPERATIONAL", "ADVANCED", "EXPERT"] as const;
const SKILL_LEVEL_LABEL: Record<(typeof SKILL_LEVELS)[number], string> = {
  DISCOVERY: "Découverte",
  BEGINNER: "Débutant",
  OPERATIONAL: "Opérationnel",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};
export type SkillPickerOption = { id: string; name: string; slug: string; domain: string | null };
export type PrereqPickerOption = { id: string; slug: string; title: string; level: string };

export function CourseBuilder({
  course,
  schools,
  skillOptions = [],
  prerequisiteOptions = [],
  canManageSchools = true,
  canPublish = true,
  backHref = "/admin/formations",
  backLabel = "Toutes les formations",
}: {
  course: CourseAdmin;
  schools: { id: string; name: string; color: string }[];
  /** Référentiel complet des compétences (pour l'onglet Compétences). */
  skillOptions?: SkillPickerOption[];
  /** Formations publiées sélectionnables comme prérequis structurés (§22.1). */
  prerequisiteOptions?: PrereqPickerOption[];
  /** Le rattachement aux écoles est réservé à l'admin (masqué au formateur). */
  canManageSchools?: boolean;
  /** L'admin publie/change le statut ; le formateur soumet à validation (§31). */
  canPublish?: boolean;
  /** Lien de retour (admin → /admin/formations ; formateur → /formateur/formations). */
  backHref?: string;
  backLabel?: string;
}) {
  const [tab, setTab] = React.useState<Tab>("fiche");
  const lessonsCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const visibleTabs = TABS.filter((t) => canManageSchools || t.id !== "rattachements");

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          ← {backLabel}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[1.7rem]">
                {course.title}
              </h1>
              <StatusPill label={CONTENT_STATUS_LABEL[course.status]} tone={CONTENT_STATUS_TONE[course.status]} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              /{course.slug} · {course.modules.length} module{course.modules.length > 1 ? "s" : ""} · {lessonsCount} leçon
              {lessonsCount > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href={`/formations/${course.slug}`}
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy/10 px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
          >
            <Eye size={15} />
            Aperçu public
          </Link>
        </div>
      </div>

      {/* Onglets */}
      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-navy/[0.08] px-1">
        {visibleTabs.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                active ? "text-brand-blue-royal" : "text-text-secondary hover:text-navy",
              )}
            >
              <Icon size={16} />
              {t.label}
              {active && (
                <motion.span layoutId="course-tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-da" />
              )}
            </button>
          );
        })}
      </div>

      {tab === "fiche" && <FicheTab course={course} prerequisiteOptions={prerequisiteOptions} />}
      {tab === "programme" && <ProgrammeTab course={course} />}
      {tab === "competences" && <CompetencesTab course={course} skillOptions={skillOptions} isAdmin={canManageSchools} />}
      {tab === "rattachements" && canManageSchools && <RattachementsTab course={course} schools={schools} />}
      {tab === "publication" && (
        <PublicationTab course={course} onGoto={setTab} canManageSchools={canManageSchools} canPublish={canPublish} />
      )}
    </div>
  );
}

/* ─────────────────────────── Onglet FICHE (§11.1) ─────────────────────────── */

function FicheTab({ course, prerequisiteOptions }: { course: CourseAdmin; prerequisiteOptions: PrereqPickerOption[] }) {
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState(course.title);
  const [slug, setSlug] = React.useState(course.slug);
  const [subtitle, setSubtitle] = React.useState(course.subtitle ?? "");
  const [description, setDescription] = React.useState(course.description ?? "");
  const [objectives, setObjectives] = React.useState(arrayToLines(course.objectives));
  const [audience, setAudience] = React.useState(arrayToLines(course.targetAudience));
  const [prereq, setPrereq] = React.useState(arrayToLines(course.prerequisitesText));
  const [tools, setTools] = React.useState(arrayToLines(course.tools));
  const [level, setLevel] = React.useState(course.level);
  const [durationHours, setDurationHours] = React.useState(course.durationHours?.toString() ?? "");
  const [price, setPrice] = React.useState(course.price.toString());
  const [cover, setCover] = React.useState<string | null>(course.coverImage ?? null);
  const [certificateTitle, setCertificateTitle] = React.useState(course.certificateTitle ?? "");
  const [unlockMode, setUnlockMode] = React.useState(course.unlockMode);

  function save() {
    run(() =>
      updateCourse(course.id, {
        title,
        slug,
        subtitle,
        description,
        objectives: linesToArray(objectives),
        targetAudience: linesToArray(audience),
        prerequisitesText: linesToArray(prereq),
        tools: linesToArray(tools),
        level,
        durationHours: durationHours.trim() ? Number(durationHours) : null,
        price: price.trim() ? Number(price) : 0,
        coverImage: cover ?? "",
        certificateTitle,
        unlockMode,
      }),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Identité</h2>
          <div className="space-y-4">
            <FieldLabel label="Titre" required>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Slug (URL)" hint="Minuscules, chiffres et tirets. Modifier l'URL publique de la formation.">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Sous-titre">
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} placeholder="Une phrase d'accroche" />
            </FieldLabel>
            <FieldLabel label="Description" hint="Markdown accepté (mise en forme de la fiche publique).">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(textareaClass, "min-h-[140px]")} />
            </FieldLabel>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Contenu de la fiche</h2>
          <div className="space-y-4">
            <FieldLabel label="Objectifs pédagogiques" hint="Une ligne par objectif.">
              <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} className={textareaClass} placeholder={"Maîtriser…\nSavoir…"} />
            </FieldLabel>
            <FieldLabel label="Public visé" hint="Une ligne par profil.">
              <textarea value={audience} onChange={(e) => setAudience(e.target.value)} className={textareaClass} />
            </FieldLabel>
            <FieldLabel label="Prérequis (affichage libre)" hint="Une ligne par prérequis.">
              <textarea value={prereq} onChange={(e) => setPrereq(e.target.value)} className={textareaClass} />
            </FieldLabel>
            <FieldLabel label="Outils & technologies" hint="Une ligne par outil.">
              <textarea value={tools} onChange={(e) => setTools(e.target.value)} className={textareaClass} />
            </FieldLabel>
          </div>
        </div>
      </div>

      {/* Colonne latérale */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Image de couverture</h2>
          <ImageUpload value={cover} onChange={setCover} folder="courses" aspect="16 / 9" />
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Paramètres</h2>
          <div className="space-y-4">
            <FieldLabel label="Niveau">
              <Select
                value={level}
                onChange={(v) => setLevel(v as typeof level)}
                options={(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const).map((l) => ({ value: l, label: LEVEL_LABEL[l] }))}
              />
            </FieldLabel>
            <FieldLabel label="Durée estimée (heures)">
              <input type="number" min={0} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Prix (FCFA)" hint="0 = gratuit.">
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Déverrouillage des leçons">
              <Select
                value={unlockMode}
                onChange={(v) => setUnlockMode(v as typeof unlockMode)}
                options={[
                  { value: "FREE", label: "Libre (toutes accessibles)" },
                  { value: "SEQUENTIAL", label: "Séquentiel (l'une après l'autre)" },
                ]}
              />
            </FieldLabel>
            <FieldLabel label="Intitulé du certificat" hint="Titre porté par le certificat délivré.">
              <input value={certificateTitle} onChange={(e) => setCertificateTitle(e.target.value)} className={inputClass} placeholder={course.title} />
            </FieldLabel>
          </div>
        </div>
      </div>

      {/* Prérequis structurés (§22.1) — sauvegarde immédiate, indépendante de la fiche */}
      <div className="lg:col-span-2">
        <PrerequisitesSection courseId={course.id} requires={course.requires} options={prerequisiteOptions} />
      </div>

      {/* Barre d'enregistrement */}
      <div className="lg:col-span-2">
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary/95 px-4 py-3 shadow-lg backdrop-blur">
          <Feedback msg={msg} />
          <SaveButton pending={pending} onClick={save}>
            Enregistrer la fiche
          </SaveButton>
        </div>
      </div>
    </div>
  );
}

/* ── Prérequis structurés (§22.1) — sélecteur + liste, sauvegarde immédiate ── */
function PrerequisitesSection({
  courseId,
  requires,
  options,
}: {
  courseId: string;
  requires: CourseAdmin["requires"];
  options: PrereqPickerOption[];
}) {
  const { pending, msg, run } = useAdminAction();
  const [pick, setPick] = React.useState("");
  const attachedIds = new Set(requires.map((r) => r.requiresCourse.id));
  const available = options.filter((o) => o.id !== courseId && !attachedIds.has(o.id));

  return (
    <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
      <h2 className="font-display text-base font-bold text-navy">Prérequis (formations)</h2>
      <p className="mt-1 text-xs text-text-secondary">
        Formations à <strong>terminer</strong> avant de pouvoir s&apos;inscrire à celle-ci (§22.1). L&apos;inscription reste
        verrouillée tant qu&apos;elles ne sont pas validées.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold text-navy">Ajouter un prérequis</p>
          <Select
            value={pick}
            onChange={setPick}
            options={[
              { value: "", label: available.length ? "Choisir une formation…" : "Aucune autre formation publiée" },
              ...available.map((o) => ({ value: o.id, label: o.title })),
            ]}
            buttonClassName="py-2"
          />
        </div>
        <button
          type="button"
          disabled={pending || !pick}
          onClick={() => {
            const id = pick;
            setPick("");
            run(() => addCoursePrerequisite(courseId, id));
          }}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {requires.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-navy/15 px-4 py-4 text-center text-sm text-text-muted">
          Aucun prérequis — cette formation est accessible directement.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {requires.map((r) => (
            <li
              key={r.requiresCourse.id}
              className="flex items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-3"
            >
              <Route size={15} className="shrink-0 text-brand-violet" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-semibold text-navy">{r.requiresCourse.title}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeCoursePrerequisite(courseId, r.requiresCourse.id))}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                aria-label={`Retirer ${r.requiresCourse.title}`}
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <Feedback msg={msg} />
      </div>
    </div>
  );
}

/* ──────────────────────── Onglet PROGRAMME (§12, §18) ─────────────────────── */

function ProgrammeTab({ course }: { course: CourseAdmin }) {
  const { pending, msg, run } = useAdminAction();
  const modules = course.modules;

  function addModule() {
    run(() => createModule(course.id, "Nouveau module"));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...modules];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    run(() => reorderModules(course.id, next.map((m) => m.id)), { silent: true });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-navy">Programme</h2>
          <p className="text-sm text-text-secondary">Organisez les modules, leçons et évaluations. Glissez l'ordre avec les flèches.</p>
        </div>
        <div className="flex items-center gap-3">
          <Feedback msg={msg} />
          <button
            type="button"
            onClick={addModule}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-3.5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <Plus size={15} /> Module
          </button>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/40 px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
            <ListTree size={22} />
          </span>
          <p className="mt-4 font-display font-bold text-navy">Aucun module</p>
          <p className="mt-1 text-sm text-text-secondary">Ajoutez un premier module pour bâtir le programme.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((m, i) => (
            <ModuleEditor
              key={m.id}
              module={m}
              index={i}
              total={modules.length}
              onMove={(dir) => move(i, dir)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleEditor({
  module,
  index,
  total,
  onMove,
}: {
  module: ModuleT;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
}) {
  const [open, setOpen] = React.useState(index === 0);
  const [tab, setTab] = React.useState<"lessons" | "quizzes">("lessons");
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState(module.title);
  const [objectives, setObjectives] = React.useState(arrayToLines(module.objectives));

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
      {/* En-tête accordéon */}
      <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
        <div className="flex shrink-0 flex-col">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="text-text-muted transition-colors hover:text-brand-blue-royal disabled:opacity-30" aria-label="Monter">
            <ChevronUp size={15} />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="text-text-muted transition-colors hover:text-brand-blue-royal disabled:opacity-30" aria-label="Descendre">
            <ChevronDown size={15} />
          </button>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-blue-vif/10 font-display text-sm font-bold text-brand-blue-royal">
          {index + 1}
        </span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <p className="truncate font-semibold text-navy">{module.title}</p>
          <p className="truncate text-xs text-text-muted">
            {module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""} · {module.assessments.length} évaluation{module.assessments.length > 1 ? "s" : ""}
          </p>
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.04]" aria-label={open ? "Replier" : "Déplier"}>
          {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="space-y-4 border-t border-navy/[0.06] bg-surface-secondary/30 p-4">
              {/* Champs du module */}
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldLabel label="Titre du module">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </FieldLabel>
                <FieldLabel label="Objectifs du module" hint="Une ligne par objectif.">
                  <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} className={cn(textareaClass, "min-h-[64px]")} />
                </FieldLabel>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SaveButton pending={pending} onClick={() => run(() => updateModule(module.id, { title, objectives: linesToArray(objectives) }))}>
                    Enregistrer le module
                  </SaveButton>
                  <Feedback msg={msg} />
                </div>
                <DeleteButton pending={pending} label="Supprimer le module" onConfirm={() => run(() => deleteModule(module.id))} />
              </div>

              {/* Sous-onglets Leçons / Évaluations */}
              <div className="flex gap-1 rounded-xl bg-navy/[0.04] p-1">
                {(["lessons", "quizzes"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      tab === t ? "bg-surface-primary text-brand-blue-royal shadow-sm" : "text-text-secondary hover:text-navy",
                    )}
                  >
                    {t === "lessons" ? <BookOpen size={13} /> : <ClipboardList size={13} />}
                    {t === "lessons" ? "Leçons" : "Évaluations"}
                  </button>
                ))}
              </div>

              {tab === "lessons" ? <LessonsSection module={module} /> : <AssessmentsSection module={module} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonsSection({ module }: { module: ModuleT }) {
  const { pending, run } = useAdminAction();
  const lessons = module.lessons;

  function move(index: number, dir: -1 | 1) {
    const next = [...lessons];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    run(() => reorderLessons(module.id, next.map((l) => l.id)), { silent: true });
  }

  return (
    <div className="space-y-2.5">
      {lessons.map((l, i) => (
        <LessonEditor key={l.id} lesson={l} index={i} total={lessons.length} onMove={(dir) => move(i, dir)} />
      ))}
      <button
        type="button"
        onClick={() => run(() => createLesson(module.id, "Nouvelle leçon"))}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-navy/15 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal disabled:opacity-60"
      >
        <Plus size={15} /> Ajouter une leçon
      </button>
    </div>
  );
}

/* Champs affichés selon le type de leçon (§12.2). Chaque type a son éditeur :
   un champ PRIMAIRE (vidéo / fichier / lien) + un champ markdown secondaire
   au libellé contextuel (notes, consignes, transcription…). */
type LessonFieldConfig = {
  primary: "video" | "file" | "external" | null;
  fileAccept?: string;
  fileHint?: string;
  fileIcon?: React.ComponentType<{ size?: number | string; className?: string }>;
  externalLabel?: string;
  externalHint?: string;
  schedule?: boolean;
  contentLabel: string;
  contentHint?: string;
};

const LESSON_FIELDS: Record<string, LessonFieldConfig> = {
  TEXT: { primary: null, contentLabel: "Contenu du cours (markdown)", contentHint: "Titres ##, listes, **gras**, blocs de code, citations…" },
  CASE_STUDY: { primary: null, contentLabel: "Étude de cas (markdown)", contentHint: "Contexte, problématique, questions de réflexion." },
  WORKSHOP: { primary: null, contentLabel: "Consignes de l'atelier (markdown)", contentHint: "Étapes à réaliser, livrable attendu, critères de réussite." },
  LAB: { primary: null, contentLabel: "Protocole du laboratoire (markdown)", contentHint: "Manipulations à effectuer, environnement, résultats attendus." },
  VIDEO: { primary: "video", contentLabel: "Notes / transcription (facultatif)" },
  DEMO: { primary: "video", contentLabel: "Notes de la démonstration (facultatif)", contentHint: "Étapes montrées, points d'attention." },
  AUDIO: { primary: "file", fileAccept: "audio/*", fileHint: "MP3, WAV, M4A, OGG… — 100 Mo max", fileIcon: Headphones, contentLabel: "Transcription / notes (facultatif)" },
  PDF: { primary: "file", fileAccept: ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx", fileHint: "PDF, Word, Excel, TXT… — 100 Mo max", fileIcon: FileText, contentLabel: "Description / consignes (facultatif)" },
  PRESENTATION: { primary: "file", fileAccept: ".pdf,.ppt,.pptx", fileHint: "PDF ou PowerPoint — 100 Mo max (ou collez un lien Google Slides / Canva).", fileIcon: Presentation, contentLabel: "Notes de présentation (facultatif)" },
  INTERACTIVE: { primary: "external", externalLabel: "URL de la ressource interactive", externalHint: "H5P, Genially, Figma, CodePen… — intégrée en iframe.", contentLabel: "Consignes (facultatif)" },
  EXTERNAL_LINK: { primary: "external", externalLabel: "URL du lien externe", externalHint: "Article, documentation, outil en ligne à consulter.", contentLabel: "Description (facultatif)" },
  VIRTUAL_CLASS: { primary: "external", externalLabel: "Lien de la salle virtuelle", externalHint: "Zoom, Google Meet, Microsoft Teams…", schedule: true, contentLabel: "Ordre du jour (facultatif)" },
};

const LESSON_PRIMARY_ICON: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  VIDEO: PlayCircle, DEMO: PlayCircle, AUDIO: Headphones, PDF: FileText,
  PRESENTATION: Presentation, INTERACTIVE: Link2, EXTERNAL_LINK: Link2, VIRTUAL_CLASS: Video,
};

/** Date stockée (Date | ISO) → valeur d'un <input type="datetime-local"> (heure locale). */
function toDatetimeLocal(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function LessonEditor({ lesson, index, total, onMove }: { lesson: LessonT; index: number; total: number; onMove: (dir: -1 | 1) => void }) {
  const [open, setOpen] = React.useState(false);
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState(lesson.title);
  const [lessonType, setLessonType] = React.useState(lesson.lessonType);
  const [content, setContent] = React.useState(lesson.content ?? "");
  const [videoUrl, setVideoUrl] = React.useState(lesson.videoUrl ?? "");
  const [fileUrl, setFileUrl] = React.useState<string | null>(lesson.fileUrl ?? null);
  const [externalUrl, setExternalUrl] = React.useState(lesson.externalUrl ?? "");
  const [scheduledAt, setScheduledAt] = React.useState(toDatetimeLocal(lesson.scheduledAt));
  const [duration, setDuration] = React.useState(lesson.durationMinutes?.toString() ?? "");
  const [isPreview, setIsPreview] = React.useState(lesson.isPreview);
  const [isRequired, setIsRequired] = React.useState(lesson.isRequired);

  const cfg = LESSON_FIELDS[lessonType] ?? LESSON_FIELDS.TEXT;

  function save() {
    run(() =>
      updateLesson(lesson.id, {
        title,
        lessonType,
        content,
        videoUrl: videoUrl.trim() ? videoUrl : "",
        fileUrl: fileUrl?.trim() ? fileUrl : "",
        externalUrl: externalUrl.trim() ? externalUrl : "",
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : "",
        durationMinutes: duration.trim() ? Number(duration) : null,
        isPreview,
        isRequired,
      }),
    );
  }

  return (
    <div className="rounded-xl border border-navy/[0.08] bg-surface-primary">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div className="flex shrink-0 flex-col">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="text-text-muted hover:text-brand-blue-royal disabled:opacity-30" aria-label="Monter"><ChevronUp size={13} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="text-text-muted hover:text-brand-blue-royal disabled:opacity-30" aria-label="Descendre"><ChevronDown size={13} /></button>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="rounded-md bg-navy/[0.05] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
            {LESSON_TYPE_LABEL[lessonType] ?? lessonType}
          </span>
          <span className="truncate text-sm font-medium text-navy">{lesson.title}</span>
          {lesson.isPreview && <Eye size={12} className="shrink-0 text-brand-blue-royal" />}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-text-muted hover:bg-navy/[0.04]" aria-label={open ? "Replier" : "Déplier"}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-navy/[0.06] p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldLabel label="Titre">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </FieldLabel>
                <FieldLabel label="Type de leçon">
                  <Select
                    value={lessonType}
                    onChange={(v) => setLessonType(v as typeof lessonType)}
                    options={Object.keys(LESSON_TYPE_LABEL).map((k) => ({ value: k, label: LESSON_TYPE_LABEL[k] }))}
                  />
                </FieldLabel>
              </div>

              {/* ── Champ PRIMAIRE selon le type ── */}
              {cfg.primary === "video" && (
                <FieldLabel label="Vidéo de la leçon" hint="YouTube, Vimeo ou fichier .mp4 — intégrée dans le lecteur.">
                  <div className="relative">
                    <PlayCircle size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue-royal" />
                    <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={cn(inputClass, "pl-9")} placeholder="https://www.youtube.com/watch?v=…" />
                  </div>
                </FieldLabel>
              )}

              {cfg.primary === "file" && (
                <FieldLabel label={lessonType === "AUDIO" ? "Fichier audio" : lessonType === "PRESENTATION" ? "Présentation" : "Document"}>
                  <FileUpload
                    value={fileUrl}
                    onChange={setFileUrl}
                    accept={cfg.fileAccept}
                    hint={cfg.fileHint}
                    icon={cfg.fileIcon}
                    folder="lessons"
                  />
                </FieldLabel>
              )}

              {cfg.primary === "external" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldLabel label={cfg.externalLabel ?? "URL"} hint={cfg.externalHint} className={cfg.schedule ? undefined : "sm:col-span-2"}>
                    <div className="relative">
                      {React.createElement(LESSON_PRIMARY_ICON[lessonType] ?? Link2, {
                        size: 15,
                        className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue-royal",
                      })}
                      <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={cn(inputClass, "pl-9")} placeholder="https://…" />
                    </div>
                  </FieldLabel>
                  {cfg.schedule && (
                    <FieldLabel label="Date et heure de la session" hint="Fuseau local. Affiché à l'apprenant.">
                      <div className="relative">
                        <Calendar size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-violet" />
                        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={cn(inputClass, "pl-9")} />
                      </div>
                    </FieldLabel>
                  )}
                </div>
              )}

              {/* ── Champ markdown secondaire (libellé contextuel) ── */}
              <FieldLabel label={cfg.contentLabel} hint={cfg.contentHint}>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} className={cn(textareaClass, "min-h-[120px] font-mono text-xs")} />
              </FieldLabel>

              <div className="grid gap-3 sm:grid-cols-2">
                <FieldLabel label="Durée (minutes)">
                  <input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} />
                </FieldLabel>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <ToggleRow label="Aperçu gratuit" checked={isPreview} onChange={setIsPreview} />
                  <ToggleRow label="Obligatoire (compte dans la progression)" checked={isRequired} onChange={setIsRequired} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <SaveButton pending={pending} onClick={save}>Enregistrer</SaveButton>
                  <Feedback msg={msg} />
                </div>
                <DeleteButton pending={pending} compact label="Supprimer la leçon" onConfirm={() => run(() => deleteLesson(lesson.id))} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssessmentsSection({ module }: { module: ModuleT }) {
  const { pending, run } = useAdminAction();
  return (
    <div className="space-y-2.5">
      {module.assessments.map((a) => (
        <AssessmentEditor key={a.id} assessment={a} />
      ))}
      <button
        type="button"
        onClick={() => run(() => createAssessment(module.id, "Nouvelle évaluation"))}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-navy/15 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal disabled:opacity-60"
      >
        <Plus size={15} /> Ajouter une évaluation
      </button>
    </div>
  );
}

function AssessmentEditor({ assessment }: { assessment: AssessmentT }) {
  const [open, setOpen] = React.useState(false);
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState(assessment.title);
  const [passingScore, setPassingScore] = React.useState(assessment.passingScore.toString());
  const [attempts, setAttempts] = React.useState(assessment.attemptsAllowed.toString());

  return (
    <div className="rounded-xl border border-brand-violet/15 bg-brand-violet/[0.03]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <ClipboardList size={16} className="shrink-0 text-brand-violet" />
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="truncate text-sm font-semibold text-navy">{assessment.title}</span>
          <span className="rounded-full bg-brand-violet/10 px-2 py-0.5 text-[10px] font-semibold text-brand-violet">
            {assessment._count.questions} question{assessment._count.questions > 1 ? "s" : ""}
          </span>
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-text-muted hover:bg-navy/[0.04]" aria-label={open ? "Replier" : "Déplier"}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-brand-violet/10 p-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldLabel label="Titre" className="sm:col-span-3">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </FieldLabel>
                <FieldLabel label="Seuil de réussite (%)">
                  <input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} className={inputClass} />
                </FieldLabel>
                <FieldLabel label="Tentatives" hint="0 = illimité.">
                  <input type="number" min={0} value={attempts} onChange={(e) => setAttempts(e.target.value)} className={inputClass} />
                </FieldLabel>
                <div className="flex items-end">
                  <SaveButton pending={pending} onClick={() => run(() => updateAssessment(assessment.id, { title, passingScore: Number(passingScore) || 0, attemptsAllowed: Number(attempts) || 0 }))}>
                    Enregistrer
                  </SaveButton>
                </div>
              </div>
              <Feedback msg={msg} />

              {/* Questions */}
              <div className="space-y-2 border-t border-brand-violet/10 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Questions</p>
                {assessment.questions.map((q, i) => (
                  <QuestionEditor key={q.id} question={q} index={i} />
                ))}
                <AddQuestionButton assessmentId={assessment.id} />
              </div>

              <div className="flex justify-end border-t border-brand-violet/10 pt-3">
                <DeleteButton pending={pending} label="Supprimer l'évaluation" onConfirm={() => run(() => deleteAssessment(assessment.id))} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddQuestionButton({ assessmentId }: { assessmentId: string }) {
  const { pending, run } = useAdminAction();
  return (
    <button
      type="button"
      onClick={() => run(() => createQuestion(assessmentId, { type: "SINGLE_CHOICE", question: "Nouvelle question", options: ["Option 1", "Option 2"], correctAnswer: 0 }))}
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-violet/25 py-2 text-xs font-semibold text-brand-violet transition-colors hover:bg-brand-violet/[0.06] disabled:opacity-60"
    >
      <Plus size={13} /> Ajouter une question
    </button>
  );
}

type QType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING" | "ORDERING";

const ALL_Q_TYPES: QType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING", "ORDERING"];

function QuestionEditor({ question, index }: { question: QuestionT; index: number }) {
  const { pending, msg, run } = useAdminAction();
  const initialType = (ALL_Q_TYPES.includes(question.type as QType) ? question.type : "SINGLE_CHOICE") as QType;
  const [type, setType] = React.useState<QType>(initialType);
  const [text, setText] = React.useState(question.question);

  // Encodage stocké relu à l'initialisation : options = string[] (choix / ordre)
  // OU { left, right } (appariement) ; correctAnswer selon le type (§5).
  const rawOptions = question.options as unknown;
  const rawAnswer = question.correctAnswer as unknown;
  const asStrings = (v: unknown): string[] | null =>
    Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : null;
  const matchingRaw =
    rawOptions && typeof rawOptions === "object" && !Array.isArray(rawOptions) && "left" in rawOptions && "right" in rawOptions
      ? (rawOptions as { left: unknown; right: unknown })
      : null;
  const rawStringOptions = asStrings(rawOptions);
  const initLeft = (matchingRaw && asStrings(matchingRaw.left)) || ["Élément 1", "Élément 2"];
  const initRight = (matchingRaw && asStrings(matchingRaw.right)) || ["Correspondance 1", "Correspondance 2"];

  // Choix unique / multiple
  const [options, setOptions] = React.useState<string[]>(() =>
    rawStringOptions && rawStringOptions.length ? rawStringOptions : ["Option 1", "Option 2"],
  );
  const [single, setSingle] = React.useState<number>(() => (typeof rawAnswer === "number" ? (rawAnswer as number) : 0));
  const [multi, setMulti] = React.useState<number[]>(() =>
    Array.isArray(rawAnswer) ? (rawAnswer.filter((x) => typeof x === "number") as number[]) : [],
  );
  const [tf, setTf] = React.useState<boolean>(() => rawAnswer === true);

  // Réponse courte : liste de réponses acceptées.
  const [accepted, setAccepted] = React.useState<string[]>(() =>
    Array.isArray(rawAnswer) && rawAnswer.length > 0 && rawAnswer.every((v) => typeof v === "string")
      ? (rawAnswer as string[])
      : [""],
  );

  // Appariement : colonnes left/right (même longueur) + pairs[i] = index dans right.
  const [left, setLeft] = React.useState<string[]>(() => initLeft);
  const [right, setRight] = React.useState<string[]>(() => initRight);
  const [pairs, setPairs] = React.useState<number[]>(() =>
    Array.isArray(rawAnswer) &&
    rawAnswer.length === initLeft.length &&
    rawAnswer.every((n) => typeof n === "number" && n >= 0 && n < initRight.length)
      ? (rawAnswer as number[])
      : initLeft.map(() => 0),
  );

  // Ordonnancement : éléments saisis dans l'ordre correct.
  const [orderItems, setOrderItems] = React.useState<string[]>(() =>
    rawStringOptions && rawStringOptions.length >= 2 ? rawStringOptions : ["Élément 1", "Élément 2"],
  );

  const [explanation, setExplanation] = React.useState(question.explanation ?? "");
  const [points, setPoints] = React.useState(question.points.toString());

  function setOption(i: number, v: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  }
  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    setSingle((s) => (s === i ? 0 : s > i ? s - 1 : s));
    setMulti((m) => m.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
  }

  // Réponse courte
  function setAcceptedAt(i: number, v: string) {
    setAccepted((prev) => prev.map((a, idx) => (idx === i ? v : a)));
  }
  function addAccepted() {
    setAccepted((prev) => [...prev, ""]);
  }
  function removeAccepted(i: number) {
    setAccepted((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  // Appariement — une paire par ligne : left/right grandissent ensemble (invariant left.length === right.length === pairs.length).
  function setLeftAt(i: number, v: string) {
    setLeft((prev) => prev.map((l, idx) => (idx === i ? v : l)));
  }
  function setRightAt(i: number, v: string) {
    setRight((prev) => prev.map((r, idx) => (idx === i ? v : r)));
  }
  function setPairAt(i: number, v: number) {
    setPairs((prev) => prev.map((p, idx) => (idx === i ? v : p)));
  }
  function addPairRow() {
    const n = left.length;
    setLeft([...left, `Élément ${n + 1}`]);
    setRight([...right, `Correspondance ${n + 1}`]);
    setPairs([...pairs, n]); // par défaut, la nouvelle ligne s'apparie à sa propre correspondance.
  }
  function removePairRow(j: number) {
    if (left.length <= 2) return;
    setLeft(left.filter((_, i) => i !== j));
    setRight(right.filter((_, i) => i !== j));
    setPairs(pairs.filter((_, i) => i !== j).map((p) => (p === j ? 0 : p > j ? p - 1 : p)));
  }

  // Ordonnancement
  function setOrderItemAt(i: number, v: string) {
    setOrderItems((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  }
  function addOrderItem() {
    setOrderItems((prev) => [...prev, `Élément ${prev.length + 1}`]);
  }
  function removeOrderItem(i: number) {
    setOrderItems((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));
  }
  function moveOrderItem(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= orderItems.length) return;
    const next = [...orderItems];
    [next[i], next[target]] = [next[target], next[i]];
    setOrderItems(next);
  }

  function save() {
    const base = { question: text.trim(), explanation, points: Number(points) || 1 };
    const input: QuestionInput =
      type === "TRUE_FALSE"
        ? { type, correctAnswer: tf, ...base }
        : type === "SHORT_ANSWER"
          ? { type, correctAnswer: accepted.map((a) => a.trim()).filter(Boolean), ...base }
          : type === "MATCHING"
            ? {
                type,
                options: { left: left.map((l) => l.trim()), right: right.map((r) => r.trim()) },
                correctAnswer: pairs,
                ...base,
              }
            : type === "ORDERING"
              ? // ORDERING : l'ordre de saisie EST l'ordre correct — on omet correctAnswer (§5).
                { type, options: orderItems.map((o) => o.trim()).filter(Boolean), ...base }
              : type === "SINGLE_CHOICE"
                ? { type, options: options.map((o) => o.trim()), correctAnswer: single, ...base }
                : { type, options: options.map((o) => o.trim()), correctAnswer: multi, ...base };
    run(() => updateQuestion(question.id, input));
  }

  return (
    <div className="rounded-lg border border-navy/[0.08] bg-surface-primary p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-violet/10 text-xs font-bold text-brand-violet">{index + 1}</span>
        <HelpCircle size={14} className="text-text-muted" />
        <div className="ml-auto w-44">
          <Select
            value={type}
            onChange={(v) => setType(v as QType)}
            ariaLabel="Type de question"
            options={[
              { value: "SINGLE_CHOICE", label: "Choix unique" },
              { value: "MULTIPLE_CHOICE", label: "Choix multiple" },
              { value: "TRUE_FALSE", label: "Vrai / Faux" },
              { value: "SHORT_ANSWER", label: "Réponse courte" },
              { value: "MATCHING", label: "Appariement" },
              { value: "ORDERING", label: "Ordonnancement" },
            ]}
            buttonClassName="py-1.5 text-xs"
          />
        </div>
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} className={cn(textareaClass, "min-h-[52px]")} placeholder="Énoncé de la question" />

      {type === "TRUE_FALSE" ? (
        <div className="mt-2 flex gap-2">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setTf(val)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                tf === val ? "border-success/40 bg-success/10 text-success" : "border-navy/10 text-text-secondary hover:border-navy/20",
              )}
            >
              {val ? "Vrai" : "Faux"}
            </button>
          ))}
        </div>
      ) : type === "SHORT_ANSWER" ? (
        <div className="mt-2 space-y-2">
          {accepted.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-success/10 text-success" aria-hidden>
                <CheckCircle2 size={13} />
              </span>
              <input
                value={ans}
                onChange={(e) => setAcceptedAt(i, e.target.value)}
                className={cn(inputClass, "py-1.5")}
                placeholder={`Réponse acceptée ${i + 1}`}
                aria-label={`Réponse acceptée ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeAccepted(i)}
                disabled={accepted.length <= 1}
                className="shrink-0 text-text-muted transition-colors hover:text-error disabled:opacity-30"
                aria-label="Retirer la réponse acceptée"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAccepted}
            className="text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            + Ajouter une réponse acceptée
          </button>
          <p className="text-xs text-text-muted">Toute réponse équivalente (casse/accents ignorés) sera acceptée.</p>
        </div>
      ) : type === "MATCHING" ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-text-muted">
            Renseignez chaque paire, puis indiquez la bonne correspondance. Les colonnes sont mélangées pour l'apprenant.
          </p>
          {left.map((l, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-navy/[0.08] bg-surface-secondary/40 p-2">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-violet/10 text-xs font-bold text-brand-violet">
                  {i + 1}
                </span>
                <input
                  value={l}
                  onChange={(e) => setLeftAt(i, e.target.value)}
                  className={cn(inputClass, "py-1.5")}
                  placeholder={`Élément ${i + 1}`}
                  aria-label={`Élément de gauche ${i + 1}`}
                />
                <span className="shrink-0 text-text-muted" aria-hidden>
                  ↔
                </span>
                <input
                  value={right[i] ?? ""}
                  onChange={(e) => setRightAt(i, e.target.value)}
                  className={cn(inputClass, "py-1.5")}
                  placeholder={`Correspondance ${i + 1}`}
                  aria-label={`Élément de droite ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removePairRow(i)}
                  disabled={left.length <= 2}
                  className="shrink-0 text-text-muted transition-colors hover:text-error disabled:opacity-30"
                  aria-label="Retirer la paire"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
              <div className="flex items-center gap-2 pl-8">
                <span className="shrink-0 text-xs font-medium text-text-secondary">Bonne correspondance :</span>
                <div className="w-48">
                  <Select
                    value={String(pairs[i] ?? 0)}
                    onChange={(v) => setPairAt(i, Number(v))}
                    ariaLabel={`Bonne correspondance pour l'élément ${i + 1}`}
                    options={right.map((r, idx) => ({ value: String(idx), label: r.trim() || `Correspondance ${idx + 1}` }))}
                    buttonClassName="py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPairRow}
            disabled={left.length >= 10}
            className="text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet disabled:opacity-40"
          >
            + Ajouter une paire
          </button>
        </div>
      ) : type === "ORDERING" ? (
        <div className="mt-2 space-y-2">
          {orderItems.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-blue-vif/10 text-xs font-bold text-brand-blue-royal">
                {i + 1}
              </span>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => moveOrderItem(i, -1)}
                  disabled={i === 0}
                  className="text-text-muted transition-colors hover:text-brand-blue-royal disabled:opacity-30"
                  aria-label="Monter l'élément"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrderItem(i, 1)}
                  disabled={i === orderItems.length - 1}
                  className="text-text-muted transition-colors hover:text-brand-blue-royal disabled:opacity-30"
                  aria-label="Descendre l'élément"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
              <input
                value={it}
                onChange={(e) => setOrderItemAt(i, e.target.value)}
                className={cn(inputClass, "py-1.5")}
                placeholder={`Élément ${i + 1}`}
                aria-label={`Élément ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOrderItem(i)}
                disabled={orderItems.length <= 2}
                className="shrink-0 text-text-muted transition-colors hover:text-error disabled:opacity-30"
                aria-label="Retirer l'élément"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOrderItem}
            disabled={orderItems.length >= 12}
            className="text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet disabled:opacity-40"
          >
            + Ajouter un élément
          </button>
          <p className="text-xs text-text-muted">Saisissez les éléments dans l'ordre correct ; ils seront mélangés pour l'apprenant.</p>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {options.map((opt, i) => {
            const correct = type === "SINGLE_CHOICE" ? single === i : multi.includes(i);
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (type === "SINGLE_CHOICE") setSingle(i);
                    else setMulti((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
                  }}
                  aria-label="Marquer comme bonne réponse"
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center border transition-colors",
                    type === "SINGLE_CHOICE" ? "rounded-full" : "rounded-md",
                    correct ? "border-transparent bg-success text-white" : "border-navy/20 text-transparent hover:border-success/40",
                  )}
                >
                  <CheckCircle2 size={13} />
                </button>
                <input value={opt} onChange={(e) => setOption(i, e.target.value)} className={cn(inputClass, "py-1.5")} />
                <button type="button" onClick={() => removeOption(i)} disabled={options.length <= 2} className="shrink-0 text-text-muted transition-colors hover:text-error disabled:opacity-30" aria-label="Retirer l'option">
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setOptions((prev) => [...prev, `Option ${prev.length + 1}`])}
            disabled={options.length >= 12}
            className="text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet disabled:opacity-40"
          >
            + Ajouter une option
          </button>
        </div>
      )}

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input value={explanation} onChange={(e) => setExplanation(e.target.value)} className={cn(inputClass, "py-1.5")} placeholder="Explication (optionnelle)" />
        <input type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} className={cn(inputClass, "w-20 py-1.5")} aria-label="Points" title="Points" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SaveButton pending={pending} onClick={save} className="px-3 py-1.5 text-xs">Enregistrer</SaveButton>
          <Feedback msg={msg} />
        </div>
        <DeleteButton pending={pending} compact label="Supprimer" onConfirm={() => run(() => deleteQuestion(question.id))} />
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 text-left">
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-gradient-da" : "bg-navy/15")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </span>
      <span className="text-xs font-medium text-navy">{label}</span>
    </button>
  );
}

/* ──────────────────── Onglet RATTACHEMENTS (§14, §43.1) ───────────────────── */

/* ──────────────────── Onglet COMPÉTENCES (§21) ───────────────────────────── */

function CompetencesTab({
  course,
  skillOptions,
  isAdmin,
}: {
  course: CourseAdmin;
  skillOptions: SkillPickerOption[];
  isAdmin: boolean;
}) {
  const { pending, msg, run } = useAdminAction();
  const attached = course.skills;
  const attachedIds = new Set(attached.map((s) => s.skillId));
  const available = skillOptions.filter((o) => !attachedIds.has(o.id));
  const [pick, setPick] = React.useState("");

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-navy">Compétences visées</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Rattachez des compétences du référentiel à cette formation, avec le niveau visé. Les compétences{" "}
          <strong>primaires</strong> sont mises en avant sur la fiche ; une formation validée les crédite au passeport
          de l&apos;apprenant.
        </p>
      </div>

      {/* Ajouter une compétence */}
      <div className="flex flex-col gap-2 rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold text-navy">Ajouter une compétence</p>
          <Select
            value={pick}
            onChange={setPick}
            options={[
              { value: "", label: available.length ? "Choisir une compétence…" : "Toutes rattachées (ou référentiel vide)" },
              ...available.map((o) => ({ value: o.id, label: o.domain ? `${o.name} · ${o.domain}` : o.name })),
            ]}
            buttonClassName="py-2"
          />
        </div>
        <button
          type="button"
          disabled={pending || !pick}
          onClick={() => {
            const id = pick;
            setPick("");
            run(() => setCourseSkill(course.id, id, "OPERATIONAL", false));
          }}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} /> Rattacher
        </button>
      </div>

      {available.length === 0 && attached.length === 0 && (
        <p className="text-xs text-text-muted">
          {isAdmin ? (
            <>
              Le référentiel est vide. Créez des compétences dans{" "}
              <Link href="/admin/competences" className="font-semibold text-brand-blue-royal hover:underline">
                Admin · Compétences
              </Link>
              .
            </>
          ) : (
            <>Le référentiel de compétences est vide. Demandez à un administrateur d&apos;en créer avant de pouvoir les rattacher.</>
          )}
        </p>
      )}

      {/* Liste des compétences rattachées */}
      {attached.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy/15 px-4 py-6 text-center text-sm text-text-muted">
          Aucune compétence rattachée pour l&apos;instant.
        </p>
      ) : (
        <ul className="space-y-2">
          {attached.map((cs) => (
            <li
              key={cs.skillId}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-surface-primary p-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-navy">{cs.skill.name}</span>
                {cs.skill.domain && <span className="block truncate text-xs text-text-muted">{cs.skill.domain}</span>}
              </span>
              <div className="w-36 shrink-0">
                <Select
                  value={cs.targetLevel}
                  onChange={(v) => run(() => setCourseSkill(course.id, cs.skillId, v as (typeof SKILL_LEVELS)[number], cs.isPrimary))}
                  options={SKILL_LEVELS.map((l) => ({ value: l, label: SKILL_LEVEL_LABEL[l] }))}
                  buttonClassName="py-1.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => run(() => setCourseSkill(course.id, cs.skillId, cs.targetLevel as (typeof SKILL_LEVELS)[number], !cs.isPrimary))}
                aria-pressed={cs.isPrimary}
                title={cs.isPrimary ? "Compétence primaire" : "Marquer comme primaire"}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  cs.isPrimary
                    ? "border-transparent bg-gradient-da text-white shadow-brand"
                    : "border-navy/15 text-text-secondary hover:border-brand-blue-vif/40 hover:text-brand-blue-royal",
                )}
              >
                <Star size={13} className={cs.isPrimary ? "fill-current" : ""} aria-hidden />
                Primaire
              </button>
              <button
                type="button"
                onClick={() => run(() => removeCourseSkill(course.id, cs.skillId))}
                aria-label={`Détacher ${cs.skill.name}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Feedback msg={msg} />
    </div>
  );
}

function RattachementsTab({ course, schools }: { course: CourseAdmin; schools: { id: string; name: string; color: string }[] }) {
  const { pending, msg, run } = useAdminAction();
  const attached = new Map(course.schools.map((sc) => [sc.school.id, sc]));

  function toggle(schoolId: string) {
    if (attached.has(schoolId)) run(() => detachCourseFromSchool(schoolId, course.id));
    else run(() => attachCourseToSchool({ schoolId, courseId: course.id }));
  }
  function setPrimary(schoolId: string) {
    run(() => attachCourseToSchool({ schoolId, courseId: course.id, isPrimary: true }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-navy">Écoles</h2>
          <Feedback msg={msg} />
        </div>
        <p className="mb-4 text-sm text-text-secondary">
          Rattachez cette formation à une ou plusieurs écoles. Une seule peut être <strong>principale</strong> (elle porte l'identité affichée).
        </p>
        {schools.length === 0 ? (
          <p className="text-sm text-text-muted">Aucune école. Créez-en d'abord dans la section Écoles.</p>
        ) : (
          <div className="space-y-2">
            {schools.map((s) => {
              const link = attached.get(s.id);
              const isAttached = !!link;
              const isPrimary = link?.isPrimary ?? false;
              return (
                <div key={s.id} className={cn("flex items-center gap-3 rounded-xl border p-3 transition-colors", isAttached ? "border-brand-blue-vif/30 bg-brand-blue-vif/[0.04]" : "border-navy/[0.08]")}>
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    disabled={pending}
                    aria-label={isAttached ? "Détacher" : "Rattacher"}
                    className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors", isAttached ? "border-transparent bg-gradient-da text-white" : "border-navy/20 text-transparent")}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{s.name}</span>
                  {isAttached && (
                    <button
                      type="button"
                      onClick={() => setPrimary(s.id)}
                      disabled={pending || isPrimary}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                        isPrimary ? "bg-gradient-da text-white" : "border border-navy/10 text-text-secondary hover:border-brand-blue-vif/40 hover:text-brand-blue-royal",
                      )}
                    >
                      <Star size={11} className={isPrimary ? "fill-white" : ""} />
                      {isPrimary ? "Principale" : "Définir principale"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-1 font-display text-base font-bold text-navy">Parcours d'appartenance</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Parcours métiers qui réutilisent cette formation (lecture seule — la composition se gère depuis chaque parcours).
        </p>
        {course.careerPaths.length === 0 ? (
          <p className="text-sm text-text-muted">Cette formation n'est utilisée dans aucun parcours pour l'instant.</p>
        ) : (
          <ul className="space-y-2">
            {course.careerPaths.map((cp) => (
              <li key={cp.careerPath.id}>
                <Link
                  href={`/admin/parcours/${cp.careerPath.id}`}
                  className="flex items-center gap-2 rounded-xl border border-navy/[0.08] p-3 text-sm font-semibold text-navy transition-colors hover:border-brand-violet/30 hover:text-brand-violet"
                >
                  <Link2 size={14} className="text-brand-violet" />
                  <span className="truncate">{cp.careerPath.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ──────────────────── Onglet PUBLICATION (workflow §31) ───────────────────── */

const NEXT_STATUS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["REVIEW", "ARCHIVED"],
  REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["PUBLISHED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

const STATUS_HINT: Record<ContentStatus, string> = {
  DRAFT: "Brouillon en cours de rédaction. Invisible du catalogue.",
  REVIEW: "Soumise à la relecture pédagogique.",
  APPROVED: "Validée, prête à être publiée.",
  SCHEDULED: "Publication programmée.",
  PUBLISHED: "Visible et accessible au catalogue.",
  SUSPENDED: "Temporairement retirée du catalogue.",
  ARCHIVED: "Archivée — conservée mais retirée.",
};

function PublicationTab({
  course,
  onGoto,
  canManageSchools,
  canPublish,
}: {
  course: CourseAdmin;
  onGoto: (t: Tab) => void;
  canManageSchools: boolean;
  canPublish: boolean;
}) {
  const { pending, msg, run } = useAdminAction();
  const lessonsCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const hasModule = course.modules.length >= 1;
  const hasLesson = lessonsCount >= 1;
  const ready = hasModule && hasLesson;
  const targets = NEXT_STATUS[course.status] ?? [];
  // Formateur : une formation en brouillon, à revoir ou refusée peut être (re)soumise.
  const canSubmit = ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(course.status);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-1 font-display text-base font-bold text-navy">Statut de publication</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Statut actuel : <StatusPill label={CONTENT_STATUS_LABEL[course.status]} tone={CONTENT_STATUS_TONE[course.status]} /> — {STATUS_HINT[course.status]}
          </p>

          {canPublish ? (
            <div className="flex flex-wrap items-center gap-2">
              {targets.length === 0 && <p className="text-sm text-text-muted">Aucune transition disponible.</p>}
              {targets.map((target) => {
                const publishing = target === "PUBLISHED";
                const blocked = publishing && !ready;
                return (
                  <button
                    key={target}
                    type="button"
                    disabled={pending || blocked}
                    onClick={() => run(() => setCourseStatus(course.id, target))}
                    title={blocked ? "Publier exige au moins 1 module et 1 leçon." : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50",
                      publishing ? "bg-gradient-da text-white shadow-brand" : "border border-navy/10 text-navy hover:border-brand-blue-vif/40",
                    )}
                  >
                    <Rocket size={14} />
                    {target === "REVIEW" && "Soumettre à la revue"}
                    {target === "APPROVED" && "Approuver"}
                    {target === "PUBLISHED" && "Publier"}
                    {target === "SUSPENDED" && "Suspendre"}
                    {target === "ARCHIVED" && "Archiver"}
                    {target === "DRAFT" && "Repasser en brouillon"}
                  </button>
                );
              })}
            </div>
          ) : canSubmit ? (
            <button
              type="button"
              disabled={pending || !ready}
              onClick={() => run(() => submitCourseForReview(course.id))}
              title={!ready ? "La soumission exige au moins 1 module et 1 leçon." : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Rocket size={14} />
              Soumettre à validation
            </button>
          ) : (
            <p className="text-sm text-text-muted">
              {course.status === "REVIEW"
                ? "En attente de validation par l'administration pédagogique."
                : "Cette formation est gérée par l'administration."}
            </p>
          )}
          <div className="mt-3"><Feedback msg={msg} /></div>
        </div>
      </div>

      {/* Garde-fous */}
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-3 font-display text-base font-bold text-navy">
          <GradientText>{canPublish ? "Prêt à publier ?" : "Prêt à soumettre ?"}</GradientText>
        </h2>
        <ul className="space-y-2.5 text-sm">
          <Check ok={course.title.trim().length >= 3} label="Titre renseigné" />
          <Check ok={hasModule} label="Au moins un module" onFix={() => onGoto("programme")} />
          <Check ok={hasLesson} label="Au moins une leçon" onFix={() => onGoto("programme")} />
          {canManageSchools && (
            <Check ok={course.schools.length > 0} label="Rattachée à une école" onFix={() => onGoto("rattachements")} />
          )}
        </ul>
        {!ready && (
          <p className="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-[#b45309]">
            {canPublish ? "La publication" : "La soumission"} exige au moins un module et une leçon.
          </p>
        )}
      </div>
    </div>
  );
}

function Check({ ok, label, onFix }: { ok: boolean; label: string; onFix?: () => void }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", ok ? "bg-success/15 text-success" : "bg-warning/15 text-[#b45309]")}>
        {ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={12} />}
      </span>
      <span className={cn("flex-1 text-sm", ok ? "text-navy" : "text-text-secondary")}>{label}</span>
      {!ok && onFix && (
        <button type="button" onClick={onFix} className="text-xs font-semibold text-brand-blue-royal hover:text-brand-violet">
          Compléter
        </button>
      )}
    </li>
  );
}
