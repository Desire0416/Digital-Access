import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { RequestResetForm } from "./RequestResetForm";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialisez le mot de passe de votre compte Digital Access.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell
      aside={{
        quote:
          "La sécurité de vos données est notre priorité. Un mot de passe fort protège vos projets et vos factures.",
        author: "Équipe Digital Access",
        role: "Sécurité & confiance",
        bullets: [
          "Liens de réinitialisation valables 1h",
          "Chiffrement des mots de passe (bcrypt)",
          "Aucun mot de passe stocké en clair",
        ],
      }}
    >
      {token ? <NewPasswordForm token={token} /> : <RequestResetForm />}
    </AuthShell>
  );
}
