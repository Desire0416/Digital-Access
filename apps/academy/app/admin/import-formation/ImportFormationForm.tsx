"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileText, Loader2, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  ChevronDown, Plus, Trash2, BookOpen, ListChecks, GraduationCap, RefreshCw,
} from "lucide-react";
import { Button, cn, formatFCFA } from "@da/ui";
import { Select } from "@/components/Select";
import { createFormationFromImport } from "@/lib/import-actions";
import {
  type ImportDraft, type ImportMeta, type DraftModule, type DraftLesson, type DraftQuestion,
  DRAFT_LEVELS, DRAFT_LESSON_TYPES, DRAFT_QUESTION_TYPES, LEVEL_LABEL_FR, LESSON_TYPE_LABEL_FR, draftStats,
} from "@/lib/import/types";

type Phase = "upload" | "analyzing" | "review" | "done";
type School = { slug: string; name: string };

const QTYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE: "Choix unique",
  MULTIPLE_CHOICE: "Choix multiple",
  TRUE_FALSE: "Vrai / Faux",
};

const input =
  "w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal focus:ring-2 focus:ring-brand-blue-royal/20";

function lines(v: string[]): string {
  return v.join("\n");
}
function parseLines(v: string): string[] {
  return v.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function ImportFormationForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("upload");
  const [draft, setDraft] = React.useState<ImportDraft | null>(null);
  const [meta, setMeta] = React.useState<ImportMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [creating, startCreate] = React.useTransition();
  const [result, setResult] = React.useState<{ slug: string; counts: { modules: number; lessons: number; quizzes: number; questions: number } } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string>("");

  /* ── Analyse du fichier ─────────────────────────────────────────────── */
  async function analyze(file: File) {
    setError(null);
    setFileName(file.name);
    setPhase("analyzing");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import-formation", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.draft) {
        setError(data?.error || "L'analyse a échoué. Réessayez.");
        setPhase("upload");
        return;
      }
      setDraft(data.draft as ImportDraft);
      setMeta(data.meta as ImportMeta);
      setPhase("review");
    } catch {
      setError("Impossible de contacter le serveur d'analyse.");
      setPhase("upload");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) analyze(f);
  }

  /* ── Édition du brouillon ───────────────────────────────────────────── */
  const patchPath = (patch: Partial<ImportDraft["path"]>) =>
    setDraft((d) => (d ? { ...d, path: { ...d.path, ...patch } } : d));
  const patchModule = (mi: number, patch: Partial<DraftModule>) =>
    setDraft((d) => {
      if (!d) return d;
      const modules = d.modules.slice();
      modules[mi] = { ...modules[mi], ...patch };
      return { ...d, modules };
    });
  const patchLesson = (mi: number, li: number, patch: Partial<DraftLesson>) =>
    setDraft((d) => {
      if (!d) return d;
      const modules = d.modules.slice();
      const lessons = modules[mi].lessons.slice();
      lessons[li] = { ...lessons[li], ...patch };
      modules[mi] = { ...modules[mi], lessons };
      return { ...d, modules };
    });
  const removeLesson = (mi: number, li: number) =>
    setDraft((d) => {
      if (!d) return d;
      const modules = d.modules.slice();
      modules[mi] = { ...modules[mi], lessons: modules[mi].lessons.filter((_, i) => i !== li) };
      return { ...d, modules };
    });
  const patchQuestion = (mi: number, qi: number, patch: Partial<DraftQuestion>) =>
    setDraft((d) => {
      if (!d || !d.modules[mi].quiz) return d;
      const modules = d.modules.slice();
      const quiz = { ...modules[mi].quiz! };
      const questions = quiz.questions.slice();
      questions[qi] = { ...questions[qi], ...patch };
      quiz.questions = questions;
      modules[mi] = { ...modules[mi], quiz };
      return { ...d, modules };
    });
  const removeQuestion = (mi: number, qi: number) =>
    setDraft((d) => {
      if (!d || !d.modules[mi].quiz) return d;
      const modules = d.modules.slice();
      const quiz = { ...modules[mi].quiz! };
      quiz.questions = quiz.questions.filter((_, i) => i !== qi);
      modules[mi] = { ...modules[mi], quiz: quiz.questions.length ? quiz : null };
      return { ...d, modules };
    });
  const removeModule = (mi: number) =>
    setDraft((d) => (d ? { ...d, modules: d.modules.filter((_, i) => i !== mi) } : d));

  /* ── Création ───────────────────────────────────────────────────────── */
  function create() {
    if (!draft) return;
    setError(null);
    setFieldErrors({});
    // Contrôle : chaque question de quiz doit être répondable et avoir une bonne réponse marquée.
    for (let mi = 0; mi < draft.modules.length; mi++) {
      const quiz = draft.modules[mi].quiz;
      if (!quiz) continue;
      for (let qi = 0; qi < quiz.questions.length; qi++) {
        const q = quiz.questions[qi];
        const optCount = q.type === "TRUE_FALSE" ? 2 : q.options.length;
        if (q.type !== "TRUE_FALSE" && q.options.length < 2) {
          setError(`Module ${mi + 1}, question ${qi + 1} : au moins 2 options sont requises.`);
          return;
        }
        if (q.correctIndexes.filter((n) => n >= 0 && n < optCount).length === 0) {
          setError(`Module ${mi + 1}, question ${qi + 1} : indiquez la bonne réponse (coche verte).`);
          return;
        }
      }
    }
    startCreate(async () => {
      const res = await createFormationFromImport(draft);
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      setResult({ slug: res.slug, counts: res.counts });
      setPhase("done");
    });
  }

  /* ── Rendu ──────────────────────────────────────────────────────────── */
  if (phase === "done" && result) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-success/25 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/12 text-success"><CheckCircle2 size={34} /></div>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-navy">Formation créée ✅</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          {result.counts.modules} modules · {result.counts.lessons} leçons · {result.counts.quizzes} quiz · {result.counts.questions} questions.
          {draft?.path.publish ? " Elle est publiée et visible au catalogue." : " Elle est en brouillon (publiez-la quand vous le souhaitez)."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href={`/career-paths/${result.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-da px-5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5">
            Voir la formation <ArrowRight size={16} />
          </a>
          <a href="/admin/parcours" className="inline-flex h-11 items-center gap-2 rounded-lg border border-navy/15 px-5 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04]">Gérer les parcours</a>
          <button onClick={() => { setDraft(null); setMeta(null); setResult(null); setFileName(""); setPhase("upload"); }} className="inline-flex h-11 items-center gap-2 rounded-lg border border-navy/15 px-5 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04]">
            <RefreshCw size={15} /> Importer une autre
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === "upload" || phase === "analyzing") {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && phase === "upload") analyze(f); }}
          className={cn(
            "relative rounded-3xl border-2 border-dashed p-10 text-center transition-colors",
            phase === "analyzing" ? "border-brand-violet/40 bg-brand-violet/[0.03]" : "border-navy/15 bg-white hover:border-brand-blue-vif/50",
          )}
        >
          {phase === "analyzing" ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-da text-white"><Sparkles size={30} /></div>
                <Loader2 size={72} className="absolute -inset-2 animate-spin text-brand-violet/30" />
              </div>
              <p className="font-display text-lg font-bold text-navy">L'IA analyse « {fileName} »…</p>
              <p className="max-w-sm text-sm text-text-secondary">Extraction du plan, structuration des leçons et création des quiz. Cela prend généralement moins d'une minute.</p>
            </div>
          ) : (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-da text-white"><UploadCloud size={30} /></div>
              <h3 className="mt-5 font-display text-lg font-bold text-navy">Déposez votre document de formation</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">Word (.docx), PDF, Markdown (.md) ou texte (.txt). L'IA en construit automatiquement une formation complète, prête à relire.</p>
              <button onClick={() => fileRef.current?.click()} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-da px-6 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5">
                <FileText size={17} /> Choisir un fichier
              </button>
              <input ref={fileRef} type="file" accept=".docx,.pdf,.txt,.md,application/pdf,text/plain" onChange={onPick} className="hidden" />
            </>
          )}
        </div>
        {error && <p className="mt-4 flex items-start gap-2 text-sm font-medium text-error"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}</p>}
      </div>
    );
  }

  // phase === "review"
  if (!draft) return null;
  const stats = draftStats(draft);
  const schoolOptions = (() => {
    const opts = schools.map((s) => ({ value: s.slug, label: s.name }));
    if (!schools.some((s) => s.slug === draft.path.schoolSlug)) {
      opts.unshift({ value: draft.path.schoolSlug, label: `${draft.path.schoolName} (nouvelle école)` });
    }
    return opts;
  })();
  const fe = (key: string) => fieldErrors[key]?.[0];

  return (
    <div className="space-y-6">
      {/* Bandeau récap */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-violet/20 bg-brand-violet/[0.04] p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-da text-white"><Sparkles size={20} /></span>
          <div>
            <p className="text-sm font-semibold text-navy">Formation extraite — relisez et ajustez</p>
            <p className="text-xs text-text-secondary">{stats.modules} modules · {stats.lessons} leçons · {stats.quizzes} quiz · {stats.questions} questions · via {meta?.model}</p>
          </div>
        </div>
        <button onClick={() => { setDraft(null); setMeta(null); setPhase("upload"); setFileName(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-white">
          <ArrowLeft size={14} /> Recommencer
        </button>
      </div>

      {meta?.warnings && meta.warnings.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-navy">
          {meta.warnings.map((w, i) => <p key={i} className="flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" />{w}</p>)}
        </div>
      )}

      {/* Fiche du parcours */}
      <section className="rounded-2xl border border-navy/[0.08] bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy"><GraduationCap size={18} className="text-brand-blue-royal" /> Fiche de la formation</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Labeled label="Titre" error={fe("path.title")} className="sm:col-span-2">
            <input className={input} value={draft.path.title} onChange={(e) => patchPath({ title: e.target.value })} />
          </Labeled>
          <Labeled label="Slug (URL)" error={fe("path.slug")}>
            <input className={cn(input, "font-mono")} value={draft.path.slug} onChange={(e) => patchPath({ slug: e.target.value })} />
          </Labeled>
          <Labeled label="École">
            <Select value={draft.path.schoolSlug} onChange={(v) => { const s = schools.find((x) => x.slug === v); patchPath({ schoolSlug: v, schoolName: s?.name ?? draft.path.schoolName }); }} options={schoolOptions} ariaLabel="École" />
          </Labeled>
          <Labeled label="Niveau">
            <Select value={draft.path.level} onChange={(v) => patchPath({ level: v as ImportDraft["path"]["level"] })} options={DRAFT_LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL_FR[l] }))} ariaLabel="Niveau" />
          </Labeled>
          <Labeled label="Métier visé">
            <input className={input} value={draft.path.targetJob} onChange={(e) => patchPath({ targetJob: e.target.value })} />
          </Labeled>
          <Labeled label="Prix (FCFA — 0 = gratuit)" error={fe("path.price")}>
            <input className={input} type="number" min={0} value={draft.path.price} onChange={(e) => patchPath({ price: Math.max(0, Number(e.target.value) || 0) })} />
            <span className="mt-1 block text-xs text-text-muted">{draft.path.price > 0 ? formatFCFA(draft.path.price) : "Gratuit"}</span>
          </Labeled>
          <Labeled label="Durée (libellé)">
            <input className={input} value={draft.path.duration} onChange={(e) => patchPath({ duration: e.target.value })} placeholder="ex. 70 heures" />
          </Labeled>
          <Labeled label="Titre du certificat">
            <input className={input} value={draft.path.certificateTitle} onChange={(e) => patchPath({ certificateTitle: e.target.value })} />
          </Labeled>
          <Labeled label="Résumé court" error={fe("path.shortDescription")} className="sm:col-span-2">
            <textarea className={cn(input, "min-h-[60px]")} value={draft.path.shortDescription} onChange={(e) => patchPath({ shortDescription: e.target.value })} />
          </Labeled>
          <Labeled label="Description longue" className="sm:col-span-2">
            <textarea className={cn(input, "min-h-[90px]")} value={draft.path.longDescription} onChange={(e) => patchPath({ longDescription: e.target.value })} />
          </Labeled>
          <Labeled label="Objectifs (un par ligne)"><textarea className={cn(input, "min-h-[90px]")} value={lines(draft.path.objectives)} onChange={(e) => patchPath({ objectives: parseLines(e.target.value) })} /></Labeled>
          <Labeled label="Prérequis (un par ligne)"><textarea className={cn(input, "min-h-[90px]")} value={lines(draft.path.prerequisites)} onChange={(e) => patchPath({ prerequisites: parseLines(e.target.value) })} /></Labeled>
          <Labeled label="Ce que l'apprenant obtient (un par ligne)"><textarea className={cn(input, "min-h-[80px]")} value={lines(draft.path.outcomes)} onChange={(e) => patchPath({ outcomes: parseLines(e.target.value) })} /></Labeled>
          <Labeled label="Outils (un par ligne)"><textarea className={cn(input, "min-h-[80px]")} value={lines(draft.path.tools)} onChange={(e) => patchPath({ tools: parseLines(e.target.value) })} /></Labeled>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <Toggle checked={draft.path.publish} onChange={(v) => patchPath({ publish: v })} label="Publier immédiatement" hint="Sinon la formation reste en brouillon" />
          <Toggle checked={draft.path.featured} onChange={(v) => patchPath({ featured: v })} label="Mettre en avant" hint="Formation vedette du catalogue" />
        </div>
      </section>

      {/* Modules */}
      <div className="space-y-3">
        {draft.modules.map((m, mi) => (
          <ModuleCard
            key={mi}
            index={mi}
            module={m}
            onTitle={(v) => patchModule(mi, { title: v })}
            onObjectives={(v) => patchModule(mi, { objectives: v })}
            onLesson={(li, patch) => patchLesson(mi, li, patch)}
            onRemoveLesson={(li) => removeLesson(mi, li)}
            onQuestion={(qi, patch) => patchQuestion(mi, qi, patch)}
            onRemoveQuestion={(qi) => removeQuestion(mi, qi)}
            onRemoveModule={() => removeModule(mi)}
          />
        ))}
      </div>

      {/* Barre d'action */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-white/95 p-4 shadow-lg backdrop-blur">
        <p className="text-sm text-text-secondary">
          {stats.modules} modules · {stats.lessons} leçons · {stats.quizzes} quiz — prêt à créer.
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm font-medium text-error">{error}</span>}
          <Button size="lg" onClick={create} loading={creating}>
            {creating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {draft.path.publish ? "Créer et publier la formation" : "Créer la formation (brouillon)"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Sous-composants ────────────────────────────────────────────────────── */

function Labeled({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold text-navy">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-error">{error}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 text-left">
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-gradient-da" : "bg-navy/15")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-navy">{label}</span>
        {hint && <span className="block text-xs text-text-muted">{hint}</span>}
      </span>
    </button>
  );
}

function ModuleCard({
  index, module: m, onTitle, onObjectives, onLesson, onRemoveLesson, onQuestion, onRemoveQuestion, onRemoveModule,
}: {
  index: number;
  module: DraftModule;
  onTitle: (v: string) => void;
  onObjectives: (v: string[]) => void;
  onLesson: (li: number, patch: Partial<DraftLesson>) => void;
  onRemoveLesson: (li: number) => void;
  onQuestion: (qi: number, patch: Partial<DraftQuestion>) => void;
  onRemoveQuestion: (qi: number) => void;
  onRemoveModule: () => void;
}) {
  const [open, setOpen] = React.useState(index === 0);
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setOpen((o) => !o)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy/[0.05] text-navy transition-colors hover:bg-navy/10" aria-label={open ? "Réduire" : "Déplier"}>
          <ChevronDown size={18} className={cn("transition-transform", open && "rotate-180")} />
        </button>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-da text-sm font-bold text-white">{index + 1}</span>
        <input className={cn(input, "flex-1 font-semibold")} value={m.title} onChange={(e) => onTitle(e.target.value)} />
        <span className="hidden shrink-0 items-center gap-2 text-xs text-text-muted sm:flex">
          <BookOpen size={14} /> {m.lessons.length}
          {m.quiz && <><ListChecks size={14} /> {m.quiz.questions.length}</>}
        </span>
        <button onClick={onRemoveModule} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error" title="Supprimer le module"><Trash2 size={15} /></button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-4 border-t border-navy/[0.06] p-4">
              <Labeled label="Objectifs du module (un par ligne)">
                <textarea className={cn(input, "min-h-[64px]")} value={lines(m.objectives)} onChange={(e) => onObjectives(parseLines(e.target.value))} />
              </Labeled>

              {/* Leçons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Leçons</p>
                {m.lessons.map((l, li) => <LessonRow key={li} lesson={l} onChange={(patch) => onLesson(li, patch)} onRemove={() => onRemoveLesson(li)} />)}
              </div>

              {/* Quiz */}
              {m.quiz && m.quiz.questions.length > 0 && (
                <div className="space-y-2 rounded-xl border border-brand-violet/15 bg-brand-violet/[0.03] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-violet"><ListChecks size={14} /> Quiz de validation ({m.quiz.questions.length})</p>
                  {m.quiz.questions.map((q, qi) => <QuestionRow key={qi} n={qi} question={q} onChange={(patch) => onQuestion(qi, patch)} onRemove={() => onRemoveQuestion(qi)} />)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function LessonRow({ lesson, onChange, onRemove }: { lesson: DraftLesson; onChange: (patch: Partial<DraftLesson>) => void; onRemove: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-lg border border-navy/[0.08] bg-white p-2.5">
      <div className="flex items-center gap-2">
        <input className={cn(input, "flex-1 py-1.5")} value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} />
        <div className="w-40 shrink-0">
          <Select value={lesson.type} onChange={(v) => onChange({ type: v as DraftLesson["type"] })} options={DRAFT_LESSON_TYPES.map((t) => ({ value: t, label: LESSON_TYPE_LABEL_FR[t] }))} ariaLabel="Type de leçon" />
        </div>
        <button onClick={() => setOpen((o) => !o)} className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-blue-royal hover:bg-navy/[0.04]">{open ? "Masquer" : "Contenu"}</button>
        <button onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error" title="Supprimer la leçon"><Trash2 size={14} /></button>
      </div>
      {open && (
        <textarea className={cn(input, "mt-2 min-h-[160px] font-mono text-xs")} value={lesson.content} onChange={(e) => onChange({ content: e.target.value })} placeholder="Contenu Markdown…" />
      )}
    </div>
  );
}

function QuestionRow({ n, question: q, onChange, onRemove }: { n: number; question: DraftQuestion; onChange: (patch: Partial<DraftQuestion>) => void; onRemove: () => void }) {
  const isTF = q.type === "TRUE_FALSE";
  const options = isTF ? ["Vrai", "Faux"] : q.options;

  function setType(v: DraftQuestion["type"]) {
    if (v === "TRUE_FALSE") onChange({ type: v, options: ["Vrai", "Faux"], correctIndexes: [q.correctIndexes[0] === 1 ? 1 : 0] });
    else onChange({ type: v, correctIndexes: q.correctIndexes.slice(0, v === "SINGLE_CHOICE" ? 1 : q.correctIndexes.length) });
  }
  function toggleCorrect(i: number) {
    if (q.type === "MULTIPLE_CHOICE") {
      const set = new Set(q.correctIndexes);
      set.has(i) ? set.delete(i) : set.add(i);
      onChange({ correctIndexes: [...set].sort((a, b) => a - b) });
    } else {
      onChange({ correctIndexes: [i] });
    }
  }
  function setOption(i: number, v: string) {
    const opts = q.options.slice();
    opts[i] = v;
    onChange({ options: opts });
  }
  function addOption() {
    onChange({ options: [...q.options, "Nouvelle option"] });
  }
  function removeOption(i: number) {
    const opts = q.options.filter((_, idx) => idx !== i);
    const correct = q.correctIndexes.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c));
    onChange({ options: opts, correctIndexes: correct.length ? correct : [0] });
  }

  return (
    <div className="rounded-lg border border-navy/[0.08] bg-white p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 text-xs font-bold text-brand-violet">{n + 1}.</span>
        <textarea className={cn(input, "min-h-[44px] flex-1")} value={q.question} onChange={(e) => onChange({ question: e.target.value })} />
        <div className="w-36 shrink-0">
          <Select value={q.type} onChange={(v) => setType(v as DraftQuestion["type"])} options={DRAFT_QUESTION_TYPES.map((t) => ({ value: t, label: QTYPE_LABEL[t] }))} ariaLabel="Type de question" />
        </div>
        <button onClick={onRemove} className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error" title="Supprimer la question"><Trash2 size={14} /></button>
      </div>
      <div className="mt-2 space-y-1.5 pl-6">
        {options.map((opt, i) => {
          const correct = q.correctIndexes.includes(i);
          return (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCorrect(i)}
                title={correct ? "Bonne réponse" : "Marquer comme bonne réponse"}
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center border transition-colors",
                  q.type === "MULTIPLE_CHOICE" ? "rounded-md" : "rounded-full",
                  correct ? "border-success bg-success text-white" : "border-navy/25 text-transparent hover:border-success",
                )}
              >
                <CheckCircle2 size={12} />
              </button>
              {isTF ? (
                <span className={cn("text-sm", correct ? "font-semibold text-navy" : "text-text-secondary")}>{opt}</span>
              ) : (
                <>
                  <input className={cn(input, "flex-1 py-1")} value={opt} onChange={(e) => setOption(i, e.target.value)} />
                  {q.options.length > 2 && <button onClick={() => removeOption(i)} className="text-text-muted hover:text-error" title="Retirer l'option"><Trash2 size={13} /></button>}
                </>
              )}
            </div>
          );
        })}
        {!isTF && q.options.length < 6 && (
          <button onClick={addOption} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal hover:underline"><Plus size={13} /> Ajouter une option</button>
        )}
      </div>
    </div>
  );
}
