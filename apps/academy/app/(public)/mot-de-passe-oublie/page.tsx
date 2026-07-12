import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialisez le mot de passe de votre compte Access Academy.",
};

export default function MotDePasseOubliePage() {
  return (
    <AuthShell
      title="Mot de passe oublié ?"
      subtitle="Saisissez votre adresse email : nous vous enverrons un lien pour définir un nouveau mot de passe."
      aside={{
        heading: "Un instant d'oubli, ça arrive.",
        points: [
          "Le lien de réinitialisation est valable 1 heure",
          "Votre progression et vos certificats restent intacts",
          "Aucune information n'est partagée avec des tiers",
        ],
      }}
      footer={
        <>
          Vous vous en souvenez ?{" "}
          <Link href="/connexion" className="font-semibold text-brand-blue-royal hover:text-brand-violet">
            Se connecter
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
