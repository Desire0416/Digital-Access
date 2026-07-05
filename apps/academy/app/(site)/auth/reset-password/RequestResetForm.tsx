"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mail, MailCheck } from "lucide-react";
import { Button, Field, Input } from "@da/ui";
import { requestPasswordReset } from "@/app/auth/actions";

export function RequestResetForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Adresse email invalide.");
      return;
    }
    startTransition(async () => {
      const res = await requestPasswordReset(email.trim());
      if (res.ok) setSent(true);
      else setError(res.error);
    });
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-da text-white shadow-brand">
          <MailCheck size={34} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Vérifiez votre boîte email
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-text-secondary">
          Si un compte est associé à{" "}
          <span className="font-semibold text-navy">{email.trim()}</span>, un
          lien de réinitialisation vient d'être envoyé. Il est valable 1 heure.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-block font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
        >
          Retour à la connexion
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
          Mot de passe oublié
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Réinitialisons ça
        </h1>
        <p className="mt-2.5 text-text-secondary">
          Saisissez votre adresse email : nous vous enverrons un lien pour créer
          un nouveau mot de passe et retrouver vos cours.
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden rounded-lg border border-error/25 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Adresse email" htmlFor="email" required>
          <div className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.ci"
              value={email}
              error={!!error}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </Field>

        <Button type="submit" size="lg" loading={pending} className="w-full">
          {pending ? "Envoi en cours…" : "Envoyer le lien"}
          {!pending && <ArrowRight size={18} />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Vous vous en souvenez ?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
        >
          Se connecter
        </Link>
      </p>
    </motion.div>
  );
}
