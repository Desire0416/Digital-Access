"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { buttonClasses, Monogram } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Page d'erreur brandée Access Academy — monogramme, message rassurant,
   bouton « Réessayer » (reset) + retour accueil.
   ══════════════════════════════════════════════════════════════════════════ */

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-primary px-6 text-center">
      <span
        className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-da opacity-[0.07] blur-3xl"
        aria-hidden
      />
      <span className="pointer-events-none absolute inset-0 bg-dots opacity-40" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative"
      >
        <div className="mx-auto mb-6 grid place-items-center">
          <motion.div
            animate={{ rotate: [0, -4, 4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Monogram size={72} />
          </motion.div>
        </div>

        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
          Une erreur inattendue s&apos;est produite
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">
          Nos équipes ont été prévenues. Vous pouvez réessayer maintenant — si le problème persiste,
          revenez dans quelques minutes.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-text-muted">Référence : {error.digest}</p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className={buttonClasses()}>
            <RotateCcw size={16} aria-hidden />
            Réessayer
          </button>
          <Link href="/" className={buttonClasses({ variant: "outline" })}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
