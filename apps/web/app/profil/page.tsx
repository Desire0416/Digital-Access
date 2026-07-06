import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { Container, Section, GradientText } from "@da/ui";
import { getMyProfile } from "@/lib/profile-actions";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: "Mon profil",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const p = await getMyProfile();
  if (!p) redirect("/auth/login?callbackUrl=/profil");

  return (
    <Section spacing="md" className="min-h-[80vh] pt-28">
      <Container size="sm">
        {/* En-tête brandé */}
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
            <UserRound size={26} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              Mon <GradientText>profil</GradientText>
            </h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              Gérez vos informations personnelles et votre présentation.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <ProfileForm profile={p} />
        </div>
      </Container>
    </Section>
  );
}
