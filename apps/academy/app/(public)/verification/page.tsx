import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailToken } from "@/lib/auth-actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerificationResult } from "@/components/auth/VerificationResult";

export const metadata: Metadata = {
  title: "Confirmation de l'adresse email",
  robots: { index: false, follow: false },
};

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Lien invalide (absence de token) : message d'erreur sans appel base.
  if (!token) {
    return (
      <AuthShell
        title="Lien invalide"
        subtitle="Ce lien de vérification est incomplet ou a expiré."
        footer={
          <Link href="/verification-email" className="font-semibold text-brand-blue-royal hover:text-brand-violet">
            Demander un nouveau lien
          </Link>
        }
      >
        <VerificationResult ok={false} message="Ce lien de vérification est invalide. Demandez-en un nouveau ci-dessous." />
      </AuthShell>
    );
  }

  const result = await verifyEmailToken(token);
  const ok = result.ok;
  const message = ok
    ? result.message ?? "Adresse confirmée ! Votre compte est activé."
    : result.error;

  return (
    <AuthShell
      title={ok ? "Compte activé !" : "Vérification impossible"}
      subtitle={ok ? "Bienvenue dans Access Academy. Vous pouvez maintenant vous connecter." : undefined}
    >
      <VerificationResult ok={ok} message={message} />
    </AuthShell>
  );
}
