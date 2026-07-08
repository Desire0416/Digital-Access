"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button, Textarea, cn } from "@da/ui";
import { reviewSubmission } from "@/lib/project-actions";

type Decision = "validate" | "revise" | "reject";

const OPTIONS: { value: Decision; label: string; icon: React.ReactNode; tone: string; active: string }[] = [
  { value: "validate", label: "Valider", icon: <CheckCircle2 size={18} />, tone: "border-success/30 text-success", active: "border-success bg-success/[0.08]" },
  { value: "revise", label: "Demander une révision", icon: <RotateCcw size={18} />, tone: "border-warning/30 text-warning", active: "border-warning bg-warning/[0.08]" },
  { value: "reject", label: "Rejeter", icon: <XCircle size={18} />, tone: "border-error/30 text-error", active: "border-error bg-error/[0.08]" },
];

export function ReviewForm({ submissionId, passingScore }: { submissionId: string; passingScore: number }) {
  const router = useRouter();
  const [decision, setDecision] = React.useState<Decision | null>(null);
  const [score, setScore] = React.useState<number>(passingScore);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const needsScore = decision === "validate" || decision === "revise";

  function submit() {
    setError(null);
    if (!decision) {
      setError("Choisissez une décision.");
      return;
    }
    if (decision !== "validate" && !feedback.trim()) {
      setError("Un retour écrit est requis pour une révision ou un rejet.");
      return;
    }
    startTransition(async () => {
      const res = await reviewSubmission(submissionId, {
        decision,
        score: needsScore ? score : undefined,
        feedback: feedback.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/reviews");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-bold text-navy">Votre évaluation</h2>

      <div className="grid gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setDecision(o.value)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
              decision === o.value ? o.active : "border-navy/10 text-navy hover:border-navy/20",
              decision === o.value ? "" : "bg-surface-primary",
            )}
          >
            <span className={cn(decision === o.value ? "" : "text-text-muted", o.tone.split(" ")[1])}>{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>

      {needsScore && (
        <div>
          <label className="mb-1.5 flex items-center justify-between text-sm font-semibold text-navy">
            Score <span className={cn("font-bold", score >= passingScore ? "text-success" : "text-warning")}>{score}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full accent-brand-violet"
          />
          <p className="mt-1 text-xs text-text-muted">Seuil de réussite : {passingScore}%.</p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy">
          Retour à l'apprenant {decision !== "validate" && <span className="text-error">*</span>}
        </label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          placeholder="Points forts, axes d'amélioration, conseils concrets…"
        />
      </div>

      {error && <p className="text-sm font-medium text-error">{error}</p>}

      <Button onClick={submit} loading={pending} disabled={!decision}>
        Enregistrer l'évaluation
      </Button>
    </div>
  );
}
