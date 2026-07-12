import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false, follow: false },
};

export default async function ReinitialisationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est incomplet ou a expiré."
        footer={
          <Link href="/mot-de-passe-oublie" className="font-semibold text-brand-blue-royal hover:text-brand-violet">
            Demander un nouveau lien
          </Link>
        }
      >
        <p className="rounded-xl border border-error/25 bg-error/5 p-5 text-sm leading-relaxed text-error">
          Le lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau pour continuer.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choisissez un nouveau mot de passe"
      subtitle="Créez un mot de passe robuste pour sécuriser votre compte Access Academy."
      aside={{
        heading: "Presque terminé.",
        points: [
          "Choisissez un mot de passe que vous n'utilisez nulle part ailleurs",
          "Il sera actif immédiatement après validation",
          "Vous pourrez ensuite vous connecter normalement",
        ],
      }}
      footer={
        <Link href="/connexion" className="font-semibold text-brand-blue-royal hover:text-brand-violet">
          Retour à la connexion
        </Link>
      }
    >
      <NewPasswordForm token={token} />
    </AuthShell>
  );
}
