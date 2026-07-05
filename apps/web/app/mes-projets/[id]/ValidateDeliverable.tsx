"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RotateCcw, CircleCheck, X } from "lucide-react";
import { Button, Textarea, Field, cn } from "@da/ui";
import { respondToDeliverable } from "@/lib/portal-actions";

type Mode = null | "approve" | "revise";

/** Boutons d'action client sur un livrable d'étape : approuver ou demander des corrections. */
export function ValidateDeliverable({
  projectId,
  stageName,
}: {
  projectId: string;
  stageName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>(null);
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  function submit(approve: boolean) {
    setFeedback(null);
    startTransition(async () => {
      const res = await respondToDeliverable({
        projectId,
        stageName,
        approve,
        note: note.trim() || undefined,
      });
      if (res.ok) {
        setMode(null);
        setNote("");
        setFeedback({
          type: "success",
          message: approve
            ? "Livrable approuvé — merci ! L'équipe est notifiée."
            : "Demande de corrections envoyée à l'équipe.",
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-navy/[0.08] bg-surface-secondary/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
        Votre validation
      </p>

      <AnimatePresence mode="wait">
        {mode === "revise" ? (
          <motion.div
            key="revise"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              <Field
                label="Que faut-il corriger ?"
                htmlFor={`revise-${stageName}`}
                hint="Décrivez précisément les ajustements souhaités."
              >
                <Textarea
                  id={`revise-${stageName}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex. : la couleur du bouton principal doit être plus foncée…"
                  className="min-h-24"
                />
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={pending}
                  onClick={() => submit(false)}
                >
                  <RotateCcw size={15} />
                  Envoyer la demande
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setMode(null);
                    setNote("");
                  }}
                >
                  <X size={15} />
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex flex-wrap gap-2"
          >
            <Button
              variant="primary"
              size="sm"
              loading={pending}
              onClick={() => submit(true)}
            >
              <Check size={15} />
              Approuver le livrable
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                setFeedback(null);
                setMode("revise");
              }}
            >
              <RotateCcw size={15} />
              Demander des corrections
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-3 flex items-center gap-1.5 text-xs font-medium",
              feedback.type === "success" ? "text-success" : "text-error",
            )}
          >
            {feedback.type === "success" ? <CircleCheck size={14} /> : <X size={14} />}
            {feedback.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
