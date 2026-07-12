"use client";

import { motion } from "framer-motion";

/* Enveloppe animée brandée DA pour la page d'attente de vérification. */

export function AnimatedEnvelope() {
  return (
    <div className="relative mx-auto h-28 w-28">
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-da opacity-15"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.svg
        viewBox="0 0 64 64"
        className="absolute inset-0 m-auto h-16 w-16"
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: [6, -2, 6], opacity: 1 }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
      >
        <defs>
          <linearGradient id="env-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5B3FA8" />
            <stop offset="1" stopColor="#00BCD4" />
          </linearGradient>
        </defs>
        <rect x="8" y="16" width="48" height="34" rx="5" fill="url(#env-grad)" />
        <path d="M8 21 32 38 56 21" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </div>
  );
}
