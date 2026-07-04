"use client";

import { motion } from "framer-motion";
import { Monogram, Badge } from "@da/ui";
import { MapPin, Sparkles } from "lucide-react";

/**
 * Bloc histoire / mission / vision : texte éditorial en 2 colonnes avec une
 * composition visuelle signature (carte dégradée + Monogram géant en filigrane).
 */
export function AboutStory() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
      {/* Colonne texte éditorial */}
      <div>
        <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
          <span className="h-px w-7 bg-gradient-da" />
          Notre histoire
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-navy sm:text-4xl">
          Rendre le numérique{" "}
          <span className="text-gradient-da">réellement accessible</span> en
          Côte d'Ivoire
        </h2>

        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-text-secondary">
          <p>
            Digital Access est né à Abidjan d'un constat simple : trop
            d'entrepreneurs, de PME et d'institutions ivoiriennes restaient à
            l'écart du numérique, faute d'un partenaire à la fois abordable,
            exigeant et à leur écoute. Les sites génériques copiés d'un template
            ne racontaient rien ; les grandes agences restaient hors de portée.
          </p>
          <p>
            Nous avons décidé de combler ce vide. Depuis, nous concevons des
            sites, des applications et des plateformes e-learning sur-mesure,
            pensés pour le contexte local : rapides sur les réseaux mobiles,
            ouverts au paiement Mobile Money et portés par un accompagnement
            humain, du premier échange jusqu'après la mise en ligne.
          </p>
          <p className="font-medium text-navy">
            Notre conviction : un outil numérique n'a de valeur que s'il sert
            vraiment votre activité.
          </p>
        </div>

        {/* Mission / Vision */}
        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
              Notre mission
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Donner à chaque acteur ivoirien les moyens d'exister, de vendre et
              de former en ligne, avec des outils sur-mesure et durables.
            </p>
          </div>
          <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
              Notre vision
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Devenir le partenaire numérique de référence en Afrique de
              l'Ouest, reconnu pour son exigence et sa proximité.
            </p>
          </div>
        </div>
      </div>

      {/* Composition visuelle signature */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto aspect-square w-full max-w-md"
      >
        {/* Carte dégradée principale */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-gradient-da shadow-brand-lg">
          <div aria-hidden className="absolute inset-0 bg-grid opacity-25" />
          <Monogram
            variant="white"
            size={280}
            className="absolute -bottom-10 -right-8 opacity-15"
          />
          <div className="relative flex h-full flex-col justify-between p-8">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              <Sparkles size={14} />
              Depuis 2021
            </span>
            <div>
              <p className="font-display text-3xl font-extrabold leading-tight text-white">
                Le numérique, sans barrières.
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-white/85">
                <MapPin size={16} />
                Cocody, Abidjan — Côte d'Ivoire
              </p>
            </div>
          </div>
        </div>

        {/* Pastilles flottantes */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-5 top-10 rounded-2xl border border-navy/[0.07] bg-surface-primary px-5 py-4 shadow-brand"
        >
          <p className="font-display text-2xl font-extrabold text-gradient-da">
            48+
          </p>
          <p className="text-xs text-text-secondary">projets livrés</p>
        </motion.div>
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute -right-4 bottom-12 flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary px-5 py-4 shadow-brand"
        >
          <Badge variant="success">100 % sur-mesure</Badge>
        </motion.div>
      </motion.div>
    </div>
  );
}
