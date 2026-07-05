"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";
import { Container, Monogram, buttonClasses, GradientText } from "@da/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="relative isolate grid min-h-[80vh] place-items-center overflow-hidden py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-error/10 blur-3xl"
      />
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-8 inline-flex">
            <Monogram size={88} />
          </div>
          <p className="font-display text-7xl font-extrabold tracking-tight">
            <GradientText>500</GradientText>
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold text-navy">
            Un imprévu est survenu
          </h1>
          <p className="mt-3 text-text-secondary">
            Une erreur inattendue s'est produite de notre côté. Réessayez — si
            le problème persiste, contactez-nous.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className={buttonClasses({ variant: "primary", size: "lg" })}
            >
              <RotateCcw size={18} />
              Réessayer
            </button>
            <Link href="/" className={buttonClasses({ variant: "outline", size: "lg" })}>
              <Home size={18} />
              Accueil
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
