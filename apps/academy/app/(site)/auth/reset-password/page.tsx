import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { RequestResetForm } from "./RequestResetForm";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description:
    "Réinitialisez le mot de passe de votre compte Access Academy en toute sécurité.",
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
          "Votre progression, vos quiz et vos certificats sont précieux. Un mot de passe fort les protège.",
        author: "Équipe Access Academy",
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
