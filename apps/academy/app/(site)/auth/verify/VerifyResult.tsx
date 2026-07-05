"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, RefreshCw } from "lucide-react";
import { buttonClasses, cn } from "@da/ui";

/* Confetti CSS pur — palette DA, positions/délais déterministes (SSR-safe). */
const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const colors = ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#00BCD4", "#7C3AED"];
  return {
    left: (i * 4.5 + (i % 3) * 7) % 100,
    delay: (i % 7) * 0.18,
    duration: 2.4 + (i % 5) * 0.35,
    color: colors[i % colors.length],
    size: 6 + (i % 4) * 2,
    rotate: (i * 47) % 360,
  };
});

function Confetti() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-full overflow-hidden"
    >
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.4,
            backgroundColor: c.color,
            borderRadius: 2,
          }}
          initial={{ y: -40, opacity: 0, rotate: c.rotate }}
          animate={{
            y: ["-10%", "120%"],
            opacity: [0, 1, 1, 0],
            rotate: c.rotate + 220,
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Écran de succès ──────────────────────────────────────────────────────── */
export function VerifySuccess() {
  return (
    <div className="relative">
      <Confetti />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative card-gradient-border rounded-3xl p-8 text-center shadow-brand-lg sm:p-12"
      >
        {/* Badge check dégradé animé */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full bg-gradient-da opacity-25 blur-xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.15 }}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-da shadow-brand"
          >
            <motion.svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              aria-hidden
            >
              <motion.path
                d="M11 23 L19 31 L34 14"
                stroke="#fff"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              />
            </motion.svg>
          </motion.div>
        </div>

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-success"
        >
          <Check size={13} strokeWidth={3} />
          Email confirmé
        </motion.span>

        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Compte activé !
        </h1>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-text-secondary">
          Bienvenue dans Access Academy ! Votre adresse email est confirmée —
          connectez-vous, inscrivez-vous à un cours et commencez à apprendre.
        </p>

        <div className="mt-8">
          <Link
            href="/auth/login"
            className={buttonClasses({ variant: "primary", size: "lg", className: "w-full sm:w-auto" })}
          >
            Me connecter
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Écran d'erreur ───────────────────────────────────────────────────────── */
export function VerifyError({ expired = false }: { expired?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-navy/[0.07] bg-surface-primary p-8 text-center shadow-brand-lg sm:p-12"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10 text-error"
      >
        <AlertTriangle size={34} strokeWidth={2.2} />
      </motion.div>

      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        {expired ? "Lien expiré" : "Lien invalide"}
      </h1>
      <p className="mx-auto mt-3 max-w-sm leading-relaxed text-text-secondary">
        {expired
          ? "Ce lien de confirmation a expiré. Les liens sont valables 24 heures pour votre sécurité. Demandez-en un nouveau ci-dessous."
          : "Ce lien de confirmation n'est plus valable. Il a peut-être déjà été utilisé ou mal copié. Demandez-en un nouveau ci-dessous."}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/auth/verify-email"
          className={buttonClasses({ variant: "primary", size: "lg", className: "w-full sm:w-auto" })}
        >
          <RefreshCw size={17} />
          Renvoyer un email
        </Link>
        <Link
          href="/auth/login"
          className={cn(
            buttonClasses({ variant: "outline", size: "lg" }),
            "w-full sm:w-auto",
          )}
        >
          Retour à la connexion
        </Link>
      </div>
    </motion.div>
  );
}
