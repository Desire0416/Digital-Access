"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@da/ui";

interface Milestone {
  year: string;
  title: string;
  description: string;
}

const milestones: Milestone[] = [
  {
    year: "2021",
    title: "Les débuts",
    description:
      "Digital Access voit le jour à Abidjan avec une première mission : offrir aux petites entreprises ivoiriennes une vitrine en ligne digne de leur ambition.",
  },
  {
    year: "2022",
    title: "L'affirmation",
    description:
      "Notre approche 100 % sur-mesure séduit commerces et PME. Nous intégrons le paiement Mobile Money et bâtissons notre design system signature.",
  },
  {
    year: "2023",
    title: "Access Academy",
    description:
      "Naissance de notre plateforme e-learning : nous ne construisons plus seulement des outils, nous transmettons aussi les compétences du numérique.",
  },
  {
    year: "2024",
    title: "Le partenaire de référence",
    description:
      "Institutions, écoles et entreprises nous confient leurs projets stratégiques. Plus de 48 réalisations et 1200 apprenants formés plus tard, l'aventure continue.",
  },
];

/** Parcours de l'entreprise en jalons, sur une ligne dégradée verticale. */
export function Timeline() {
  return (
    <motion.ol
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="relative mx-auto max-w-3xl space-y-10 pl-8 sm:pl-0"
    >
      {/* Ligne dégradée */}
      <span
        aria-hidden
        className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-0.5 rounded-full bg-gradient-to-b from-brand-violet via-brand-blue-vif to-brand-cyan sm:left-1/2 sm:-translate-x-1/2"
      />

      {milestones.map((m, i) => (
        <motion.li
          key={m.year}
          variants={staggerItem}
          className="relative sm:grid sm:grid-cols-2 sm:gap-10"
        >
          {/* Point sur la ligne */}
          <span
            aria-hidden
            className="absolute -left-8 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-gradient-da shadow-brand sm:left-1/2 sm:-translate-x-1/2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>

          <div
            className={
              i % 2 === 0
                ? "sm:col-start-1 sm:text-right sm:pr-10"
                : "sm:col-start-2 sm:pl-10"
            }
          >
            <span className="font-display text-3xl font-extrabold text-gradient-da">
              {m.year}
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-navy">
              {m.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {m.description}
            </p>
          </div>
        </motion.li>
      ))}
    </motion.ol>
  );
}
