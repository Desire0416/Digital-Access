"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Save,
  UserPen,
} from "lucide-react";
import { Button, Input, Textarea, Field, formatDate } from "@da/ui";
import { StatusPill, type Tone } from "@/components/admin/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { updateProfile } from "@/lib/profile-actions";

type Profile = {
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  roles: string[];
  createdAt: Date | string;
};

const ROLE_META: Record<string, { label: string; tone: Tone }> = {
  LEARNER: { label: "Apprenant", tone: "blue" },
  CLIENT: { label: "Client", tone: "cyan" },
  INSTRUCTOR: { label: "Instructeur", tone: "violet" },
  ADMIN: { label: "Administrateur", tone: "amber" },
  SUPER_ADMIN: { label: "Super admin", tone: "red" },
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [avatar, setAvatar] = React.useState(profile.avatar ?? "");
  const [name, setName] = React.useState(profile.name ?? "");
  const [bio, setBio] = React.useState(profile.bio ?? "");
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [location, setLocation] = React.useState(profile.location ?? "");
  const [website, setWebsite] = React.useState(profile.website ?? "");

  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const touched = () => setSuccess(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        website: website.trim(),
        avatar: avatar.trim(),
      });
      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      {/* ═════════════════ Carte identité (gauche) ═════════════════ */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
          <div className="h-20 bg-gradient-da" />
          <div className="-mt-12 flex flex-col items-center px-6 pb-7">
            <div className="rounded-full ring-4 ring-surface-primary">
              <ImageUpload
                variant="avatar"
                value={avatar || null}
                onChange={(url) => {
                  setAvatar(url ?? "");
                  touched();
                }}
                folder="avatars"
                fallback={name}
                size={116}
                hint="JPG ou PNG — 5 Mo max"
              />
            </div>

            <h2 className="mt-4 text-center font-display text-xl font-bold tracking-tight text-navy">
              {name.trim() || "Votre nom"}
            </h2>
            <p className="mt-1 flex max-w-full items-center gap-1.5 text-sm text-text-secondary">
              <Mail size={14} className="shrink-0 text-text-muted" />
              <span className="truncate">{profile.email}</span>
            </p>

            {profile.roles.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {profile.roles.map((r) => {
                  const meta = ROLE_META[r] ?? { label: r, tone: "slate" as Tone };
                  return <StatusPill key={r} label={meta.label} tone={meta.tone} />;
                })}
              </div>
            )}

            <div className="mt-5 w-full border-t border-navy/[0.06] pt-4">
              <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
                <CalendarDays size={14} />
                Membre depuis le {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═════════════════ Formulaire (droite) ═════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
        <div className="h-1 w-full bg-gradient-da" />
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
              <UserPen size={17} />
            </span>
            <h3 className="font-display text-base font-bold text-navy">Informations personnelles</h3>
          </div>

          <Field label="Nom complet" htmlFor="profile-name" required>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                touched();
              }}
              placeholder="Ex : Aïcha Koné"
              maxLength={80}
              disabled={pending}
            />
          </Field>

          <Field
            label="Adresse email"
            htmlFor="profile-email"
            hint="Votre email est vérifié et ne peut pas être modifié ici."
          >
            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                id="profile-email"
                value={profile.email}
                disabled
                readOnly
                className="cursor-not-allowed bg-surface-secondary pl-10"
              />
            </div>
          </Field>

          <Field
            label="Bio"
            htmlFor="profile-bio"
            hint={`${bio.length} / 400 caractères.`}
          >
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                touched();
              }}
              placeholder="Parlez de vous, de votre activité, de vos centres d'intérêt…"
              rows={4}
              maxLength={400}
              disabled={pending}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Téléphone" htmlFor="profile-phone">
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <Input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    touched();
                  }}
                  placeholder="+225 07 00 00 00 00"
                  maxLength={30}
                  disabled={pending}
                  className="pl-10"
                />
              </div>
            </Field>

            <Field label="Localisation" htmlFor="profile-location">
              <div className="relative">
                <MapPin
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <Input
                  id="profile-location"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    touched();
                  }}
                  placeholder="Abidjan, Côte d'Ivoire"
                  maxLength={100}
                  disabled={pending}
                  className="pl-10"
                />
              </div>
            </Field>
          </div>

          <Field
            label="Site web"
            htmlFor="profile-website"
            hint="Commencez par https:// (facultatif)."
          >
            <div className="relative">
              <Globe
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                id="profile-website"
                type="url"
                inputMode="url"
                value={website}
                onChange={(e) => {
                  setWebsite(e.target.value);
                  touched();
                }}
                placeholder="https://mon-site.ci"
                maxLength={200}
                disabled={pending}
                className="pl-10"
              />
            </div>
          </Field>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 rounded-lg bg-error/[0.06] px-3 py-2.5 text-sm font-medium text-error"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.p>
            )}
            {success && !error && (
              <motion.p
                key="success"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 rounded-lg bg-success/[0.08] px-3 py-2.5 text-sm font-medium text-success"
              >
                <CheckCircle2 size={16} className="shrink-0" />
                Profil mis à jour avec succès.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex justify-end border-t border-navy/[0.06] pt-6">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={pending}
              disabled={!name.trim()}
            >
              <Save size={16} />
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
