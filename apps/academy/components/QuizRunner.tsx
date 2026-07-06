"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  X,
  ChevronRight,
  RotateCcw,
  Trophy,
  Target,
  Lightbulb,
} from "lucide-react";
import { Button, buttonClasses, cn, GradientText } from "@da/ui";
import { submitQuiz, type QuizSubmitResult } from "@/lib/actions";
import type { QuizData } from "@/lib/types";

/* Confetti CSS déterministe (SSR-safe) — palette DA. */
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 4.1 + (i % 5) * 6) % 100,
  delay: (i % 8) * 0.15,
  duration: 2.2 + (i % 5) * 0.4,
  color: ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#00BCD4", "#7C3AED"][i % 5],
  size: 6 + (i % 4) * 2,
  rotate: (i * 53) % 360,
}));

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.4,
            backgroundColor: c.color,
            borderRadius: 2,
          }}
          initial={{ y: -30, opacity: 0, rotate: c.rotate }}
          animate={{ y: ["-5%", "115%"], opacity: [0, 1, 1, 0], rotate: c.rotate + 200 }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            repeatDelay: 1.6,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

type Phase = "answering" | "feedback" | "result";

export interface QuizRunnerProps {
  quiz: QuizData;
  chapterId: string;
  /** meilleur score précédent (depuis Progress), null si jamais tenté */
  previousScore?: number | null;
  alreadyPassed?: boolean;
  /** Appelé quand ce quiz clôt le cours (100%) — remonte le code du certificat. */
  onCourseCompleted?: (code: string) => void;
}

/**
 * Quiz interactif QCU/QCM : validation par question avec feedback animé
 * (vert pulse / rouge shake + explication), score final noté CÔTÉ SERVEUR.
 */
export function QuizRunner({
  quiz,
  chapterId,
  previousScore,
  alreadyPassed,
  onCourseCompleted,
}: QuizRunnerProps) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("answering");
  const [qIndex, setQIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<number[]>([]);
  const [answers, setAnswers] = React.useState<number[][]>([]);
  const [result, setResult] = React.useState<QuizSubmitResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const question = quiz.questions[qIndex];
  const total = quiz.questions.length;
  if (!question) return null;

  const isCorrect =
    phase === "feedback" &&
    [...selected].sort((a, b) => a - b).join(",") ===
      [...question.correctAnswers].sort((a, b) => a - b).join(",");

  function toggleOption(idx: number) {
    if (phase !== "answering") return;
    setSelected((prev) =>
      question!.multiple
        ? prev.includes(idx)
          ? prev.filter((v) => v !== idx)
          : [...prev, idx]
        : [idx],
    );
  }

  function validate() {
    if (selected.length === 0) return;
    setPhase("feedback");
  }

  async function next() {
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected([]);

    if (qIndex + 1 < total) {
      setQIndex(qIndex + 1);
      setPhase("answering");
      return;
    }

    // Fin du quiz → notation autoritaire côté serveur.
    setSubmitting(true);
    setServerError(null);
    const res = await submitQuiz({ chapterId, answers: newAnswers });
    setSubmitting(false);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    setResult(res);
    setPhase("result");
    if (res.certificateCode) onCourseCompleted?.(res.certificateCode);
    router.refresh();
  }

  function retry() {
    setPhase("answering");
    setQIndex(0);
    setSelected([]);
    setAnswers([]);
    setResult(null);
    setServerError(null);
  }

  /* ─────────────────────────── Écran de résultat ────────────────────────── */
  if (phase === "result" && result?.ok) {
    const passed = result.passed;
    return (
      <div className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-8 text-center sm:p-12">
        {passed && <Confetti />}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 15 }}
          className={cn(
            "relative mx-auto grid h-24 w-24 place-items-center rounded-full text-white shadow-brand",
            passed ? "bg-gradient-da" : "bg-navy/80",
          )}
        >
          {passed ? <Trophy size={42} /> : <Target size={42} />}
        </motion.div>

        <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          {passed ? (
            <>
              Bravo, quiz <GradientText>réussi</GradientText> !
            </>
          ) : (
            "Presque ! Encore un effort"
          )}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-text-secondary">
          {result.correctCount} bonne{result.correctCount > 1 ? "s" : ""} réponse
          {result.correctCount > 1 ? "s" : ""} sur {result.total} — seuil de
          réussite : {quiz.passingScore}%.
          {passed && result.xpGained > 0 && (
            <span className="mt-1 block font-semibold text-accent">
              +{result.xpGained} XP gagnés ✨
            </span>
          )}
        </p>

        {/* Barre de score animée */}
        <div className="mx-auto mt-7 max-w-sm">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-text-secondary">Votre score</span>
            <span className={passed ? "text-success" : "text-warning"}>
              {result.score}%
            </span>
          </div>
          <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-navy/[0.08]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 }}
              className={cn(
                "h-full rounded-full",
                passed ? "bg-gradient-da" : "bg-warning",
              )}
            />
            {/* Repère du seuil */}
            <span
              className="absolute top-0 h-full w-0.5 bg-navy/30"
              style={{ left: `${quiz.passingScore}%` }}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {!passed && (
            <Button variant="primary" size="lg" onClick={retry}>
              <RotateCcw size={17} />
              Réessayer
            </Button>
          )}
          {passed && (
            <Button variant="outline" size="md" onClick={retry}>
              <RotateCcw size={16} />
              Refaire pour le plaisir
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────────────── Écran de question ────────────────────────── */
  return (
    <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-8">
      {/* En-tête : progression du quiz */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-text-secondary">
          Question {qIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-2">
          {(alreadyPassed || (previousScore ?? 0) >= quiz.passingScore) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
              <Check size={12} strokeWidth={3} /> Déjà réussi
            </span>
          )}
          <span className="text-xs text-text-muted">Seuil : {quiz.passingScore}%</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-navy/[0.08]">
        <motion.div
          className="h-full rounded-full bg-gradient-da"
          initial={false}
          animate={{ width: `${((qIndex + (phase === "feedback" ? 1 : 0)) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="mt-6 font-display text-lg font-bold leading-snug text-navy sm:text-xl">
            {question.question}
          </h3>
          {question.multiple && (
            <p className="mt-1 text-xs font-medium text-brand-blue-royal">
              Plusieurs réponses possibles
            </p>
          )}

          {/* Options */}
          <div className="mt-5 grid gap-3">
            {question.options.map((option, idx) => {
              const isSelected = selected.includes(idx);
              const isRight = question.correctAnswers.includes(idx);
              const showState = phase === "feedback";

              return (
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => toggleOption(idx)}
                  disabled={phase === "feedback"}
                  whileTap={phase === "answering" ? { scale: 0.99 } : undefined}
                  animate={
                    showState && isSelected && !isRight
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : showState && isRight
                        ? { scale: [1, 1.02, 1] }
                        : {}
                  }
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-colors sm:text-base",
                    !showState &&
                      (isSelected
                        ? "border-brand-blue-vif bg-brand-blue-vif/[0.07] text-navy"
                        : "border-navy/10 text-navy/80 hover:border-brand-blue-vif/40 hover:bg-navy/[0.02]"),
                    showState &&
                      isRight &&
                      "border-success bg-success/[0.08] text-navy",
                    showState &&
                      isSelected &&
                      !isRight &&
                      "border-error bg-error/[0.06] text-navy",
                    showState && !isSelected && !isRight && "border-navy/10 opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center border-2 text-white",
                      question.multiple ? "rounded-md" : "rounded-full",
                      !showState &&
                        (isSelected
                          ? "border-transparent bg-gradient-da"
                          : "border-navy/25 bg-transparent"),
                      showState && isRight && "border-transparent bg-success",
                      showState && isSelected && !isRight && "border-transparent bg-error",
                      showState && !isSelected && !isRight && "border-navy/20",
                    )}
                  >
                    {(isSelected || (showState && isRight)) &&
                      (showState && isSelected && !isRight ? (
                        <X size={13} strokeWidth={3.5} />
                      ) : (
                        <Check size={13} strokeWidth={3.5} />
                      ))}
                  </span>
                  {option}
                </motion.button>
              );
            })}
          </div>

          {/* Feedback + explication */}
          <AnimatePresence>
            {phase === "feedback" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    "mt-5 rounded-xl border px-4 py-3.5",
                    isCorrect
                      ? "border-success/30 bg-success/[0.06]"
                      : "border-error/25 bg-error/[0.05]",
                  )}
                >
                  <p
                    className={cn(
                      "flex items-center gap-2 text-sm font-bold",
                      isCorrect ? "text-success" : "text-error",
                    )}
                  >
                    {isCorrect ? (
                      <>
                        <Check size={16} strokeWidth={3} /> Bonne réponse !
                      </>
                    ) : (
                      <>
                        <X size={16} strokeWidth={3} /> Ce n'est pas ça…
                      </>
                    )}
                  </p>
                  {question.explanation && (
                    <p className="mt-1.5 flex items-start gap-2 text-sm leading-relaxed text-navy/75">
                      <Lightbulb size={15} className="mt-0.5 shrink-0 text-warning" />
                      {question.explanation}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {serverError && (
            <p className="mt-4 text-sm font-medium text-error">{serverError}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end">
            {phase === "answering" ? (
              <Button
                variant="primary"
                size="md"
                onClick={validate}
                disabled={selected.length === 0}
              >
                Valider ma réponse
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={next} loading={submitting}>
                {qIndex + 1 < total ? (
                  <>
                    Question suivante
                    <ChevronRight size={17} />
                  </>
                ) : submitting ? (
                  "Calcul du score…"
                ) : (
                  "Voir mon résultat"
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
