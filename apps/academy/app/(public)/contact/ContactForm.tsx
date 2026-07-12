"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Field, Input, Textarea } from "@da/ui";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { submitContact, type ContactResult } from "./actions";

/* Formulaire de contact — action serveur (Zod + email). État progressif. */

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactResult | null, FormData>(
    submitContact,
    null,
  );

  if (state?.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center rounded-2xl border border-success/30 bg-success/5 px-6 py-14 text-center"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 size={30} />
        </span>
        <h3 className="mt-5 font-display text-lg font-bold text-navy">Message envoyé</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-secondary">{state.message}</p>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Piège à robots (caché) */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" htmlFor="name" required>
          <Input id="name" name="name" placeholder="Votre nom" required autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="vous@exemple.com"
            required
            autoComplete="email"
          />
        </Field>
      </div>

      <Field label="Objet" htmlFor="subject" required>
        <Input id="subject" name="subject" placeholder="Objet de votre message" required />
      </Field>

      <Field label="Message" htmlFor="message" required>
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Comment pouvons-nous vous aider ?"
          required
        />
      </Field>

      <AnimatePresence>
        {state && !state.ok && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm font-medium text-error"
          >
            <AlertCircle size={16} className="shrink-0" />
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
        {!pending && <Send size={17} />}
        Envoyer le message
      </Button>
    </form>
  );
}
