import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/guards";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Rejoignez Access Academy — formations, parcours métiers et certificats vérifiables.",
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  const user = await currentUser();
  if (user) redirect(isAdmin(user) ? "/admin" : "/espace");

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <AuthShell
      title="Créez votre compte"
      subtitle="Quelques informations et vous accédez à tout le catalogue Access Academy."
      aside={{
        heading: "Votre parcours vers un métier numérique commence ici.",
        points: [
          "Un compte gratuit pour explorer tout le catalogue",
          "Suivez votre progression, vos projets et vos certificats",
          "Rejoignez une communauté d'apprenants en Côte d'Ivoire",
        ],
        quote: {
          text: "J'ai monté en compétences en data tout en travaillant. Les projets font vraiment la différence.",
          author: "Koffi B.",
          role: "Développeur, promotion 2025",
        },
      }}
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link
            href={`/connexion${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
