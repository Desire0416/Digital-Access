"use client";

import { UserPlus, Search, PlayCircle, Award } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@da/ui";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Créez votre compte",
    description:
      "Inscrivez-vous gratuitement en quelques secondes et confirmez votre email pour débloquer toutes les fonctionnalités.",
  },
  {
    number: "02",
    icon: Search,
    title: "Choisissez un cours",
    description:
      "Explorez le catalogue par catégorie, filtrez selon votre niveau et payez en Mobile Money — Orange, MTN ou Wave.",
  },
  {
    number: "03",
    icon: PlayCircle,
    title: "Apprenez à votre rythme",
    description:
      "Suivez les vidéos, validez les quiz et progressez chapitre après chapitre, sur mobile comme sur ordinateur.",
  },
  {
    number: "04",
    icon: Award,
    title: "Obtenez votre certificat",
    description:
      "À la fin du cours, recevez un certificat vérifiable par QR code, à partager sur LinkedIn et votre CV.",
  },
];

/** « Comment ça marche » — 4 étapes reliées par un filet dégradé. */
export function HowItWorks() {
  return (
    <StaggerGroup className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {/* Ligne de liaison desktop */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-brand-violet/40 via-brand-blue-vif/40 to-brand-cyan/40 lg:block"
      />
      {steps.map(({ number, icon: StepIcon, title, description }) => (
        <StaggerItem key={number} className="relative">
          <div className="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-da text-white shadow-brand">
            <StepIcon size={24} />
            <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-navy px-1.5 font-display text-[11px] font-bold text-white">
              {number}
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
