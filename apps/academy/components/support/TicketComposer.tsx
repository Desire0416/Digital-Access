"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LifeBuoy, Loader2, Plus, X } from "lucide-react";
import { cn } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { createTicket } from "@/lib/support-actions";
import { TICKET_CATEGORIES, TICKET_CATEGORY_LABEL } from "@/lib/support-labels";
import type { TicketCategory } from "@da/academy-db/client";

/* Formulaire d'ouverture de ticket (§35.2). */
export function TicketComposer() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState<TicketCategory>("TECHNICAL");
  const [body, setBody] = React.useState("");
  const [screenshot, setScreenshot] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState("");

  function submit() {
    setError("");
    start(async () => {
      const attachments = screenshot ? [{ url: screenshot, name: "Capture" }] : undefined;
      const res = await createTicket({ subject, category, body, attachments });
      if (res.ok) {
        if (res.id) router.push(`/espace/support/${res.id}`);
        else router.refresh();
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Une erreur est survenue.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
      >
        <Plus size={16} aria-hidden />
        Nouvelle demande
      </button>
    );
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-5 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-navy">
          <LifeBuoy size={18} className="text-brand-blue-royal" aria-hidden />
          Ouvrir une demande
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
          aria-label="Fermer"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy">Sujet</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={160}
            placeholder="Résumez votre demande en une ligne"
            className="h-11 w-full rounded-lg border border-navy/12 bg-surface-primary px-3.5 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy">Catégorie</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="h-11 w-full rounded-lg border border-navy/12 bg-surface-primary px-3 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60"
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TICKET_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy">Votre message</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={6000}
            placeholder="Décrivez votre problème avec un maximum de détails (étapes, appareil, capture…)."
            className="w-full resize-y rounded-lg border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-navy">Capture d'écran (facultatif)</span>
          <ImageUpload value={screenshot} onChange={setScreenshot} folder="support" aspect="16 / 7" />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-error/[0.08] px-3 py-2 text-sm font-medium text-error"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5",
              pending && "opacity-70",
            )}
          >
            {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
            Envoyer ma demande
          </button>
        </div>
      </div>
    </motion.div>
  );
}
