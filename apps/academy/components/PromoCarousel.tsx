"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { buttonClasses, cn } from "@da/ui";

/* ─────────────────────────── Données ─────────────────────────── */

type Tone = "violet" | "cyan" | "gradient" | "navy";

interface Slide {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  tone: Tone;
}

const SLIDES: readonly Slide[] = [
  {
    eyebrow: "Nouveau",
    title: "Parcours IA & Data",
    subtitle:
      "Devenez Assistant IA, Data Analyst ou Prompt Engineer — avec projets et certificat.",
    cta: { label: "Explorer les parcours IA", href: "/career-paths" },
    tone: "violet",
  },
  {
    eyebrow: "Résultats rapides",
    title: "Formations courtes",
    subtitle:
      "Maîtrisez un outil précis (Canva, Excel, HTML, l'IA) en quelques heures.",
    cta: { label: "Voir les formations", href: "/short-courses" },
    tone: "cyan",
  },
  {
    eyebrow: "Employabilité",
    title: "Prouvez vos compétences",
    subtitle:
      "Portfolio de projets, badges par preuve et certificats vérifiables par QR code.",
    cta: { label: "Créer un compte gratuit", href: "/auth/register" },
    tone: "gradient",
  },
  {
    eyebrow: "Entreprises",
    title: "Formez vos équipes",
    subtitle:
      "Montez en compétence vos collaborateurs sur les métiers du numérique.",
    cta: { label: "Espace entreprises", href: "/companies" },
    tone: "navy",
  },
];

const TONE_BG: Record<Tone, string> = {
  violet: "bg-brand-violet",
  cyan: "bg-brand-cyan",
  gradient: "bg-gradient-da",
  navy: "bg-navy",
};

const ROTATE_MS = 6000;

/* ────────────────────────── Animations ───────────────────────── */

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%", opacity: 0 }),
};

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ─────────────────────────── Icônes ──────────────────────────── */

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/* ──────────────────────── Une bannière ───────────────────────── */

function Banner({ slide, reduce }: { slide: Slide; reduce: boolean }) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl",
        TONE_BG[slide.tone],
      )}
    >
      {/* Décor : grille + blobs flous + vignette */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-[0.12]" />
        <motion.div
          className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl"
          animate={reduce ? undefined : { x: [0, 26, 0], y: [0, 18, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          animate={reduce ? undefined : { x: [0, -22, 0], y: [0, -16, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25" />
        {/* Voile gauche : garantit le contraste du texte blanc sur chaque teinte */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
      </div>

      {/* Contenu */}
      <div className="relative flex h-full max-w-xl flex-col items-start justify-center gap-3 px-12 py-9 sm:px-16 sm:py-10 lg:max-w-2xl lg:px-20">
        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
          {slide.eyebrow}
        </span>

        <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
          {slide.title}
        </h2>

        <p className="max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
          {slide.subtitle}
        </p>

        <Link
          href={slide.cta.href}
          className={cn(buttonClasses({ variant: "white", size: "md" }), "mt-1")}
        >
          {slide.cta.label}
          <Chevron dir="right" />
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────── Carrousel promo ─────────────────────── */

export function PromoCarousel({ className }: { className?: string }) {
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = SLIDES.length;

  const paginate = useCallback(
    (dir: number) => {
      setDirection(dir);
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  const goTo = useCallback(
    (target: number) => {
      setDirection(target > index ? 1 : -1);
      setIndex(target);
    },
    [index],
  );

  // Rotation auto — relancée à chaque changement d'index, en pause au survol/focus.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, index, count]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      paginate(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      paginate(-1);
    }
  };

  const active = SLIDES[index];

  return (
    <section
      className={cn("relative w-full", className)}
      role="region"
      aria-roledescription="carrousel"
      aria-label="Promotions Access Academy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onKeyDown={onKeyDown}
    >
      <div className="relative h-[280px] overflow-hidden rounded-3xl sm:h-[320px] lg:h-[340px]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={reduce ? fadeVariants : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduce
                ? { duration: 0.3, ease: "easeInOut" }
                : {
                    x: { type: "spring", stiffness: 260, damping: 32 },
                    opacity: { duration: 0.35 },
                  }
            }
            className="absolute inset-0"
            aria-roledescription="diapositive"
            aria-label={`${index + 1} sur ${count} — ${active.title}`}
          >
            <Banner slide={SLIDES[index]} reduce={reduce} />
          </motion.div>
        </AnimatePresence>

        {/* Flèches */}
        <button
          type="button"
          onClick={() => paginate(-1)}
          aria-label="Promotion précédente"
          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          onClick={() => paginate(1)}
          aria-label="Promotion suivante"
          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
        >
          <Chevron dir="right" />
        </button>

        {/* Pastilles indicatrices */}
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
          {SLIDES.map((slide, i) => {
            const isActive = i === index;
            return (
              <button
                key={slide.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Aller à la promotion ${i + 1} : ${slide.title}`}
                aria-current={isActive}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  isActive
                    ? "w-7 bg-white"
                    : "w-2.5 bg-white/45 hover:bg-white/70",
                )}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
