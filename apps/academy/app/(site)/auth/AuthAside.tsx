"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Monogram } from "@da/ui";
import { AcademyLogo } from "@/components/AcademyLogo";

/**
 * Panneau latéral de marque pour l'espace d'authentification Academy.
 * Dégradé signature, formes organiques animées, monogramme en filigrane,
 * citation d'apprenant et arguments clés. Masqué en mobile (lg:flex).
 */
export function AuthAside({
  quote,
  author,
  role,
  bullets,
}: {
  quote: string;
  author: string;
  role: string;
  bullets: string[];
}) {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-da lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Décor : grille + blobs animés + monogramme filigrané */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <motion.div
          className="absolute -left-24 top-[8%] h-80 w-80 rounded-full bg-white/15 blur-[90px]"
          animate={{ x: [0, 30, 0], y: [0, 26, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-16 bottom-[6%] h-72 w-72 rounded-full bg-brand-cyan/40 blur-[100px]"
          animate={{ x: [0, -24, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <Monogram
          variant="white"
          size={340}
          className="absolute -bottom-20 -right-16 opacity-[0.08]"
        />
      </div>

      {/* En-tête : lockup Access Academy sur pastille translucide */}
      <div className="relative">
        <Link
          href="/"
          aria-label="Access Academy — accueil"
          className="inline-flex items-center rounded-2xl bg-white/12 px-4 py-2.5 ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/[0.18]"
        >
          <AcademyLogo dark size={38} />
        </Link>
      </div>

      {/* Citation d'apprenant */}
      <motion.figure
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-md"
      >
        <span
          aria-hidden
          className="font-display text-7xl leading-none text-white/25"
        >
          “
        </span>
        <blockquote className="-mt-6 font-display text-2xl font-bold leading-snug text-white xl:text-[1.7rem]">
          {quote}
        </blockquote>
        <figcaption className="mt-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 font-display text-sm font-bold text-white ring-1 ring-white/30">
            {author
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="text-sm">
            <span className="block font-semibold text-white">{author}</span>
            <span className="block text-white/70">{role}</span>
          </span>
        </figcaption>
      </motion.figure>

      {/* Arguments clés */}
      <ul className="relative space-y-3">
        {bullets.map((bullet, i) => (
          <motion.li
            key={bullet}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-3 text-sm font-medium text-white/90"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
              <Check size={13} strokeWidth={3} className="text-white" />
            </span>
            {bullet}
          </motion.li>
        ))}
      </ul>

      {/* Décoratif : signature domaine */}
      <div
        aria-hidden
        className="relative mt-2 hidden text-xs font-medium tracking-wide text-white/55 xl:block"
      >
        academy.digitalaccess.ci — la plateforme e-learning de Digital Access
      </div>
    </aside>
  );
}
