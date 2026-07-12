import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/guards";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Access Academy pour suivre vos formations et parcours.",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  // Déjà connecté : on renvoie vers l'espace approprié.
  const user = await currentUser();
  if (user) redirect(isAdmin(user) ? "/admin" : "/espace");

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <AuthShell
      title="Bon retour parmi nous"
      subtitle="Connectez-vous pour reprendre vos formations là où vous les avez laissées."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link
            href={`/inscription${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
