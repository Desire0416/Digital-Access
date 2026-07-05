"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Trash2, Check, HelpCircle, Save } from "lucide-react";
import { Button, Input, Textarea, Badge, cn } from "@da/ui";
import { saveQuiz } from "@/lib/studio-actions";
import type { StudioQuiz } from "@/lib/studio-types";
import { InlineMessage } from "./shared";

interface DraftQuestion {
  key: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

let counter = 0;
const nextKey = () => `q-${Date.now()}-${counter++}`;

function fromQuiz(quiz: StudioQuiz | null): {
  passingScore: number;
  questions: DraftQuestion[];
} {
  if (!quiz) {
    return {
      passingScore: 70,
      questions: [
        { key: nextKey(), question: "", options: ["", ""], correctAnswers: [], explanation: "" },
      ],
    };
  }
  return {
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((q) => ({
      key: nextKey(),
      question: q.question,
      options: q.options.length ? q.options : ["", ""],
      correctAnswers: [...q.correctAnswers],
      explanation: q.explanation ?? "",
    })),
  };
}

export function QuizEditor({
  chapterId,
  quiz,
  onSaved,
}: {
  chapterId: string;
  quiz: StudioQuiz | null;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const initial = React.useMemo(() => fromQuiz(quiz), [quiz]);
  const [passingScore, setPassingScore] = React.useState(initial.passingScore);
  const [questions, setQuestions] = React.useState<DraftQuestion[]>(initial.questions);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  function patch(key: string, fn: (q: DraftQuestion) => DraftQuestion) {
    setQuestions((prev) => prev.map((q) => (q.key === key ? fn(q) : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { key: nextKey(), question: "", options: ["", ""], correctAnswers: [], explanation: "" },
    ]);
  }

  function removeQuestion(key: string) {
    setQuestions((prev) => prev.filter((q) => q.key !== key));
  }

  function toggleCorrect(key: string, index: number) {
    patch(key, (q) => {
      const has = q.correctAnswers.includes(index);
      return {
        ...q,
        correctAnswers: has
          ? q.correctAnswers.filter((i) => i !== index)
          : [...q.correctAnswers, index].sort((a, b) => a - b),
      };
    });
  }

  function addOption(key: string) {
    patch(key, (q) =>
      q.options.length >= 6 ? q : { ...q, options: [...q.options, ""] },
    );
  }

  function removeOption(key: string, index: number) {
    patch(key, (q) => {
      if (q.options.length <= 2) return q;
      const options = q.options.filter((_, i) => i !== index);
      const correctAnswers = q.correctAnswers
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
      return { ...q, options, correctAnswers };
    });
  }

  function validate(): string | null {
    if (questions.length === 0) return "Ajoutez au moins une question.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.question.trim().length < 3) return `Question ${i + 1} : intitulé trop court.`;
      const filled = q.options.filter((o) => o.trim().length > 0);
      if (filled.length < 2) return `Question ${i + 1} : au moins 2 options remplies.`;
      if (q.correctAnswers.length < 1)
        return `Question ${i + 1} : sélectionnez au moins une bonne réponse.`;
      if (q.correctAnswers.some((idx) => !q.options[idx]?.trim()))
        return `Question ${i + 1} : une bonne réponse pointe une option vide.`;
    }
    return null;
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    startTransition(async () => {
      const res = await saveQuiz({
        chapterId,
        passingScore,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()).filter(Boolean),
          correctAnswers: q.correctAnswers,
          explanation: q.explanation.trim() || undefined,
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      onSaved();
      router.refresh();
      window.setTimeout(() => setSaved(false), 2600);
    });
  }

  return (
    <div className="space-y-5">
      {/* Score de réussite */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-navy/[0.07] bg-surface-secondary/60 p-4">
        <label htmlFor="passing" className="text-sm font-medium text-navy">
          Score de réussite
        </label>
        <div className="flex items-center gap-2">
          <input
            id="passing"
            type="range"
            min={1}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            className="accent-brand-violet"
          />
          <Badge variant="gradient" className="tabular-nums">
            {passingScore}%
          </Badge>
        </div>
        <p className="text-xs text-text-muted">
          Pourcentage minimal de bonnes réponses pour valider le quiz.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {questions.map((q, qi) => {
            const multiple = q.correctAnswers.length > 1;
            return (
              <motion.div
                key={q.key}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="rounded-2xl border border-navy/[0.09] bg-surface-primary p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-xs font-bold text-white">
                      {qi + 1}
                    </span>
                    <Badge variant={multiple ? "info" : "soft"}>
                      {multiple ? "Choix multiple" : "Choix unique"}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.key)}
                    aria-label="Supprimer la question"
                    className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>

                <div className="mt-3">
                  <Textarea
                    value={q.question}
                    onChange={(e) => patch(q.key, (x) => ({ ...x, question: e.target.value }))}
                    placeholder="Intitulé de la question…"
                    className="min-h-16 text-sm"
                    maxLength={500}
                  />
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Options — cochez les bonnes réponses
                </p>
                <div className="mt-2 space-y-2">
                  {q.options.map((opt, oi) => {
                    const correct = q.correctAnswers.includes(oi);
                    return (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCorrect(q.key, oi)}
                          aria-pressed={correct}
                          aria-label={correct ? "Bonne réponse" : "Marquer comme bonne réponse"}
                          className={cn(
                            "grid h-6 w-6 flex-none place-items-center border-2 transition-all",
                            "rounded-md",
                            correct
                              ? "border-transparent bg-gradient-da text-white shadow-brand"
                              : "border-navy/20 text-transparent hover:border-brand-blue-vif",
                          )}
                        >
                          <Check size={14} strokeWidth={3} aria-hidden />
                        </button>
                        <Input
                          value={opt}
                          onChange={(e) =>
                            patch(q.key, (x) => ({
                              ...x,
                              options: x.options.map((o, i) => (i === oi ? e.target.value : o)),
                            }))
                          }
                          placeholder={`Option ${oi + 1}`}
                          className="h-10 text-sm"
                          maxLength={300}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(q.key, oi)}
                          disabled={q.options.length <= 2}
                          aria-label="Retirer l'option"
                          className="grid h-9 w-9 flex-none place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                        >
                          <X size={15} aria-hidden />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(q.key)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                  >
                    <Plus size={14} aria-hidden /> Ajouter une option
                  </button>
                )}

                <div className="mt-4">
                  <Input
                    value={q.explanation}
                    onChange={(e) =>
                      patch(q.key, (x) => ({ ...x, explanation: e.target.value }))
                    }
                    placeholder="Explication affichée après réponse (facultatif)"
                    className="h-10 text-sm"
                    maxLength={600}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-navy/20 py-3 text-sm font-semibold text-brand-blue-royal transition-colors hover:border-brand-blue-vif/60 hover:bg-brand-blue-vif/[0.04]"
      >
        <Plus size={16} aria-hidden /> Ajouter une question
      </button>

      {/* Barre d'action quiz */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/[0.07] pt-4">
        <div className="min-h-5 flex items-center gap-2 text-sm text-text-muted">
          <HelpCircle size={15} aria-hidden />
          <AnimatePresence mode="wait">
            {error ? (
              <InlineMessage tone="error" key="err">
                {error}
              </InlineMessage>
            ) : saved ? (
              <InlineMessage tone="success" key="ok">
                Quiz enregistré ✓
              </InlineMessage>
            ) : (
              <span key="idle">
                {questions.length} question{questions.length > 1 ? "s" : ""}
              </span>
            )}
          </AnimatePresence>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={pending}>
          <Save size={15} aria-hidden /> Enregistrer le quiz
        </Button>
      </div>
    </div>
  );
}
