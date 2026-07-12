"use client";

import * as React from "react";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, Input } from "@da/ui";
import { Select } from "@/components/Select";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { googleLoginAction } from "../connexion/actions";
import { registerAction, type RegisterState } from "./actions";

/* Formulaire d'inscription §15.2 — jauge de force, selects brandés, conditions. */

const COUNTRY_OPTIONS = [
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Sénégal", label: "Sénégal" },
  { value: "Bénin", label: "Bénin" },
  { value: "Togo", label: "Togo" },
  { value: "Mali", label: "Mali" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Guinée", label: "Guinée" },
  { value: "Cameroun", label: "Cameroun" },
  { value: "Gabon", label: "Gabon" },
  { value: "Congo", label: "Congo" },
  { value: "RD Congo", label: "RD Congo" },
  { value: "France", label: "France" },
  { value: "Autre", label: "Autre pays" },
];

const OBJECTIVE_OPTIONS = [
  { value: "Trouver un emploi", label: "Trouver un emploi" },
  { value: "Monter en compétences", label: "Monter en compétences" },
  { value: "Reconversion professionnelle", label: "Reconversion professionnelle" },
  { value: "Entrepreneuriat", label: "Entrepreneuriat" },
];

const LEVEL_OPTIONS = [
  { value: "Débutant", label: "Débutant" },
  { value: "Intermédiaire", label: "Intermédiaire" },
  { value: "Avancé", label: "Avancé" },
];

/** Score de robustesse 0–4 basé sur longueur, majuscule, chiffre, symbole. */
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

export function RegisterForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(registerAction, {});
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [country, setCountry] = React.useState<string>("Côte d'Ivoire");
  const [objective, setObjective] = React.useState<string | null>(null);
  const [level, setLevel] = React.useState<string | null>(null);

  const score = scorePassword(password);
  const meter = password ? STRENGTH[score] : null;

  return (
    <div className="space-y-6">
      {googleEnabled && (
        <>
          <form action={googleLoginAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <GoogleButton label="S'inscrire avec Google" />
          </form>
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-navy/10" />
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">ou</span>
            <span className="h-px flex-1 bg-navy/10" />
          </div>
        </>
      )}

      <form action={formAction} className="space-y-5" noValidate>
        {/* Champs pilotés par les selects */}
        <input type="hidden" name="country" value={country} />
        <input type="hidden" name="objective" value={objective ?? ""} />
        <input type="hidden" name="experienceLevel" value={level ?? ""} />

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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName" required>
            <Input id="firstName" name="firstName" autoComplete="given-name" placeholder="Aïcha" required />
          </Field>
          <Field label="Nom" htmlFor="lastName" required>
            <Input id="lastName" name="lastName" autoComplete="family-name" placeholder="Koné" required />
          </Field>
        </div>

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

        <Field
          label="Mot de passe"
          htmlFor="password"
          required
          hint="Au moins 8 caractères, une majuscule et un chiffre."
        >
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Pays" required>
            <Select
              value={country}
              onChange={setCountry}
              options={COUNTRY_OPTIONS}
              placeholder="Sélectionner votre pays"
              ariaLabel="Pays"
              buttonClassName="h-11"
            />
          </Field>
          <Field label="Téléphone" htmlFor="phone" hint="Optionnel">
            <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+225 07 00 00 00 00" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Votre objectif">
            <Select
              value={objective}
              onChange={setObjective}
              options={OBJECTIVE_OPTIONS}
              placeholder="Que recherchez-vous ?"
              ariaLabel="Objectif"
              buttonClassName="h-11"
            />
          </Field>
          <Field label="Niveau">
            <Select
              value={level}
              onChange={setLevel}
              options={LEVEL_OPTIONS}
              placeholder="Votre niveau"
              ariaLabel="Niveau d'expérience"
              buttonClassName="h-11"
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 accent-brand-violet"
            required
          />
          <span>
            J'accepte les{" "}
            <a href="/conditions" target="_blank" className="font-medium text-brand-blue-royal hover:underline">
              conditions d'utilisation
            </a>{" "}
            et la{" "}
            <a href="/confidentialite" target="_blank" className="font-medium text-brand-blue-royal hover:underline">
              politique de confidentialité
            </a>
            .
          </span>
        </label>

        <Button type="submit" size="lg" loading={pending} className="w-full">
          Créer mon compte
        </Button>
      </form>
    </div>
  );
}
