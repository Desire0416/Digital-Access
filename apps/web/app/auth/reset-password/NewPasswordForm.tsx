"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, Lock } from "lucide-react";
import { Button, Field, Input, cn } from "@da/ui";
import { resetPassword } from "../actions";

const rules = [
  { label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
  { label: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Un chiffre", test: (v: string) => /[0-9]/.test(v) },
];

export function NewPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const valid = rules.every((r) => r.test(password));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError("Le mot de passe ne respecte pas les critères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    startTransition(async () => {
      const res = await resetPassword({ token, password });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/auth/login"), 2200);
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-da text-white shadow-brand">
          <Check size={38} strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Mot de passe réinitialisé
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-text-secondary">
          Votre mot de passe a été mis à jour. Redirection vers la connexion…
        </p>
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
          Nouveau mot de passe
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Choisissez un nouveau mot de passe
        </h1>
        <p className="mt-2.5 text-text-secondary">
          Il doit être solide pour protéger votre compte.
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
        <Field label="Nouveau mot de passe" htmlFor="password" required>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-10"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Masquer" : "Afficher"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:text-navy"
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <AnimatePresence initial={false}>
          {password.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid gap-1.5 overflow-hidden"
            >
              {rules.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li key={rule.label} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full",
                        ok ? "bg-gradient-da text-white" : "bg-navy/10 text-text-muted",
                      )}
                    >
                      <Check size={10} strokeWidth={3.5} />
                    </span>
                    <span className={ok ? "text-navy" : "text-text-muted"}>{rule.label}</span>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        <Field label="Confirmez le mot de passe" htmlFor="confirm" required>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              id="confirm"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              error={confirm.length > 0 && confirm !== password}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Field>

        <Button type="submit" size="lg" loading={pending} className="w-full">
          {pending ? "Mise à jour…" : "Réinitialiser mon mot de passe"}
          {!pending && <ArrowRight size={18} />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        <Link
          href="/auth/login"
          className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
        >
          Retour à la connexion
        </Link>
      </p>
    </motion.div>
  );
}
