import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Container, Monogram, buttonClasses, GradientText } from "@da/ui";

export default function NotFound() {
  return (
    <section className="relative isolate grid min-h-[80vh] place-items-center overflow-hidden py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-da opacity-10 blur-3xl"
      />
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <div className="relative mx-auto mb-8 inline-flex">
            <Monogram size={96} />
            <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-brand-blue-vif/20" />
          </div>
          <p className="font-display text-7xl font-extrabold tracking-tight">
            <GradientText>404</GradientText>
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold text-navy">
            Cette page a pris un autre chemin
          </h1>
          <p className="mt-3 text-text-secondary">
            La page que vous cherchez n'existe pas ou a été déplacée. Revenons
            sur la bonne voie ensemble.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className={buttonClasses({ variant: "primary", size: "lg" })}>
              <Home size={18} />
              Retour à l'accueil
            </Link>
            <Link href="/contact" className={buttonClasses({ variant: "outline", size: "lg" })}>
              <ArrowLeft size={18} />
              Nous contacter
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
