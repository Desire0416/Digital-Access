"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button, Field, Input, buttonClasses } from "@da/ui";
import { resetPassword } from "@/lib/auth-actions";

/* Définition d'un nouveau mot de passe §15 — jauge de force + confirmation. */

type State = { ok?: boolean; error?: string; message?: string };

async function action(_prev: State, formData: FormData): Promise<State> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }
  const res = await resetPassword(token, password);
  if (res.ok) return { ok: true, message: res.message };
  return { error: res.error };
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const STRENGTH = [
  { label: "Très faible", color: "#DC2626" },
  { label: "Faible", color: "#F59E0B" },
  { label: "Correct", color: "#3B82F6" },
  { label: "Bon", color: "#059669" },
  { label: "Excellent", color: "#5B3FA8" },
];

export function NewPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {});
  const [show, setShow] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const score = scorePassword(password);
  const meter = password ? STRENGTH[score] : null;

  if (state.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-5 text-center"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={36} />
        </span>
        <p className="text-sm leading-relaxed text-text-secondary">
          {state.message ?? "Mot de passe mis à jour. Vous pouvez vous connecter."}
        </p>
        <Link href="/connexion" className={buttonClasses({ size: "lg", className: "w-full" })}>
          Se connecter
        </Link>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          role="alert"
        >
          {state.error}
        </motion.div>
      )}

      <Field
        label="Nouveau mot de passe"
        htmlFor="password"
        required
        hint="Au moins 8 caractères, une majuscule et un chiffre."
      >
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-navy"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      {meter && (
        <div className="-mt-3 space-y-1.5" aria-live="polite">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                initial={false}
                animate={{ backgroundColor: i < score ? meter.color : "rgba(26,26,46,0.10)" }}
                transition={{ duration: 0.25 }}
              />
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: meter.color }}>
            Robustesse : {meter.label}
          </p>
        </div>
      )}

      <Field label="Confirmez le mot de passe" htmlFor="confirm" required>
        <Input
          id="confirm"
          name="confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        Réinitialiser le mot de passe
      </Button>
    </form>
  );
}
