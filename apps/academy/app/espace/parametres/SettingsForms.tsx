"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, User, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button, Field, Input, Textarea } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { updateProfile, changePassword } from "@/lib/learn-actions";

/* Paramètres (§16.9) — profil + changement de mot de passe. */

function Feedback({ state }: { state: { ok: boolean; message: string } | null }) {
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium ${
            state.ok ? "border-success/30 bg-success/5 text-success" : "border-error/30 bg-error/5 text-error"
          }`}
          role="status"
        >
          {state.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden /> : <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />}
          {state.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface ProfileInitial {
  firstName: string;
  lastName: string;
  name: string;
  bio: string;
  country: string;
  phone: string;
  objective: string;
  avatar: string | null;
}

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const [avatar, setAvatar] = React.useState<string | null>(initial.avatar);
  const [firstName, setFirstName] = React.useState(initial.firstName);
  const [lastName, setLastName] = React.useState(initial.lastName);
  const [bio, setBio] = React.useState(initial.bio);
  const [country, setCountry] = React.useState(initial.country);
  const [phone, setPhone] = React.useState(initial.phone);
  const [objective, setObjective] = React.useState(initial.objective);
  const [pending, setPending] = React.useState(false);
  const [state, setState] = React.useState<{ ok: boolean; message: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setState(null);
    const res = await updateProfile({ firstName, lastName, bio, country, phone, objective, avatar: avatar ?? "" });
    setPending(false);
    setState(res.ok ? { ok: true, message: res.message ?? "Profil mis à jour." } : { ok: false, message: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Feedback state={state} />

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ImageUpload variant="avatar" value={avatar} onChange={setAvatar} folder="avatars" fallback={initial.name} />
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName">
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Votre prénom" />
          </Field>
          <Field label="Nom" htmlFor="lastName">
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Votre nom" />
          </Field>
        </div>
      </div>

      <Field label="Bio" htmlFor="bio" hint="Présentez-vous en quelques mots.">
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Ex. Développeuse web passionnée par la data…" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pays" htmlFor="country">
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Côte d'Ivoire" />
        </Field>
        <Field label="Téléphone" htmlFor="phone">
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 …" />
        </Field>
      </div>

      <Field label="Objectif" htmlFor="objective" hint="Ce que vous souhaitez accomplir avec Access Academy.">
        <Input id="objective" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ex. Devenir analyste de données" />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          <User size={16} aria-hidden />
          Enregistrer le profil
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [state, setState] = React.useState<{ ok: boolean; message: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setState(null);
    const res = await changePassword({ currentPassword: current, newPassword: next });
    setPending(false);
    setState(res.ok ? { ok: true, message: res.message ?? "Mot de passe mis à jour." } : { ok: false, message: res.error });
    if (res.ok) {
      setCurrent("");
      setNext("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Feedback state={state} />

      {!hasPassword && (
        <p className="rounded-lg border border-info/25 bg-info/5 px-4 py-3 text-sm text-info">
          Votre compte utilise une connexion externe (Google). Définissez un mot de passe pour aussi vous connecter par email.
        </p>
      )}

      {hasPassword && (
        <Field label="Mot de passe actuel" htmlFor="current" required>
          <Input id="current" type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </Field>
      )}

      <Field label="Nouveau mot de passe" htmlFor="next" hint="8 caractères minimum, une majuscule et un chiffre." required>
        <div className="relative">
          <Input id="next" type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" className="pr-11" autoComplete="new-password" required />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Masquer" : "Afficher"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-navy"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      <div className="flex justify-end">
        <Button type="submit" variant="outline" loading={pending}>
          <KeyRound size={16} aria-hidden />
          {hasPassword ? "Changer le mot de passe" : "Définir un mot de passe"}
        </Button>
      </div>
    </form>
  );
}
