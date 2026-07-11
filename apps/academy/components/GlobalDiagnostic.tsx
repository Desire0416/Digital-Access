"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass, Sparkles, X, ArrowRight, ArrowLeft, Check, RotateCcw, Star, GraduationCap,
} from "lucide-react";
import { cn, buttonClasses } from "@da/ui";
import type { DiagQuestion, RecommendResult } from "@/lib/diagnostic/types";

/* Diagnostic d'orientation PUBLIC — bouton flottant (toutes les pages du site)
   + modale : profil rapide → l'IA recommande LA formation adéquate du catalogue. */

type Phase = "intro" | "loading" | "questions" | "recommending" | "result" | "error";

export function GlobalDiagnostic() {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [goal, setGoal] = React.useState("");
  const [questions, setQuestions] = React.useState<DiagQuestion[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [idx, setIdx] = React.useState(0);
  const [result, setResult] = React.useState<RecommendResult | null>(null);
  const [error, setError] = React.useState("");

  function reset() {
    setPhase("intro"); setQuestions([]); setAnswers({}); setIdx(0); setResult(null); setError("");
  }
  function close() {
    setOpen(false);
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
    setPhase("loading"); setError("");
    try {
      const res = await fetch("/api/diagnostic/orientation", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Le diagnostic n'a pas pu démarrer.");
      const qs: DiagQuestion[] = Array.isArray(data.questions) ? data.questions : [];
      if (qs.length < 3) throw new Error("Diagnostic indisponible pour l'instant.");
      setQuestions(qs); setIdx(0); setPhase("questions");
    } catch (e) {
      setError((e as Error).message); setPhase("error");
    }
  }

  async function submit() {
    setPhase("recommending"); setError("");
    try {
      const res = await fetch("/api/diagnostic/recommend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          answers: questions.map((q) => ({ id: q.id, choice: answers[q.id] ?? 0 })),
          goal: goal.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "La recommandation a échoué.");
      const r = data.result as RecommendResult;
      if (!r?.recommendations?.length) throw new Error("Aucune formation trouvée pour ce profil.");
      setResult(r); setPhase("result");
    } catch (e) {
      setError((e as Error).message); setPhase("error");
    }
  }

  const q = questions[idx];
  const answered = q ? answers[q.id] !== undefined : false;
  const allAnswered = questions.length > 0 && questions.every((qq) => answers[qq.id] !== undefined);

  return (
    <>
      {/* ── Bouton flottant clignotant ── */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Trouver ma formation — diagnostic d'orientation"
        className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-da px-4 py-3 text-sm font-bold text-white shadow-brand-lg sm:bottom-6 sm:right-6"
        initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
        animate={
          reduce
            ? { opacity: 1 }
            : { scale: [1, 1.06, 1], opacity: 1 }
        }
        transition={
          reduce
            ? { duration: 0.3 }
            : { scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.4 }, default: { delay: 0.8 } }
        }
        whileHover={reduce ? undefined : { scale: 1.08 }}
        whileTap={reduce ? undefined : { scale: 0.95 }}
      >
        {!reduce && (
          <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-brand-cyan/60" aria-hidden />
        )}
        <Compass size={20} className="shrink-0" />
        <span className="hidden sm:inline">Trouver ma formation</span>
      </motion.button>

      {/* ── Modale ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close} role="dialog" aria-modal="true" aria-label="Diagnostic d'orientation"
          >
            <motion.div
              className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface-primary shadow-2xl sm:rounded-3xl"
              initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête */}
              <div className="flex items-center justify-between gap-3 border-b border-navy/[0.08] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da text-white"><Compass size={17} /></span>
                  <div>
                    <p className="font-display text-sm font-bold text-navy">Trouvez votre formation</p>
                    <p className="text-xs text-text-muted">Diagnostic d'orientation · ~1 min</p>
                  </div>
                </div>
                <button type="button" onClick={close} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-full text-text-muted transition-colors hover:bg-navy/5 hover:text-navy">
                  <X size={18} />
                </button>
              </div>

              {phase === "questions" && (
                <div className="h-1 w-full bg-navy/[0.06]">
                  <motion.div className="h-full rounded-r-full bg-gradient-da" initial={false}
                    animate={{ width: `${((idx + 1) / questions.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-6">
                {/* INTRO */}
                {phase === "intro" && (
                  <div className="text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand-lg"><Sparkles size={26} /></span>
                    <h4 className="mt-4 font-display text-lg font-bold text-navy">Quelle formation est faite pour vous ?</h4>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                      Répondez à 6 questions rapides. Notre IA analyse votre profil et vous recommande
                      la formation la plus adaptée <strong>parmi tout notre catalogue</strong>.
                    </p>
                    <div className="mt-5 text-left">
                      <label htmlFor="glob-goal" className="text-xs font-semibold text-navy">Que souhaitez-vous accomplir ? (facultatif)</label>
                      <input id="glob-goal" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={200}
                        placeholder="Ex. devenir développeur, gérer une base de données…"
                        className="mt-1.5 w-full rounded-lg border border-navy/[0.12] px-3.5 py-2.5 text-sm text-navy outline-none placeholder:text-text-muted focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/20" />
                    </div>
                    <button type="button" onClick={start} className={cn(buttonClasses({ variant: "primary", size: "lg" }), "mt-6 w-full")}>
                      Commencer <ArrowRight size={18} />
                    </button>
                  </div>
                )}

                {/* LOADING */}
                {(phase === "loading" || phase === "recommending") && (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="relative grid h-16 w-16 place-items-center">
                      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-gradient-da opacity-40" />
                      <motion.span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand-lg"
                        animate={{ rotate: 360 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}>
                        <Compass size={26} />
                      </motion.span>
                    </span>
                    <p className="mt-5 font-display text-sm font-bold text-navy">
                      {phase === "loading" ? "Préparation…" : "L'IA cherche votre formation idéale…"}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">Quelques secondes.</p>
                  </div>
                )}

                {/* QUESTIONS */}
                {phase === "questions" && q && (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue-vif/10 px-2.5 py-1 font-semibold text-brand-blue-royal">{q.dimension}</span>
                      <span className="font-semibold text-text-muted">{idx + 1} / {questions.length}</span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div key={q.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                        <p className="mt-3 font-display text-base font-bold leading-snug text-navy">{q.question}</p>
                        <div className="mt-4 flex flex-col gap-2.5">
                          {q.options.map((opt, oi) => {
                            const selected = answers[q.id] === oi;
                            return (
                              <button key={oi} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                                  selected ? "border-transparent bg-gradient-da text-white shadow-brand" : "border-navy/[0.1] text-navy hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.04]",
                                )}>
                                <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border", selected ? "border-white bg-white/20" : "border-navy/25")}>
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
                      <button type="button" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-navy disabled:cursor-not-allowed disabled:opacity-40">
                        <ArrowLeft size={16} /> Précédent
                      </button>
                      {idx < questions.length - 1 ? (
                        <button type="button" onClick={() => setIdx((i) => i + 1)} disabled={!answered}
                          className={cn(buttonClasses({ variant: "primary", size: "md" }), "disabled:cursor-not-allowed disabled:opacity-40")}>
                          Suivant <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button type="button" onClick={submit} disabled={!allAnswered}
                          className={cn(buttonClasses({ variant: "primary", size: "md" }), "disabled:cursor-not-allowed disabled:opacity-40")}>
                          <Sparkles size={16} /> Ma formation
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* RESULT */}
                {phase === "result" && result && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="rounded-2xl border border-navy/[0.08] bg-surface-secondary/60 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-violet">
                        <Sparkles size={13} /> Votre profil
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-navy/85">{result.profileSummary}</p>
                    </div>

                    <p className="mt-5 text-xs font-bold uppercase tracking-wide text-text-muted">
                      {result.recommendations.length > 1 ? "Formations recommandées" : "Formation recommandée"}
                    </p>
                    <div className="mt-2.5 flex flex-col gap-3">
                      {result.recommendations.map((rec, i) => (
                        <Link
                          key={rec.slug + i}
                          href={rec.type === "career-path" ? `/career-paths/${rec.slug}` : `/short-courses/${rec.slug}`}
                          onClick={close}
                          className={cn(
                            "group/rec block rounded-xl border p-4 transition-all hover:shadow-brand",
                            i === 0 ? "border-brand-violet/30 bg-brand-violet/[0.04]" : "border-navy/[0.1] bg-surface-primary hover:border-brand-blue-vif/40",
                          )}
                        >
                          {i === 0 && (
                            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-gradient-da px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              <Star size={10} className="fill-current" /> Recommandation n°1
                            </span>
                          )}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-blue-royal">{rec.school}</p>
                              <h4 className="mt-0.5 font-display text-sm font-bold leading-snug text-navy">{rec.title}</h4>
                            </div>
                            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-semibold text-navy">
                              <GraduationCap size={11} /> {rec.levelLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-text-secondary">{rec.reason}</p>
                          <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal">
                            Découvrir la formation
                            <ArrowRight size={13} className="transition-transform group-hover/rec:translate-x-1" />
                          </span>
                        </Link>
                      ))}
                    </div>

                    {result.note && (
                      <p className="mt-4 rounded-lg bg-brand-cyan/[0.07] px-3 py-2 text-xs leading-relaxed text-navy/80">
                        💡 {result.note}
                      </p>
                    )}
                    <button type="button" onClick={reset} className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-navy">
                      <RotateCcw size={13} /> Refaire le diagnostic
                    </button>
                  </motion.div>
                )}

                {/* ERROR */}
                {phase === "error" && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-semibold text-error">{error}</p>
                    <button type="button" onClick={reset} className={cn(buttonClasses({ variant: "outline", size: "md" }), "mt-5")}>
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
