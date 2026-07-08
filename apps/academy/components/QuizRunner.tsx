"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, RotateCcw, Trophy } from "lucide-react";
import { Button, cn } from "@da/ui";
import { submitQuiz } from "@/lib/learn-actions";
import type { QuizForRunner, QuizSubmissionResult } from "@/lib/learn-types";

/* ══════════════════════════════════════════════════════════════════════════
   QuizRunner — QCU / QCM / Vrai-Faux. Les options sont choisies par INDEX ;
   le scoring est fait côté serveur (submitQuiz). Feedback animé, correction
   par question (bonne réponse surlignée + explication), score final, reprise.
   ══════════════════════════════════════════════════════════════════════════ */

type Answers = Record<string, number | number[]>;

export function QuizRunner({
  quiz,
  onPassed,
}: {
  quiz: QuizForRunner;
  onPassed?: () => void;
}) {
  const [answers, setAnswers] = React.useState<Answers>({});
  const [result, setResult] = React.useState<QuizSubmissionResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const allAnswered = quiz.questions.every((q) => {
    const a = answers[q.id];
    return q.type === "MULTIPLE_CHOICE" ? Array.isArray(a) && a.length > 0 : typeof a === "number";
  });

  function toggle(qId: string, type: string, idx: number) {
    if (result) return;
    setError(null);
    setAnswers((prev) => {
      if (type === "MULTIPLE_CHOICE") {
        const cur = Array.isArray(prev[qId]) ? (prev[qId] as number[]) : [];
        const next = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx].sort((a, b) => a - b);
        return { ...prev, [qId]: next };
      }
      return { ...prev, [qId]: idx };
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitQuiz(quiz.id, answers);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.result);
      if (res.result.passed) onPassed?.();
    });
  }

  function reset() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  const byQuestion = React.useMemo(
    () => new Map((result?.perQuestion ?? []).map((p) => [p.questionId, p])),
    [result],
  );

  return (
    <div className="rounded-2xl border border-brand-violet/15 bg-surface-secondary/50 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
          <Sparkles size={18} />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-navy">{quiz.title}</h3>
          <p className="text-xs text-text-muted">
            {quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""} · réussite ≥ {quiz.passingScore}%
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-5">
        {quiz.questions.map((q, qi) => {
          const feedback = byQuestion.get(q.id);
          const correctSet = new Set(feedback?.correctAnswer ?? []);
          const chosen = answers[q.id];
          const chosenSet = new Set(
            Array.isArray(chosen) ? chosen : typeof chosen === "number" ? [chosen] : [],
          );
          return (
            <li key={q.id} className="rounded-xl border border-navy/10 bg-surface-primary p-4">
              <p className="mb-3 flex gap-2 text-sm font-semibold text-navy">
                <span className="text-brand-blue-royal">{qi + 1}.</span>
                <span>{q.question}</span>
                {q.type === "MULTIPLE_CHOICE" && (
                  <span className="ml-auto shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Choix multiple
                  </span>
                )}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, oi) => {
                  const selected = chosenSet.has(oi);
                  const isCorrect = correctSet.has(oi);
                  const state = feedback
                    ? isCorrect
                      ? "correct"
                      : selected
                        ? "wrong"
                        : "idle"
                    : selected
                      ? "selected"
                      : "idle";
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={Boolean(result) || pending}
                      onClick={() => toggle(q.id, q.type, oi)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                        state === "idle" && "border-navy/12 bg-surface-primary text-navy hover:border-brand-blue-vif/50",
                        state === "selected" && "border-brand-blue-vif bg-brand-blue-vif/[0.07] text-brand-blue-royal",
                        state === "correct" && "border-success bg-success/[0.08] text-success",
                        state === "wrong" && "border-error bg-error/[0.07] text-error",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-white",
                          q.type === "MULTIPLE_CHOICE" ? "rounded-md" : "rounded-full",
                          state === "correct" && "border-success bg-success",
                          state === "wrong" && "border-error bg-error",
                          state === "selected" && "border-brand-blue-vif bg-brand-blue-vif",
                          state === "idle" && "border-navy/25 bg-transparent",
                        )}
                      >
                        {state === "correct" && <Check size={13} />}
                        {state === "wrong" && <X size={13} />}
                        {state === "selected" && <Check size={13} />}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {feedback?.explanation && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "mt-3 overflow-hidden rounded-lg px-3 py-2 text-xs",
                      feedback.correct ? "bg-success/[0.08] text-success" : "bg-navy/[0.04] text-text-secondary",
                    )}
                  >
                    {feedback.explanation}
                  </motion.p>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>

      {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center",
              result.passed ? "border-success/30 bg-success/[0.06]" : "border-warning/30 bg-warning/[0.06]",
            )}
          >
            <span
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white",
                result.passed ? "bg-success" : "bg-warning",
              )}
            >
              {result.passed ? <Trophy size={22} /> : <RotateCcw size={22} />}
            </span>
            <div className="flex-1">
              <p className="font-display text-lg font-bold text-navy">
                {result.passed ? "Quiz réussi !" : "Presque !"} Score : {result.score}%
              </p>
              <p className="text-sm text-text-secondary">
                {result.correctCount} / {result.total} bonne{result.correctCount > 1 ? "s" : ""} réponse
                {result.correctCount > 1 ? "s" : ""}.{" "}
                {result.passed
                  ? "La leçon est validée."
                  : `Il faut ${quiz.passingScore}% pour valider — réessayez.`}
              </p>
            </div>
            {!result.passed && (
              <Button variant="secondary" size="sm" onClick={reset} className="shrink-0">
                <RotateCcw size={15} /> Recommencer
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div key="submit" className="mt-5">
            <Button onClick={submit} disabled={!allAnswered || pending} loading={pending} className="w-full sm:w-auto">
              {pending ? "Correction…" : "Valider le quiz"}
            </Button>
            {!allAnswered && (
              <p className="mt-2 text-xs text-text-muted">Répondez à toutes les questions pour valider.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
