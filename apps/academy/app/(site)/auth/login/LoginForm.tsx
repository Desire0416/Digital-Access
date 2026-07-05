"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button, Field, Input, cn } from "@da/ui";
import { GoogleButton } from "../GoogleButton";
import { loginUser } from "@/app/auth/actions";

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm({
  googleEnabled = false,
  callbackUrl,
}: {
  googleEnabled?: boolean;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const destination = callbackUrl ?? "/dashboard";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [googlePending, setGooglePending] = React.useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Veuillez saisir votre adresse email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Adresse email invalide.";
    if (!password) next.password = "Veuillez saisir votre mot de passe.";
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    startTransition(async () => {
      const result = await loginUser({ email, password, remember });
      if (result.ok) {
        router.push(destination);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  function handleGoogle() {
    if (googleEnabled) {
      setGooglePending(true);
      void signIn("google", { callbackUrl: destination });
    } else {
      setFormError("La connexion Google sera bientôt disponible.");
    }
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
          Espace apprenant
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Bon retour parmi nous
        </h1>
        <p className="mt-2.5 text-text-secondary">
          Connectez-vous pour reprendre vos cours là où vous vous êtes arrêté.
        </p>
      </div>

      <GoogleButton
        label="Se connecter avec Google"
        onClick={handleGoogle}
        disabled={googlePending || pending}
      />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-navy/10" />
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          ou
        </span>
        <span className="h-px flex-1 bg-navy/10" />
      </div>

      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="rounded-lg border border-error/25 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {formError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field
          label="Adresse email"
          htmlFor="email"
          error={errors.email}
          required
        >
          <div className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.ci"
              value={email}
              error={!!errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              className="pl-10"
            />
          </div>
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy"
            >
              Mot de passe <span className="text-error">*</span>
            </label>
            <Link
              href="/auth/reset-password"
              className="text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Field htmlFor="password" error={errors.password}>
            <div className="relative">
              <Lock
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                error={!!errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((p) => ({ ...p, password: undefined }));
                }}
                className="px-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:text-navy"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-secondary">
          <span className="relative flex h-5 w-5 items-center justify-center">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                remember
                  ? "border-transparent bg-gradient-da"
                  : "border-navy/20 bg-surface-primary",
              )}
            >
              {remember && (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2 6.2l2.6 2.6L10 3.4"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </span>
          Se souvenir de moi
        </label>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={googlePending}
          className="w-full"
        >
          {pending ? "Connexion…" : "Se connecter"}
          {!pending && <ArrowRight size={18} />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Pas encore de compte ?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
        >
          Commencer à apprendre gratuitement
        </Link>
      </p>
    </motion.div>
  );
}
