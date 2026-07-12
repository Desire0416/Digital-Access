"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { buttonClasses } from "@da/ui";

/* Résultat de vérification d'email — succès (confettis CSS) ou échec (renvoi). */

const CONFETTI_COLORS = ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#00BCD4", "#7C3AED"];

function Confetti() {
  // 40 particules déterministes (évite l'hydratation aléatoire côté serveur).
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: (i * 97) % 100,
        delay: (i % 10) * 0.12,
        duration: 2.2 + ((i * 37) % 100) / 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: (i * 53) % 360,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-2.5 w-1.5 rounded-sm"
          style={{ left: `${p.left}%`, backgroundColor: p.color }}
          initial={{ y: -20, opacity: 0, rotate: p.rotate }}
          animate={{ y: "110%", opacity: [0, 1, 1, 0], rotate: p.rotate + 260 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn", repeat: Infinity, repeatDelay: 1.4 }}
        />
      ))}
    </div>
  );
}

export function VerificationResult({
  ok,
  message,
}: {
  ok: boolean;
  message: string;
}) {
  return (
    <div className="relative">
      {ok && <Confetti />}
      <div className="relative flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={`flex h-20 w-20 items-center justify-center rounded-full ${
            ok ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          {ok ? <CheckCircle2 size={44} strokeWidth={2} /> : <XCircle size={44} strokeWidth={2} />}
        </motion.div>

        <p className="mt-6 text-base leading-relaxed text-text-secondary">{message}</p>

        <div className="mt-8 w-full">
          {ok ? (
            <Link href="/connexion" className={buttonClasses({ size: "lg", className: "w-full" })}>
              Se connecter
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                href="/verification-email"
                className={buttonClasses({ variant: "outline", size: "lg", className: "w-full" })}
              >
                Demander un nouveau lien
              </Link>
              <Link
                href="/connexion"
                className="block text-sm font-medium text-brand-blue-royal hover:text-brand-violet"
              >
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
