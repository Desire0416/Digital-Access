"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, RotateCcw, XCircle, AlertCircle, Send, Gavel } from "lucide-react";
import { Button, Field, Input, Textarea, cn } from "@da/ui";
import { gradeAssignment } from "@/lib/learn-actions";

/* Fiche de correction d'un DEVOIR (§18) — décision segmentée + note + retour.
   gradeAssignment applique le cloisonnement et exige une note ≥ seuil pour
   valider. On reflète cette règle côté client. */

type Decision = "PASSED" | "RETAKE_REQUIRED" | "FAILED";

const DECISIONS: { value: Decision; label: string; icon: typeof CheckCircle2; active: string; ring: string }[] = [
  { value: "PASSED", label: "Valider", icon: CheckCircle2, active: "bg-success text-white", ring: "focus-visible:ring-success/40" },
  { value: "RETAKE_REQUIRED", label: "À retravailler", icon: RotateCcw, active: "bg-warning text-white", ring: "focus-visible:ring-warning/40" },
  { value: "FAILED", label: "Refuser", icon: XCircle, active: "bg-error text-white", ring: "focus-visible:ring-error/40" },
];

export function AssignmentReviewForm({ attemptId, passingScore }: { attemptId: string; passingScore: number }) {
  const router = useRouter();
  const [decision, setDecision] = React.useState<Decision>("PASSED");
  const [score, setScore] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const scoreRequired = decision === "PASSED";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = score.trim();
    let numScore: number | undefined;
    if (trimmed !== "") {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 0 || n > 100) {
        setError("La note doit être un entier entre 0 et 100.");
        return;
      }
      numScore = n;
    }
    if (scoreRequired && numScore === undefined) {
      setError(`Pour valider, indiquez une note atteignant le minimum requis (${passingScore}).`);
      return;
    }
    if (scoreRequired && numScore !== undefined && numScore < passingScore) {
      setError(`La note doit atteindre le minimum requis (${passingScore}) pour valider ce devoir.`);
      return;
    }

    setPending(true);
    const res = await gradeAssignment(attemptId, {
      decision,
      score: numScore,
      feedback: feedback.trim() || undefined,
    });
    setPending(false);

    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center"
      >
        <CheckCircle2 size={36} className="mx-auto text-success" aria-hidden />
        <h3 className="mt-3 font-display text-lg font-bold text-navy">Correction enregistrée</h3>
        <p className="mt-1 text-sm text-text-secondary">
          L&apos;apprenant a été notifié du résultat. Vous pouvez retourner à la file de correction.
        </p>
        <button
          type="button"
          onClick={() => router.push("/correction")}
          className="mt-4 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet"
        >
          Retour à la file
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
      <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-navy sm:text-lg">
        <Gavel size={18} className="text-brand-blue-royal" aria-hidden />
        Décision
      </h2>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Décision de correction">
        {DECISIONS.map((d) => {
          const Icon = d.icon;
          const selected = decision === d.value;
          return (
            <button
              key={d.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setDecision(d.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2",
                d.ring,
                selected ? cn(d.active, "border-transparent shadow-sm") : "border-navy/10 text-navy/70 hover:border-navy/20 hover:bg-surface-secondary/60",
              )}
            >
              <motion.span whileTap={{ scale: 0.9 }}>
                <Icon size={18} aria-hidden />
              </motion.span>
              {d.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
            role="alert"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Field
        label="Note / 100"
        htmlFor="assign-score"
        required={scoreRequired}
        hint={scoreRequired ? `Minimum requis pour valider : ${passingScore}` : "Optionnelle pour un refus ou une demande de reprise"}
      >
        <Input
          id="assign-score"
          type="number"
          min={0}
          max={100}
          step={1}
          inputMode="numeric"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="ex. 85"
          required={scoreRequired}
        />
      </Field>

      <Field label="Retour à l'apprenant" htmlFor="assign-feedback">
        <Textarea
          id="assign-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={6}
          placeholder="Points forts, axes d'amélioration, justification de la note…"
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        <Send size={16} aria-hidden />
        Enregistrer la correction
      </Button>
    </form>
  );
}
