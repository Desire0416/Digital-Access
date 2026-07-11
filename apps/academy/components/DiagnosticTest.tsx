"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, X, ArrowRight, ArrowLeft, Check, Target, Compass,
  Lightbulb, TrendingUp, GraduationCap, RotateCcw,
} from "lucide-react";
import { cn, buttonClasses } from "@da/ui";
import type { DiagQuestion, DiagResult, DiagLevel } from "@/lib/diagnostic/types";

/* Diagnostic de maturité numérique piloté par l'IA — carte d'appel + modale
   (intro → questions → résultat avec niveau recommandé + conseils). */

type Phase = "intro" | "loading" | "questions" | "evaluating" | "result" | "error";

const LEVEL_STYLE: Record<DiagLevel, { dot: string; ring: string; label: string }> = {
  BEGINNER: { dot: "bg-brand-blue-vif", ring: "ring-brand-blue-vif/30", label: "Débutant" },
  INTERMEDIATE: { dot: "bg-brand-violet", ring: "ring-brand-violet/30", label: "Intermédiaire" },
  ADVANCED: { dot: "bg-accent", ring: "ring-accent/30", label: "Avancé" },
};

export function DiagnosticTest({
  slug,
  title,
  level,
}: {
  slug: string;
  title: string;
  level: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [goal, setGoal] = React.useState("");
  const [questions, setQuestions] = React.useState<DiagQuestion[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [idx, setIdx] = React.useState(0);
  const [result, setResult] = React.useState<DiagResult | null>(null);
  const [error, setError] = React.useState("");

  function reset() {
    setPhase("intro");
    setQuestions([]);
    setAnswers({});
    setIdx(0);
    setResult(null);
    setError("");
  }
  function close() {
    setOpen(false);
    // léger délai pour ne pas voir le reset pendant la fermeture animée
    setTimeout(reset, 250);
  }

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function start() {
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/diagnostic/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Le diagnostic n'a pas pu démarrer.");
      const qs: DiagQuestion[] = Array.isArray(data.questions) ? data.questions : [];
      if (qs.length < 3) throw new Error("Diagnostic indisponible pour l'instant.");
      setQuestions(qs);
      setIdx(0);
      setPhase("questions");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  async function submit() {
    setPhase("evaluating");
    setError("");
    try {
      const res = await fetch("/api/diagnostic/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          questions,
          answers: questions.map((q) => ({ id: q.id, choice: answers[q.id] ?? 0 })),
          goal: goal.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "L'évaluation a échoué.");
      setResult(data.result as DiagResult);
      setPhase("result");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  const q = questions[idx];
  const answered = q ? answers[q.id] !== undefined : false;
  const allAnswered = questions.length > 0 && questions.every((qq) => answers[qq.id] !== undefined);

  return (
    <>
      {/* ── Carte d'appel ── */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
            <Compass size={22} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-navy">
              Pas sûr de votre niveau ?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Faites le <strong className="font-semibold text-navy">diagnostic de maturité numérique</strong> —
              8 questions, ~2 min. Notre IA évalue votre niveau et vous conseille par où commencer.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(buttonClasses({ variant: "primary", size: "md" }), "mt-4")}
            >
              <Sparkles size={16} /> Démarrer le diagnostic
            </button>
          </div>
        </div>
      </div>

      {/* ── Modale ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Diagnostic de maturité numérique"
          >
            <motion.div
              className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface-primary shadow-2xl sm:rounded-3xl"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête */}
              <div className="flex items-center justify-between gap-3 border-b border-navy/[0.08] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da text-white">
                    <Compass size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-navy">Diagnostic de maturité</p>
                    <p className="truncate text-xs text-text-muted">{title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer"
                  className="grid h-8 w-8 place-items-center rounded-full text-text-muted transition-colors hover:bg-navy/5 hover:text-navy"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Barre de progression (questions) */}
              {phase === "questions" && (
                <div className="h-1 w-full bg-navy/[0.06]">
                  <motion.div
                    className="h-full rounded-r-full bg-gradient-da"
                    initial={false}
                    animate={{ width: `${((idx + 1) / questions.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-6">
                {/* INTRO */}
                {phase === "intro" && (
                  <div className="text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand-lg">
                      <Sparkles size={26} />
                    </span>
                    <h4 className="mt-4 font-display text-lg font-bold text-navy">
                      Évaluons votre niveau
                    </h4>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                      8 questions adaptées à cette formation. À la fin, l'IA vous indique votre niveau
                      (<strong>Débutant</strong>, <strong>Intermédiaire</strong> ou <strong>Avancé</strong>)
                      et par où commencer.
                    </p>
                    <div className="mt-5 text-left">
                      <label htmlFor="diag-goal" className="text-xs font-semibold text-navy">
                        Votre objectif (facultatif)
                      </label>
                      <input
                        id="diag-goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        maxLength={200}
                        placeholder="Ex. gérer la base de données de mon entreprise"
                        className="mt-1.5 w-full rounded-lg border border-navy/[0.12] px-3.5 py-2.5 text-sm text-navy outline-none placeholder:text-text-muted focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={start}
                      className={cn(buttonClasses({ variant: "primary", size: "lg" }), "mt-6 w-full")}
                    >
                      Commencer <ArrowRight size={18} />
                    </button>
                  </div>
                )}

                {/* LOADING */}
                {(phase === "loading" || phase === "evaluating") && (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="relative grid h-16 w-16 place-items-center">
                      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-gradient-da opacity-40" />
                      <motion.span
                        className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand-lg"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles size={26} />
                      </motion.span>
                    </span>
                    <p className="mt-5 font-display text-sm font-bold text-navy">
                      {phase === "loading" ? "Préparation de votre diagnostic…" : "Analyse de vos réponses…"}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">L'IA travaille pour vous — quelques secondes.</p>
                  </div>
                )}

                {/* QUESTIONS */}
                {phase === "questions" && q && (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue-vif/10 px-2.5 py-1 font-semibold text-brand-blue-royal">
                        {q.dimension}
                      </span>
                      <span className="font-semibold text-text-muted">
                        {idx + 1} / {questions.length}
                      </span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.22 }}
                      >
                        <p className="mt-3 font-display text-base font-bold leading-snug text-navy">
                          {q.question}
                        </p>
                        <div className="mt-4 flex flex-col gap-2.5">
                          {q.options.map((opt, oi) => {
                            const selected = answers[q.id] === oi;
                            return (
                              <button
                                key={oi}
                                type="button"
                                onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                                  selected
                                    ? "border-transparent bg-gradient-da text-white shadow-brand"
                                    : "border-navy/[0.1] text-navy hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.04]",
                                )}
                              >
                                <span
                                  className={cn(
                                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                                    selected ? "border-white bg-white/20" : "border-navy/25",
                                  )}
                                >
                                  {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setIdx((i) => Math.max(0, i - 1))}
                        disabled={idx === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowLeft size={16} /> Précédent
                      </button>
                      {idx < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setIdx((i) => i + 1)}
                          disabled={!answered}
                          className={cn(buttonClasses({ variant: "primary", size: "md" }), "disabled:cursor-not-allowed disabled:opacity-40")}
                        >
                          Suivant <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={submit}
                          disabled={!allAnswered}
                          className={cn(buttonClasses({ variant: "primary", size: "md" }), "disabled:cursor-not-allowed disabled:opacity-40")}
                        >
                          <Sparkles size={16} /> Voir mon résultat
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* RESULT */}
                {phase === "result" && result && (
                  <ResultView
                    result={result}
                    onRestart={reset}
                    onStart={() => {
                      close();
                      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 320);
                    }}
                  />
                )}

                {/* ERROR */}
                {phase === "error" && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-semibold text-error">{error}</p>
                    <button
                      type="button"
                      onClick={reset}
                      className={cn(buttonClasses({ variant: "outline", size: "md" }), "mt-5")}
                    >
                      <RotateCcw size={16} /> Réessayer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ResultView({
  result,
  onRestart,
  onStart,
}: {
  result: DiagResult;
  onRestart: () => void;
  onStart: () => void;
}) {
  const st = LEVEL_STYLE[result.recommendedLevel];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Niveau + score */}
      <div className="rounded-2xl border border-navy/[0.08] bg-surface-secondary/60 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Niveau recommandé</p>
        <div className="mt-2 inline-flex items-center gap-2.5 rounded-full bg-gradient-da px-5 py-2 text-white shadow-brand">
          <span className={cn("h-2.5 w-2.5 rounded-full ring-4", "bg-white", st.ring)} />
          <span className="font-display text-lg font-extrabold">{result.levelLabel}</span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-center">
          <div>
            <p className="font-display text-2xl font-extrabold text-navy">{result.score}%</p>
            <p className="text-[11px] text-text-muted">Maturité estimée</p>
          </div>
          <span className="h-8 w-px bg-navy/[0.1]" />
          <div>
            <p className="font-display text-sm font-bold capitalize text-navy">{result.confidence}</p>
            <p className="text-[11px] text-text-muted">Confiance</p>
          </div>
        </div>
      </div>

      {result.summary && (
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">{result.summary}</p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {result.strengths.length > 0 && (
          <div className="rounded-xl border border-success/20 bg-success/[0.05] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-success">
              <TrendingUp size={14} /> Vos points forts
            </p>
            <ul className="mt-2 space-y-1.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-navy/80">
                  <Check size={13} className="mt-0.5 shrink-0 text-success" /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.gaps.length > 0 && (
          <div className="rounded-xl border border-warning/25 bg-warning/[0.05] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-warning">
              <Target size={14} /> À renforcer
            </p>
            <ul className="mt-2 space-y-1.5">
              {result.gaps.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-navy/80">
                  <ArrowRight size={13} className="mt-0.5 shrink-0 text-warning" /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommandation */}
      <div className="mt-4 rounded-xl border border-brand-violet/20 bg-brand-violet/[0.05] p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-brand-violet">
          <Lightbulb size={14} /> Notre conseil pour cette formation
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy/85">{result.recommendation}</p>
        {result.startingPoint && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-blue-royal shadow-sm">
            <Compass size={13} /> {result.startingPoint}
          </p>
        )}
      </div>

      {/* CTAs */}
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onStart}
          className={cn(buttonClasses({ variant: "primary", size: "lg" }), "w-full")}
        >
          <GraduationCap size={18} /> M'inscrire à la formation
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-navy"
        >
          <RotateCcw size={13} /> Refaire le diagnostic
        </button>
      </div>
    </motion.div>
  );
}
