import Link from "next/link";
import { buttonClasses, Monogram, GradientText } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   404 brandée Access Academy — monogramme DA, halo dégradé, liens de reprise.
   ══════════════════════════════════════════════════════════════════════════ */

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-primary px-6 text-center">
      {/* Décor */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-da opacity-[0.07] blur-3xl"
        aria-hidden
      />
      <span className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />

      <div className="relative">
        <div className="mx-auto mb-6 grid place-items-center">
          <Monogram size={72} className="animate-float" />
        </div>

        <p className="font-display text-[5.5rem] font-extrabold leading-none tracking-tight text-navy sm:text-[7rem]">
          4<GradientText>0</GradientText>4
        </p>

        <h1 className="mt-4 font-display text-xl font-bold text-navy sm:text-2xl">
          Cette page n&apos;existe pas — ou plus.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">
          Le lien que vous avez suivi est peut-être obsolète. Reprenez votre apprentissage depuis
          l&apos;accueil ou explorez le catalogue de formations.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonClasses()}>
            Retour à l&apos;accueil
          </Link>
          <Link href="/formations" className={buttonClasses({ variant: "outline" })}>
            Voir les formations
          </Link>
        </div>
      </div>
    </div>
  );
}
