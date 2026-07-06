"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, User, X } from "lucide-react";
import { Button, Field, Input, cn } from "@da/ui";
import { GoogleButton } from "../GoogleButton";
import { registerUser } from "../actions";

/* ─── Validation Zod côté client (miroir de l'action serveur) ──────────────── */
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Votre nom doit contenir au moins 2 caractères.")
    .max(80, "Le nom est trop long."),
  email: z.string().trim().email("Adresse email invalide."),
  password: z
    .string()
    .min(8, "8 caractères minimum.")
    .regex(/[A-Z]/, "Ajoutez une majuscule.")
    .regex(/[0-9]/, "Ajoutez un chiffre."),
});

type Errors = Partial<Record<"name" | "email" | "password", string>>;

/* ─── Règles de force du mot de passe ──────────────────────────────────────── */
const rules = [
  { key: "length", label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
  { key: "upper", label: "Une lettre majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { key: "digit", label: "Un chiffre", test: (v: string) => /[0-9]/.test(v) },
] as const;

const strengthMeta = [
  { label: "Trop faible", width: "0%", color: "bg-error" },
  { label: "Faible", width: "33%", color: "bg-error" },
  { label: "Correct", width: "66%", color: "bg-warning" },
  { label: "Solide", width: "100%", color: "bg-gradient-da" },
];

export function RegisterForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [googlePending, setGooglePending] = React.useState(false);

  const passed = rules.filter((r) => r.test(password)).length;
  const strength = password.length === 0 ? 0 : passed;
  const meta = strengthMeta[strength];

  /* Validation temps réel (Zod) après le premier « blur » du champ. */
  const liveErrors = React.useMemo<Errors>(() => {
    const parsed = schema.safeParse({ name, email, password });
    if (parsed.success) return {};
    const out: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof Errors;
      if (key && !out[key]) out[key] = issue.message;
    }
    return out;
  }, [name, email, password]);

  function fieldError(key: keyof Errors): string | undefined {
    return errors[key] ?? (touched[key] ? liveErrors[key] : undefined);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setTouched({ name: true, email: true, password: true });

    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      setErrors(liveErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await registerUser({ name, email, password });
      if (result.ok) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  function handleGoogle() {
    if (googleEnabled) {
      setGooglePending(true);
      void signIn("google", { callbackUrl: "/apres-connexion" });
    } else {
      setFormError("L'inscription avec Google sera bientôt disponible.");
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
          Créer un compte
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Commençons l'aventure
        </h1>
        <p className="mt-2.5 text-text-secondary">
          Créez votre compte en quelques secondes — c'est gratuit et sans
          engagement.
        </p>
      </div>

      <GoogleButton
        label="S'inscrire avec Google"
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
        <Field label="Nom complet" htmlFor="name" error={fieldError("name")} required>
          <div className="relative">
            <User
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Prénom Nom"
              value={name}
              error={!!fieldError("name")}
              onBlur={() => setTouched((p) => ({ ...p, name: true }))}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              className="pl-10"
            />
          </div>
        </Field>

        <Field
          label="Adresse email"
          htmlFor="email"
          error={fieldError("email")}
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
              placeholder="vous@entreprise.ci"
              value={email}
              error={!!fieldError("email")}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              className="pl-10"
            />
          </div>
        </Field>

        <div className="space-y-2.5">
          <label htmlFor="password" className="block text-sm font-medium text-navy">
            Mot de passe <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Créez un mot de passe fort"
              value={password}
              error={touched.password && !!fieldError("password")}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
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

          {/* Indicateur de force animé */}
          <AnimatePresence initial={false}>
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/10">
                    <motion.div
                      className={cn("h-full rounded-full", meta.color)}
                      initial={false}
                      animate={{ width: meta.width }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-16 shrink-0 text-right text-xs font-semibold",
                      strength >= 3
                        ? "text-gradient-da"
                        : strength === 2
                          ? "text-warning"
                          : "text-error",
                    )}
                  >
                    {meta.label}
                  </span>
                </div>

                <ul className="mt-3 grid gap-1.5">
                  {rules.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <li
                        key={rule.key}
                        className="flex items-center gap-2 text-xs"
                      >
                        <motion.span
                          initial={false}
                          animate={{ scale: ok ? [1, 1.25, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full",
                            ok
                              ? "bg-gradient-da text-white"
                              : "bg-navy/10 text-text-muted",
                          )}
                        >
                          {ok ? (
                            <Check size={10} strokeWidth={3.5} />
                          ) : (
                            <X size={10} strokeWidth={3} />
                          )}
                        </motion.span>
                        <span
                          className={cn(
                            "transition-colors",
                            ok ? "text-navy" : "text-text-muted",
                          )}
                        >
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-xs leading-relaxed text-text-muted">
          En créant un compte, vous acceptez nos{" "}
          <Link
            href="/cgu"
            className="font-medium text-brand-blue-royal hover:text-brand-violet"
          >
            conditions d'utilisation
          </Link>{" "}
          et notre{" "}
          <Link
            href="/confidentialite"
            className="font-medium text-brand-blue-royal hover:text-brand-violet"
          >
            politique de confidentialité
          </Link>
          .
        </p>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={googlePending}
          className="w-full"
        >
          {pending ? "Création du compte…" : "Créer mon compte"}
          {!pending && <ArrowRight size={18} />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Vous avez déjà un compte ?{" "}
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
