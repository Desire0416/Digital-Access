import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AnimatedEnvelope } from "@/components/auth/AnimatedEnvelope";
import { ResendPanel } from "@/components/auth/ResendPanel";

export const metadata: Metadata = {
  title: "Vérifiez votre boîte mail",
  robots: { index: false, follow: false },
};

export default async function VerificationEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell
      title="Vérifiez votre boîte mail"
      subtitle={
        email
          ? `Nous avons envoyé un lien de confirmation à ${email}. Cliquez dessus pour activer votre compte.`
          : "Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte."
      }
      footer={
        <>
          Mauvaise adresse ?{" "}
          <Link href="/inscription" className="font-semibold text-brand-blue-royal hover:text-brand-violet">
            Recommencer l'inscription
          </Link>
        </>
      }
    >
      <div className="space-y-8">
        <AnimatedEnvelope />

        <div className="rounded-xl border border-navy/10 bg-surface-secondary p-5 text-sm leading-relaxed text-text-secondary">
          <p className="font-medium text-navy">Vous ne trouvez pas l'email ?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Vérifiez votre dossier courrier indésirable (spam).</li>
            <li>Le lien est valable 24 heures.</li>
            <li>Vous pouvez en demander un nouveau ci-dessous.</li>
          </ul>
        </div>

        {email ? (
          <ResendPanel email={email} />
        ) : (
          <p className="text-center text-sm text-text-muted">
            <Link href="/connexion" className="font-medium text-brand-blue-royal hover:text-brand-violet">
              Retour à la connexion
            </Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
}
