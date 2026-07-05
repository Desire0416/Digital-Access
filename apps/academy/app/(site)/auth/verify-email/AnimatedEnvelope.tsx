"use client";

import { motion } from "framer-motion";

/**
 * Enveloppe animée : rabat qui s'ouvre, lettre qui monte, halo dégradé pulsé.
 * Illustration de marque — jamais une simple icône statique.
 */
export function AnimatedEnvelope() {
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      {/* Halo pulsé */}
      <span className="absolute inset-4 rounded-full bg-gradient-da opacity-20 blur-2xl" />
      <motion.span
        aria-hidden
        className="absolute inset-6 rounded-full bg-brand-blue-vif/20"
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
      />

      {/* Enveloppe */}
      <motion.div
        initial={{ y: 12, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="112"
            height="112"
            viewBox="0 0 120 120"
            fill="none"
            role="img"
            aria-label="Email de confirmation envoyé"
          >
            <defs>
              <linearGradient id="env-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#5B3FA8" />
                <stop offset="45%" stopColor="#2B5CC6" />
                <stop offset="100%" stopColor="#00BCD4" />
              </linearGradient>
            </defs>

            {/* Corps de l'enveloppe */}
            <rect
              x="14"
              y="38"
              width="92"
              height="66"
              rx="10"
              fill="#fff"
              stroke="url(#env-grad)"
              strokeWidth="3"
            />

            {/* Lettre qui émerge */}
            <motion.g
              initial={{ y: 0 }}
              animate={{ y: [-2, -14, -2] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <rect
                x="30"
                y="24"
                width="60"
                height="44"
                rx="6"
                fill="#F9FAFB"
                stroke="url(#env-grad)"
                strokeWidth="2.5"
              />
              <rect x="39" y="35" width="42" height="4" rx="2" fill="url(#env-grad)" opacity="0.7" />
              <rect x="39" y="44" width="34" height="4" rx="2" fill="#C7D0E0" />
              <rect x="39" y="53" width="26" height="4" rx="2" fill="#C7D0E0" />
            </motion.g>

            {/* Rabat inférieur (V) qui masque le bas de la lettre */}
            <path
              d="M14 46 L60 82 L106 46"
              fill="none"
              stroke="url(#env-grad)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M17 101 L52 74 M103 101 L68 74"
              stroke="url(#env-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Petites particules « envoi » */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute h-1.5 w-1.5 rounded-full bg-gradient-da"
          style={{ top: `${20 + i * 8}%`, right: `${8 + i * 6}%` }}
          animate={{ y: [0, -14, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
