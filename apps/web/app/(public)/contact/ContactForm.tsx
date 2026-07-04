"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { Button, Field, Input, Textarea, Monogram } from "@da/ui";
import { sendContactMessage, type ContactInput } from "./actions";

type FieldName = keyof ContactInput;

const empty: Record<FieldName, string> = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

/** Validation légère côté client — miroir du schéma serveur, pour un retour immédiat. */
function validateField(name: FieldName, value: string): string | undefined {
  const v = value.trim();
  switch (name) {
    case "name":
      if (v.length < 2) return "Votre nom est requis.";
      return;
    case "email":
      if (!v) return "Votre email est requis.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Adresse email invalide.";
      return;
    case "message":
      if (v.length < 10) return "Votre message doit contenir au moins 10 caractères.";
      return;
    default:
      return;
  }
}

export function ContactForm() {
  const [values, setValues] = React.useState<Record<FieldName, string>>(empty);
  const [errors, setErrors] = React.useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<FieldName, boolean>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function update(name: FieldName, value: string) {
    setValues((s) => ({ ...s, [name]: value }));
    // Ne révèle l'erreur en temps réel qu'après un premier blur sur le champ.
    if (touched[name]) {
      setErrors((e) => ({ ...e, [name]: validateField(name, value) }));
    }
  }

  function handleBlur(name: FieldName) {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((e) => ({ ...e, [name]: validateField(name, values[name]) }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    // Valide l'ensemble des champs requis avant envoi.
    const required: FieldName[] = ["name", "email", "message"];
    const nextErrors: Partial<Record<FieldName, string>> = {};
    for (const field of required) {
      const err = validateField(field, values[field]);
      if (err) nextErrors[field] = err;
    }
    setTouched({ name: true, email: true, message: true, phone: true, subject: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Merci de corriger les champs signalés avant l'envoi.");
      return;
    }

    startTransition(async () => {
      const result = await sendContactMessage(values);
      if (result.ok) {
        setSuccess(true);
      } else {
        setErrors(result.errors);
        setFormError(result.message ?? "Une erreur est survenue. Réessayez.");
      }
    });
  }

  function reset() {
    setValues(empty);
    setErrors({});
    setTouched({});
    setFormError(null);
    setSuccess(false);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 shadow-brand sm:p-8">
      {/* Liseré dégradé haut */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center py-10 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
              className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-da text-white shadow-brand-lg"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-gradient-da opacity-60 animate-pulse-ring"
              />
              <Check size={38} strokeWidth={3} />
            </motion.span>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6 font-display text-2xl font-extrabold text-navy"
            >
              Message envoyé !
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="mt-3 max-w-sm text-text-secondary"
            >
              Merci {values.name ? values.name.split(" ")[0] : ""}, nous avons bien reçu votre
              demande. Notre équipe vous répondra sous 24h ouvrées à l'adresse{" "}
              <span className="font-medium text-navy">{values.email}</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Button variant="outline" size="md" onClick={reset} type="button">
                Envoyer un autre message
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <Monogram size={38} variant="gradient" />
              <div>
                <h2 className="font-display text-xl font-bold text-navy">
                  Écrivez-nous
                </h2>
                <p className="text-sm text-text-secondary">
                  Réponse sous 24h ouvrées.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nom complet" htmlFor="name" required error={errors.name}>
                <Input
                  id="name"
                  name="name"
                  placeholder="Aya Koffi"
                  autoComplete="name"
                  value={values.name}
                  error={!!errors.name}
                  onChange={(e) => update("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                />
              </Field>

              <Field label="Email" htmlFor="email" required error={errors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="vous@exemple.ci"
                  autoComplete="email"
                  value={values.email}
                  error={!!errors.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                />
              </Field>

              <Field
                label="Téléphone"
                htmlFor="phone"
                hint="Optionnel — pour un rappel rapide."
                error={errors.phone}
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+225 07 00 00 00 00"
                  autoComplete="tel"
                  value={values.phone}
                  error={!!errors.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                />
              </Field>

              <Field label="Objet" htmlFor="subject" error={errors.subject}>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Ex. Création de site vitrine"
                  value={values.subject}
                  error={!!errors.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  onBlur={() => handleBlur("subject")}
                />
              </Field>
            </div>

            <Field label="Votre message" htmlFor="message" required error={errors.message}>
              <Textarea
                id="message"
                name="message"
                rows={6}
                placeholder="Parlez-nous de votre projet, vos objectifs et vos délais…"
                value={values.message}
                error={!!errors.message}
                onChange={(e) => update("message", e.target.value)}
                onBlur={() => handleBlur("message")}
              />
            </Field>

            <AnimatePresence>
              {formError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-sm font-medium text-error"
                >
                  {formError}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-muted">
                En envoyant ce formulaire, vous acceptez d'être recontacté par notre équipe.
              </p>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isPending}
                className="w-full shrink-0 sm:w-auto"
              >
                {isPending ? (
                  "Envoi en cours…"
                ) : (
                  <>
                    Envoyer le message
                    <Send size={16} />
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
