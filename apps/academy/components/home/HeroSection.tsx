"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Award, Clock, GraduationCap, PlayCircle, Sparkles, Users } from "lucide-react";
import { GradientText } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   HERO Access Academy §9.1 — modèle « apprenant » (fond photo navy DA)
   Colonne de gauche : titre + CTA + preuve sociale sur le fond sombre.
   Colonne de droite : cartes flottantes (progression / leçon) sur le sujet.
   Bande basse : 4 piliers utiles (liens réels). Couleurs 100 % Digital Access.
   ══════════════════════════════════════════════════════════════════════════ */

type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface HeroCourse {
  slug: string;
  title: string;
  subtitle: string | null;
  level: CourseLevel;
  price: number;
  coverImage: string | null;
  rating: number | null;
  reviewsCount: number;
  modulesCount: number;
  hasCertificate: boolean;
  hasProject: boolean;
  schoolName: string | null;
}

export interface HeroPath {
  slug: string;
  title: string;
  targetJob: string;
  coursesCount: number;
  projectsCount: number;
  exitLevel: string;
  certificationTitle: string | null;
}

export interface HeroSectionProps {
  stats: { learnersCount: number; certificatesCount: number };
  courses: HeroCourse[];
  paths: HeroPath[];
  schoolsCount: number;
}

/* ─── Avatars fictifs de la preuve sociale ─────────────────────────────────── */

function Avatar({ seed, size = 36 }: { seed: string; size?: number }) {
  const parts = seed.trim().split(/\s+/);
  const ini = ((parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "")).toUpperCase();
  const hash = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = 120 + (hash % 60);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-surface-dark"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `linear-gradient(${angle}deg,#5b3fa8,#1e8fe1 60%,#00bcd4)`,
      }}
      aria-hidden
    >
      {ini}
    </span>
  );
}

/* ─── Piliers de la bande basse ────────────────────────────────────────────── */

const PILLARS = [
  {
    icon: GraduationCap,
    title: "Formateurs experts",
    text: "Des cours conçus par des professionnels du numérique.",
    href: "/formations",
  },
  {
    icon: Clock,
    title: "À votre rythme",
    text: "Apprenez quand vous voulez, où que vous soyez.",
    href: "/formations",
  },
  {
    icon: Award,
    title: "Certifications reconnues",
    text: "Des certificats vérifiables qui valorisent votre profil.",
    href: "/certifications",
  },
  {
    icon: Users,
    title: "Communauté & mentorat",
    text: "Progressez entouré d'apprenants et de mentors.",
    href: "/parcours-metiers",
  },
] as const;

/* ══════════════════════════════════════════════════════════════════════════ */

export default function HeroSection({ courses }: HeroSectionProps) {
  const reduce = useReducedMotion();
  const lessonTitle = courses[0]?.title ?? "Bases du design UX/UI";
  const lessonModules = courses[0]?.modulesCount ?? 12;

  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      data-hero
      className="relative isolate -mt-20 overflow-hidden bg-surface-dark text-white lg:-mt-24"
    >
      {/* ── Image de fond (sujet à droite, navy à gauche) ── */}
      <Image
        src="/hero-home.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-30 object-cover object-[72%_center] lg:object-right"
      />
      {/* Voiles de lisibilité + teinte DA */}
      <div
        className="absolute inset-0 -z-20 bg-gradient-to-r from-surface-dark via-surface-dark/85 to-surface-dark/10"
        aria-hidden
      />
      <div className="absolute inset-0 -z-20 bg-surface-dark/50 sm:bg-transparent" aria-hidden />
      <span
        className="pointer-events-none absolute -left-32 top-0 -z-10 h-96 w-96 rounded-full bg-brand-violet/25 blur-[120px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[720px] max-w-7xl flex-col px-5 sm:px-8 lg:min-h-[820px] lg:px-10">
        {/* ══ Contenu principal (2 colonnes) ══ */}
        <div className="grid flex-1 items-center gap-10 pt-28 pb-12 lg:grid-cols-2 lg:pt-36">
          {/* ── Colonne gauche ── */}
          <div className="max-w-xl">
            <motion.span
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[0.8rem] font-medium text-white/85 backdrop-blur-sm"
            >
              <Sparkles size={14} className="text-brand-cyan" aria-hidden />
              L&apos;académie qui mène à l&apos;emploi en Côte d&apos;Ivoire
            </motion.span>

            <motion.h1
              {...fadeUp(0.08)}
              className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]"
            >
              Apprenez des compétences.
              <br />
              Accélérez votre{" "}
              <GradientText className="[background-image:linear-gradient(120deg,#7c6cf0_0%,#1e8fe1_45%,#00e5ff_100%)]">
                avenir
              </GradientText>
              .
            </motion.h1>

            <motion.p
              {...fadeUp(0.16)}
              className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg"
            >
              Accédez à des formations de qualité animées par des experts et apprenez à votre rythme.
              Où que vous soyez, quand vous voulez.
            </motion.p>

            <motion.div {...fadeUp(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/formations"
                className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-gradient-da pl-7 pr-2 font-semibold text-white shadow-[0_16px_40px_-12px_rgba(0,188,212,0.55)] outline-none transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark active:translate-y-0 active:scale-[0.98]"
              >
                Explorer les formations
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight size={17} aria-hidden />
                </span>
              </Link>
              <Link
                href="/a-propos"
                className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/[0.06] px-6 font-medium text-white outline-none backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark active:translate-y-0 active:scale-[0.98]"
              >
                <PlayCircle size={20} className="text-brand-cyan" aria-hidden />
                Comment ça marche
              </Link>
            </motion.div>

            {/* Preuve sociale */}
            <motion.div {...fadeUp(0.32)} className="mt-9 flex items-center gap-4">
              <div className="flex items-center">
                <div className="flex -space-x-3">
                  {["Awa K", "Moussa B", "Sarah F", "Yao D"].map((s) => (
                    <Avatar key={s} seed={s} />
                  ))}
                </div>
                <span className="-ml-3 grid h-9 items-center rounded-full bg-gradient-da px-3 text-xs font-bold text-white ring-2 ring-surface-dark">
                  2K+
                </span>
              </div>
              <p className="max-w-[15rem] text-sm leading-snug text-white/70">
                Des apprenants se forment déjà avec Access Academy.
              </p>
            </motion.div>
          </div>

          {/* ── Colonne droite : cartes flottantes sur le sujet ── */}
          <div className="relative hidden h-full min-h-[420px] lg:block" aria-hidden>
            {/* Carte progression */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-[18%] w-[270px]"
            >
              <div className={reduce ? "" : "animate-float"}>
                <div className="rounded-2xl border border-white/10 bg-surface-dark-card/80 p-4 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white/90">Votre progression</span>
                    <span className="font-display text-lg font-extrabold">
                      <GradientText>78%</GradientText>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full w-[78%] rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan" />
                  </div>
                  <p className="mt-2.5 text-[0.78rem] text-white/55">
                    Continuez, vous y êtes presque !
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Carte leçon en cours */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-[10%] right-4 w-[300px]"
            >
              <div className={reduce ? "" : "animate-float [animation-delay:2s]"}>
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-surface-dark-card/80 p-4 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-da text-white shadow-brand">
                    <PlayCircle size={24} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.72rem] font-medium uppercase tracking-wide text-brand-cyan">
                      Leçon en cours
                    </p>
                    <p className="line-clamp-1 text-sm font-bold text-white">{lessonTitle}</p>
                    <p className="mt-0.5 text-[0.72rem] text-white/55">
                      Leçon 4 sur {lessonModules} · 50 min restantes
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ══ Bande basse : 4 piliers utiles ══ */}
        <motion.div
          {...fadeUp(0.45)}
          className="mb-8 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-surface-dark/50 p-3 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4 lg:gap-2"
        >
          {PILLARS.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group flex items-start gap-3 rounded-xl p-3 outline-none transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-brand-cyan"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand transition-transform group-hover:scale-105">
                <p.icon size={20} aria-hidden />
              </span>
              <div>
                <p className="flex items-center gap-1 text-sm font-bold text-white">
                  {p.title}
                  <ArrowRight
                    size={13}
                    className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                    aria-hidden
                  />
                </p>
                <p className="mt-0.5 text-[0.78rem] leading-snug text-white/60">{p.text}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
