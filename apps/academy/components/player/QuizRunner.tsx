"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Circle,
  CheckSquare,
  Square,
  Loader2,
  RotateCcw,
  Trophy,
  Info,
  Award,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { buttonClasses, cn } from "@da/ui";
import { submitQuiz, type SubmitQuizResult, type QuizCorrection } from "@/lib/learn-actions";
import type { AssessmentForTaking, TakingQuestion } from "@/lib/learn-queries";

/* ══════════════════════════════════════════════════════════════════════════
   QuizRunner (§17 · §18) — passage d'une évaluation à correction automatique.
   Le scoring est 100 % serveur : les réponses correctes n'arrivent au client
   qu'APRÈS soumission, via `submitQuiz`. Encodage des réponses :
   · SINGLE_CHOICE   = index (number)
   · MULTIPLE_CHOICE = number[] (indices)
   · TRUE_FALSE      = bool (true = Vrai)
   · SHORT_ANSWER    = string (texte libre, normalisé serveur)
   · MATCHING        = string[] longueur left[] · slot i = TEXTE droit choisi (init "")
   · ORDERING        = string[] = suite des TEXTES dans l'ordre choisi (jamais d'index)
   LONG_ANSWER (et tout type inconnu) reste corrigé manuellement.
   ══════════════════════════════════════════════════════════════════════════ */

type AnswerValue = number | number[] | boolean | string | string[];
const AUTO_TYPES = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "MATCHING",
  "ORDERING",
] as const;
const TF_OPTIONS = ["Vrai", "Faux"];

function isAuto(t: string): boolean {
  return (AUTO_TYPES as readonly string[]).includes(t);
}

/** Réponses par défaut : MATCHING → slots à -1, ORDERING → TEXTES dans l'ordre affiché. */
function buildInitialAnswers(questions: TakingQuestion[]): Record<string, AnswerValue> {
  const init: Record<string, AnswerValue> = {};
  for (const q of questions) {
    if (q.type === "MATCHING" && q.matching) {
      init[q.id] = q.matching.left.map(() => "");
    } else if (q.type === "ORDERING" && q.ordering) {
      init[q.id] = q.ordering.map((it) => it.text);
    }
  }
  return init;
}

/** Une question est « répondue » selon son type (pour le compteur / le gate). */
function isAnswered(q: TakingQuestion, value: AnswerValue | undefined): boolean {
  switch (q.type) {
    case "SHORT_ANSWER":
      return typeof value === "string" && value.trim().length > 0;
    case "MATCHING":
      return Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string" && v.trim() !== "");
    case "ORDERING":
      return true; // un ordre par défaut existe toujours
    default:
      return value !== undefined; // types à choix
  }
}

export function QuizRunner({ assessment }: { assessment: AssessmentForTaking }) {
  const reduce = useReducedMotion();
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>(() =>
    buildInitialAnswers(assessment.questions),
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Extract<SubmitQuizResult, { ok: true }> | null>(null);
  const [attemptsLeft, setAttemptsLeft] = React.useState<number | null>(assessment.attemptsRemaining);

  const exhausted = attemptsLeft !== null && attemptsLeft <= 0;
  const corrections = React.useMemo(
    () => new Map((result?.corrections ?? []).map((c) => [c.questionId, c])),
    [result],
  );

  const autoQuestions = assessment.questions.filter((q) => isAuto(q.type));
  const answeredCount = autoQuestions.filter((q) => isAnswered(q, answers[q.id])).length;

  function setAnswer(id: string, value: AnswerValue) {
    if (result) return; // verrouillé après soumission
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMulti(id: string, index: number) {
    if (result) return;
    setAnswers((prev) => {
      const cur = Array.isArray(prev[id]) ? (prev[id] as number[]) : [];
      const next = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index];
      return { ...prev, [id]: next };
    });
  }

  // MATCHING : associe le slot `leftIndex` au TEXTE droit choisi (colonne mélangée).
  function setMatch(id: string, leftIndex: number, rightText: string) {
    if (result) return;
    setAnswers((prev) => {
      const cur = Array.isArray(prev[id]) ? [...(prev[id] as string[])] : [];
      cur[leftIndex] = rightText;
      return { ...prev, [id]: cur };
    });
  }

  // ORDERING : déplace l'item (texte) en position `from` d'un cran (dir = -1 haut / +1 bas).
  function moveOrder(id: string, from: number, dir: -1 | 1) {
    if (result) return;
    setAnswers((prev) => {
      const cur = Array.isArray(prev[id]) ? [...(prev[id] as string[])] : [];
      const to = from + dir;
      if (to < 0 || to >= cur.length) return prev;
      [cur[from], cur[to]] = [cur[to], cur[from]];
      return { ...prev, [id]: cur };
    });
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const res = await submitQuiz(assessment.id, answers);
      if (res.ok) {
        setResult(res);
        setAttemptsLeft(res.attemptsRemaining);
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } else {
        setError(res.error);
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers(buildInitialAnswers(assessment.questions));
    setError(null);
  }

  const canRetry = result && !result.passed && (attemptsLeft === null || attemptsLeft > 0);

  return (
    <div className="space-y-6">
      {/* ── Bandeau d'état / résultat ── */}
      <AnimatePresence mode="wait">
        {result ? (
          <ResultBanner key="result" result={result} />
        ) : (
          <motion.div
            key="intro"
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-navy/[0.08] bg-surface-secondary/70 px-5 py-4 text-sm"
          >
            <span className="inline-flex items-center gap-2 font-semibold text-navy">
              <Trophy size={16} className="text-brand-violet" aria-hidden />
              Seuil de réussite : {assessment.passingScore}%
            </span>
            <span className="text-text-secondary">
              {autoQuestions.length} question{autoQuestions.length > 1 ? "s" : ""}
            </span>
            <span className="text-text-secondary">
              {attemptsLeft === null
                ? "Tentatives illimitées"
                : `${attemptsLeft} tentative${attemptsLeft > 1 ? "s" : ""} restante${attemptsLeft > 1 ? "s" : ""}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {exhausted && !result && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-[#92400E]">
          <AlertTriangle size={16} aria-hidden />
          Vous avez épuisé toutes vos tentatives pour cette évaluation.
        </div>
      )}

      {/* ── Questions ── */}
      <ol className="space-y-5">
        {assessment.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            question={q}
            answer={answers[q.id]}
            correction={corrections.get(q.id) ?? null}
            locked={!!result}
            onSingle={(idx) => setAnswer(q.id, idx)}
            onMulti={(idx) => toggleMulti(q.id, idx)}
            onBool={(val) => setAnswer(q.id, val)}
            onText={(val) => setAnswer(q.id, val)}
            onMatch={(leftIndex, rightText) => setMatch(q.id, leftIndex, rightText)}
            onOrderMove={(pos, dir) => moveOrder(q.id, pos, dir)}
          />
        ))}
      </ol>

      {/* ── Actions ── */}
      {error && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-sm font-medium text-error">
          {error}
        </p>
      )}

      {!result ? (
        <div className="flex flex-col items-center gap-2">
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={busy || exhausted || answeredCount === 0}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Correction…
              </>
            ) : (
              <>
                <CheckCircle2 size={18} aria-hidden />
                Soumettre mes réponses
              </>
            )}
          </motion.button>
          <p className="text-xs text-text-muted">
            {answeredCount}/{autoQuestions.length} question{autoQuestions.length > 1 ? "s" : ""}{" "}
            répondue{answeredCount > 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        canRetry && (
          <div className="flex justify-center">
            <button type="button" onClick={retry} className={buttonClasses({ variant: "outline", size: "lg" })}>
              <RotateCcw size={18} aria-hidden />
              Réessayer{attemptsLeft !== null ? ` (${attemptsLeft} restante${attemptsLeft > 1 ? "s" : ""})` : ""}
            </button>
          </div>
        )
      )}
    </div>
  );
}

/* ─── Bandeau de résultat ──────────────────────────────────────────────────── */

function ResultBanner({ result }: { result: Extract<SubmitQuizResult, { ok: true }> }) {
  const reduce = useReducedMotion();
  const passed = result.passed;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "overflow-hidden rounded-2xl border p-6 text-center",
        passed ? "border-success/30 bg-success/[0.07]" : "border-error/25 bg-error/[0.06]",
      )}
    >
      <span
        className={cn(
          "mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full text-white shadow-brand",
          passed ? "bg-success" : "bg-error",
        )}
      >
        {passed ? <Trophy size={30} aria-hidden /> : <XCircle size={30} aria-hidden />}
      </span>
      <p className="font-display text-3xl font-bold text-navy">{result.score}%</p>
      <p className={cn("mt-1 font-display text-lg font-bold", passed ? "text-success" : "text-error")}>
        {passed ? "Évaluation réussie !" : "Évaluation non validée"}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        Seuil requis : {result.passingScore}% · Tentative n°{result.attemptNumber}
      </p>

      {passed && result.courseCompleted && (
        <div className="mx-auto mt-5 max-w-sm rounded-xl border border-brand-violet/20 bg-white/70 p-4">
          <p className="flex items-center justify-center gap-2 font-display text-sm font-bold text-navy">
            <Award size={16} className="text-brand-violet" aria-hidden />
            Formation terminée à 100 %
          </p>
          {result.certificateIssued && (
            <p className="mt-1 text-xs text-text-secondary">Votre certificat a été généré.</p>
          )}
          <Link
            href="/espace/certificats"
            className={buttonClasses({ size: "sm", className: "mt-3 inline-flex" })}
          >
            Voir mon certificat
          </Link>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Carte d'une question ─────────────────────────────────────────────────── */

function QuestionCard({
  index,
  question,
  answer,
  correction,
  locked,
  onSingle,
  onMulti,
  onBool,
  onText,
  onMatch,
  onOrderMove,
}: {
  index: number;
  question: TakingQuestion;
  answer: AnswerValue | undefined;
  correction: QuizCorrection | null;
  locked: boolean;
  onSingle: (index: number) => void;
  onMulti: (index: number) => void;
  onBool: (value: boolean) => void;
  onText: (value: string) => void;
  onMatch: (leftIndex: number, rightText: string) => void;
  onOrderMove: (position: number, dir: -1 | 1) => void;
}) {
  const reduce = useReducedMotion();
  const options =
    question.type === "TRUE_FALSE" ? TF_OPTIONS : Array.isArray(question.options) ? question.options : [];
  const auto = isAuto(question.type);

  const matching = question.type === "MATCHING" ? question.matching : null;
  const ordering = question.type === "ORDERING" ? question.ordering : null;

  // Ensemble des indices corrects (révélés après soumission — types à choix).
  const correctSet = React.useMemo(() => {
    if (!correction) return null;
    const ca = correction.correctAnswer;
    if (typeof ca === "number") return new Set([ca]);
    if (Array.isArray(ca)) return new Set(ca);
    if (typeof ca === "boolean") return new Set([ca ? 0 : 1]); // Vrai=0, Faux=1
    return new Set<number>();
  }, [correction]);

  function isSelected(i: number): boolean {
    if (question.type === "MULTIPLE_CHOICE") return Array.isArray(answer) && (answer as number[]).includes(i);
    if (question.type === "TRUE_FALSE") return typeof answer === "boolean" && (answer ? 0 : 1) === i;
    return answer === i;
  }

  function handlePick(i: number) {
    if (question.type === "MULTIPLE_CHOICE") onMulti(i);
    else if (question.type === "TRUE_FALSE") onBool(i === 0);
    else onSingle(i);
  }

  const multi = question.type === "MULTIPLE_CHOICE";
  const selectClasses =
    "w-full appearance-none rounded-lg border border-navy/[0.1] bg-white px-3 py-2 pr-9 text-sm text-navy outline-none transition-colors hover:border-brand-blue-vif/40 focus-visible:border-brand-blue-royal focus-visible:ring-2 focus-visible:ring-brand-blue-royal/30 disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <li className="rounded-2xl border border-navy/[0.08] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
            correction
              ? correction.correct
                ? "bg-success text-white"
                : "bg-error text-white"
              : "bg-gradient-da text-white",
          )}
        >
          {correction ? (
            correction.correct ? (
              <CheckCircle2 size={16} aria-hidden />
            ) : (
              <XCircle size={16} aria-hidden />
            )
          ) : (
            index + 1
          )}
        </span>
        <p className="pt-0.5 font-medium leading-relaxed text-navy">{question.question}</p>
      </div>

      {!auto ? (
        <p className="rounded-lg border border-navy/[0.08] bg-surface-secondary px-3.5 py-2.5 text-sm text-text-secondary">
          Question à réponse libre — corrigée manuellement par un formateur.
        </p>
      ) : question.type === "SHORT_ANSWER" ? (
        /* ── Réponse courte ── */
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            Votre réponse
          </label>
          <input
            type="text"
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onText(e.target.value)}
            disabled={locked}
            aria-label="Votre réponse"
            placeholder="Saisissez votre réponse…"
            className={cn(
              "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition-colors",
              "placeholder:text-text-muted focus-visible:border-brand-blue-royal focus-visible:ring-2 focus-visible:ring-brand-blue-royal/30",
              locked && "cursor-not-allowed opacity-90",
              correction
                ? correction.correct
                  ? "border-success/50 bg-success/[0.05]"
                  : "border-error/50 bg-error/[0.05]"
                : "border-navy/[0.12] hover:border-brand-blue-vif/40",
            )}
          />
        </div>
      ) : matching ? (
        /* ── Appariement ── */
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Associez chaque élément à sa correspondance
          </p>
          <ul className="space-y-2.5">
            {matching.left.map((leftText, i) => {
              const val = Array.isArray(answer) && typeof (answer as string[])[i] === "string" ? (answer as string[])[i] : "";
              return (
                <li
                  key={i}
                  className="flex flex-col gap-2 rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="flex-1 text-sm font-medium text-navy">{leftText}</span>
                  <ChevronDown
                    size={15}
                    className="hidden shrink-0 -rotate-90 text-text-muted sm:block"
                    aria-hidden
                  />
                  {locked ? (
                    <span
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm",
                        val ? "border-navy/[0.1] bg-white text-navy/85" : "border-navy/[0.08] bg-white text-text-muted",
                      )}
                    >
                      {val || "Aucune réponse"}
                    </span>
                  ) : (
                    <div className="relative flex-1">
                      <select
                        aria-label={`Associer : ${leftText}`}
                        value={val}
                        onChange={(e) => onMatch(i, e.target.value)}
                        className={selectClasses}
                      >
                        <option value="">— Choisir —</option>
                        {matching.right.map((r, ri) => (
                          <option key={ri} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                        aria-hidden
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : ordering ? (
        /* ── Ordonnancement ── */
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Réordonnez les éléments (du premier au dernier)
          </p>
          <ul className="space-y-2">
            {(Array.isArray(answer) ? (answer as string[]) : ordering.map((it) => it.text)).map((text, pos, arr) => (
              <motion.li
                key={text}
                layout={reduce ? false : "position"}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="flex items-center gap-3 rounded-xl border border-navy/[0.1] bg-white px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-da text-xs font-bold text-white">
                  {pos + 1}
                </span>
                <span className="flex-1 text-sm text-navy">{text}</span>
                {!locked && (
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={pos === 0}
                      onClick={() => onOrderMove(pos, -1)}
                      aria-label={`Monter : ${text}`}
                      className="grid h-7 w-7 place-items-center rounded-md border border-navy/[0.1] text-text-secondary transition-colors hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.06] hover:text-brand-blue-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-royal/30 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronUp size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={pos === arr.length - 1}
                      onClick={() => onOrderMove(pos, 1)}
                      aria-label={`Descendre : ${text}`}
                      className="grid h-7 w-7 place-items-center rounded-md border border-navy/[0.1] text-text-secondary transition-colors hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.06] hover:text-brand-blue-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-royal/30 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronDown size={16} aria-hidden />
                    </button>
                  </span>
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        /* ── Choix (SINGLE / MULTIPLE / TRUE_FALSE) ── */
        <ul className="space-y-2">
          {options.map((opt, i) => {
            const selected = isSelected(i);
            const isCorrect = correctSet?.has(i);
            const state = correction
              ? isCorrect
                ? "correct"
                : selected
                  ? "wrong"
                  : "idle"
              : selected
                ? "selected"
                : "idle";

            const Icon = multi
              ? selected
                ? CheckSquare
                : Square
              : selected
                ? CheckCircle2
                : Circle;

            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => handlePick(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all",
                    !locked && "hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.04]",
                    state === "idle" && "border-navy/[0.1] bg-white text-navy/85",
                    state === "selected" && "border-brand-blue-royal bg-brand-blue-royal/[0.06] text-navy",
                    state === "correct" && "border-success/50 bg-success/[0.08] text-navy",
                    state === "wrong" && "border-error/50 bg-error/[0.08] text-navy",
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0",
                      state === "correct" && "text-success",
                      state === "wrong" && "text-error",
                      state === "selected" && "text-brand-blue-royal",
                      state === "idle" && "text-text-muted",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1">{opt}</span>
                  {state === "correct" && (
                    <span className="text-xs font-semibold text-success">Bonne réponse</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bonne réponse en texte (réponse courte / appariement / ordonnancement),
          révélée après soumission uniquement — même style « info » bleu. */}
      {correction?.correctText && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.05] px-3.5 py-2.5 text-sm text-navy/80">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
          <span>{correction.correctText}</span>
        </div>
      )}

      {/* Explication révélée après soumission */}
      {correction?.explanation && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.05] px-3.5 py-2.5 text-sm text-navy/80">
          <Info size={15} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
          <span>{correction.explanation}</span>
        </div>
      )}
    </li>
  );
}
