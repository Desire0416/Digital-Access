import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { User, Lock, Mail, CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getMyProfile } from "@/lib/learn-queries";
import { EspaceHeader, Panel } from "@/components/espace/parts";
import { ProfileForm, PasswordForm } from "./SettingsForms";

export const metadata: Metadata = { title: "Paramètres" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function SettingsPage() {
  const user = await requireUser("/espace/parametres");
  const profile = await getMyProfile(user.id);
  if (!profile) notFound();

  return (
    <div className="max-w-3xl">
      <EspaceHeader title="Paramètres" subtitle="Gérez votre profil et la sécurité de votre compte." />

      <div className="space-y-6">
        {/* Compte (lecture seule) */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy/[0.04] text-brand-blue-royal" aria-hidden>
              <Mail size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-navy">{profile.email}</p>
              <p className="text-xs text-text-secondary">Adresse de connexion</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy/[0.04] text-brand-violet" aria-hidden>
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-navy">{dateFmt.format(profile.createdAt)}</p>
              <p className="text-xs text-text-secondary">Membre depuis</p>
            </div>
          </div>
        </div>

        {/* Profil */}
        <Panel title={<span className="inline-flex items-center gap-2"><User size={17} className="text-brand-blue-royal" aria-hidden />Mon profil</span>}>
          <ProfileForm
            initial={{
              firstName: profile.firstName ?? "",
              lastName: profile.lastName ?? "",
              name: profile.name,
              bio: profile.bio ?? "",
              country: profile.country ?? "",
              phone: profile.phone ?? "",
              objective: profile.objective ?? "",
              avatar: profile.avatar,
            }}
          />
        </Panel>

        {/* Sécurité */}
        <Panel title={<span className="inline-flex items-center gap-2"><Lock size={17} className="text-brand-blue-royal" aria-hidden />Sécurité</span>}>
          <PasswordForm hasPassword={!!profile.password} />
        </Panel>
      </div>
    </div>
  );
}
