"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, Input } from "@da/ui";
import { loginAction, googleLoginAction, type LoginState } from "./actions";
import { GoogleButton } from "@/components/auth/GoogleButton";

/* Formulaire de connexion §15 — credentials via Server Action, erreurs FR. */

export function LoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-6">
      {googleEnabled && (
        <>
          <form action={googleLoginAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <GoogleButton label="Continuer avec Google" />
          </form>
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-navy/10" />
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">ou</span>
            <span className="h-px flex-1 bg-navy/10" />
          </div>
        </>
      )}

      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

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

        <Field label="Adresse email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            required
          />
        </Field>

        <Field label="Mot de passe" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-navy"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            href="/mot-de-passe-oublie"
            className="text-sm font-medium text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={pending} className="w-full">
          Se connecter
        </Button>
      </form>
    </div>
  );
}
