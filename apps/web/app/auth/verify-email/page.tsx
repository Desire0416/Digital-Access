import type { Metadata } from "next";
import Link from "next/link";
import { Monogram } from "@da/ui";
import { AnimatedEnvelope } from "./AnimatedEnvelope";
import { ResendPanel } from "./ResendPanel";

export const metadata: Metadata = {
  title: "Confirmez votre email",
  description:
    "Un email de confirmation a été envoyé. Cliquez sur le lien reçu pour activer votre compte Digital Access.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const address = email?.trim() || "votre adresse email";

  return (
    <div className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8">
      {/* Décor de marque */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-violet/15 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-cyan/15 blur-[120px]" />
        <Monogram
          size={420}
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 opacity-[0.04]"
        />
      </div>

      <div className="w-full max-w-lg text-center">
        <div className="card-gradient-border rounded-3xl p-8 shadow-brand-lg sm:p-12">
          <AnimatedEnvelope />

          <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Vérifiez votre boîte de réception
          </h1>

          <p className="mt-4 leading-relaxed text-text-secondary">
            Un email de confirmation a été envoyé à{" "}
            <span className="font-semibold text-navy">{address}</span>. Cliquez
            sur le lien qu'il contient pour activer votre compte.
          </p>

          <div className="mt-6 rounded-xl border border-navy/[0.07] bg-surface-secondary/60 px-5 py-4 text-sm text-text-secondary">
            <p>
              Vous ne trouvez pas l'email ? Pensez à vérifier votre dossier{" "}
              <span className="font-medium text-navy">Spam</span> ou{" "}
              <span className="font-medium text-navy">Promotions</span>.
            </p>
          </div>

          <ResendPanel email={email?.trim() ?? ""} />
        </div>

        <p className="mt-6 text-sm text-text-secondary">
          Déjà confirmé ?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
