"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Flame,
  GraduationCap,
  Lock,
  PlayCircle,
  Route,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  GradientText,
  buttonClasses,
  Badge,
  Container,
  AnimatedCounter,
  useIsDesktop,
} from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   HERO Access Academy §9.1 — « Horizon Numérique »
   Ciel dégradé DA (violet→cyan vertical) + éventail de surfaces produit
   flottantes chevauchant le bas du hero, façon vitrine d'application.
   Composant client : les données réelles arrivent en props depuis page.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface HeroCourse {
  slug: string;
  title: string;
  subtitle: string | null;
  level: CourseLevel;
  price: number; // FCFA, 0 = gratuit
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

/* ─────────────────────────── Utilitaires locaux ─────────────────────────── */

const LEVEL_LABEL: Record<CourseLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

function formatFcfa(price: number): string {
  if (price <= 0) return "Gratuit";
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(price);
}

function initials(seed: string): string {
  const parts = seed.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "A";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "A";
  return (a + b).toUpperCase();
}

/** Repli dégradé DA quand aucune image de couverture n'existe. */
function GradientCover({ seed, label }: { seed: string; label: string }) {
  const hash = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = 115 + (hash % 50);
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(${angle}deg, #5b3fa8 0%, #2b5cc6 38%, #1e8fe1 70%, #00bcd4 100%)`,
      }}
    >
      <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full border border-white/25" />
      <span className="absolute -right-1 -top-3 h-12 w-12 rounded-full border border-white/30" />
      <span className="absolute -bottom-8 -left-5 h-20 w-20 rounded-full bg-white/[0.08]" />
      <span className="absolute inset-0 bg-grid opacity-30" />
      <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/45 to-transparent p-2.5 text-[0.68rem] font-semibold leading-tight text-white/95">
        {label}
      </span>
    </div>
  );
}

/** Rangée d'étoiles décorative (l'éventail entier est aria-hidden). */
function Stars({ value = 5, size = 14 }: { value?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(value)
              ? "fill-warning text-warning"
              : "fill-transparent text-white/25"
          }
        />
      ))}
    </span>
  );
}

/* ═══════════════════ Surfaces hétérogènes de l'éventail ═══════════════════ */

const CARD_SHELL =
  "overflow-hidden rounded-2xl border border-white/12 bg-surface-dark-card/85 shadow-[0_26px_64px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl";

/** 1 · Lecteur de cours — vignette + progression de chapitres. */
function LecteurCard({ course }: { course: HeroCourse }) {
  const chapters = [
    { label: "Introduction", state: "done" as const },
    { label: "Mise en pratique", state: "current" as const },
    { label: "Projet final", state: "locked" as const },
  ];
  return (
    <div className={`${CARD_SHELL} w-[188px]`}>
      <div className="relative h-[86px]">
        {course.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <GradientCover seed={course.title} label={course.title} />
        )}
        <span className="absolute left-2 top-2">
          <Badge variant="gradient" className="text-[0.6rem]">
            {LEVEL_LABEL[course.level]}
          </Badge>
        </span>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-brand-blue-royal shadow-lg">
            <PlayCircle size={20} />
          </span>
        </span>
      </div>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-1 text-[0.8rem] font-semibold text-white">
          {course.title}
        </h3>
        <ul className="space-y-1.5">
          {chapters.map((c) => (
            <li key={c.label} className="flex items-center gap-1.5 text-[0.68rem]">
              {c.state === "done" && (
                <CheckCircle2 size={12} className="shrink-0 text-success" />
              )}
              {c.state === "current" && (
                <PlayCircle size={12} className="shrink-0 text-brand-cyan" />
              )}
              {c.state === "locked" && (
                <Lock size={12} className="shrink-0 text-white/30" />
              )}
              <span
                className={
                  c.state === "locked"
                    ? "text-white/35"
                    : c.state === "current"
                      ? "font-medium text-white"
                      : "text-white/60"
                }
              >
                {c.label}
              </span>
            </li>
          ))}
        </ul>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full w-[68%] rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan" />
        </div>
      </div>
    </div>
  );
}

/** 2 · Parcours métier — objectif emploi + jauge d'étapes. */
function ParcoursCard({ path }: { path: HeroPath }) {
  return (
    <div className={`${CARD_SHELL} w-[184px]`}>
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-da text-white">
          <Route size={13} />
        </span>
        <span className="text-[0.72rem] font-semibold text-white">
          Parcours métier
        </span>
      </div>
      <div className="space-y-2.5 p-3.5">
        <h3 className="line-clamp-2 text-[0.8rem] font-semibold leading-snug text-white">
          {path.title}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-da px-2 py-0.5 text-[0.62rem] font-semibold text-white">
          <TrendingUp size={11} /> {path.targetJob}
        </span>
        <div className="flex items-center gap-1" aria-hidden>
          {Array.from({ length: Math.min(6, Math.max(3, path.coursesCount)) }).map(
            (_, i, arr) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < Math.ceil(arr.length * 0.6)
                    ? "bg-gradient-to-r from-brand-violet to-brand-cyan"
                    : "bg-white/12"
                }`}
              />
            ),
          )}
        </div>
        <div className="flex items-center justify-between text-[0.66rem] text-white/55">
          <span>{path.coursesCount} formations</span>
          <span className="font-semibold text-brand-cyan">
            {LEVEL_LABEL[(path.exitLevel as CourseLevel) ?? "ADVANCED"] ??
              "Avancé"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 3 · Tableau de bord — carte centrale, la plus large. */
function DashboardCard({ learnersCount }: { learnersCount: number }) {
  const bars = [42, 68, 55, 88, 73, 96];
  return (
    <div className={`${CARD_SHELL} w-[210px]`}>
      <div className="flex items-center justify-between bg-gradient-da px-4 py-3">
        <span className="text-[0.78rem] font-semibold text-white">
          Ma progression
        </span>
        <TrendingUp size={16} className="text-white" />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[0.7rem]">
            <span className="text-white/60">Parcours Data Analyst</span>
            <span className="font-semibold text-brand-cyan">72%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
              style={{ width: "72%" }}
            />
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-brand-violet/40 to-brand-cyan"
              style={{ height: `${(h / 100) * 38 + 8}px` }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
          <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-warning">
            <Flame size={13} className="fill-warning" /> 12 j
          </span>
          <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-white">
            <Sparkles size={13} className="text-brand-cyan" />
            <AnimatedCounter value={2450} /> XP
          </span>
        </div>
        <p className="text-[0.63rem] leading-tight text-white/45">
          Aux côtés de {new Intl.NumberFormat("fr-FR").format(learnersCount)}+
          apprenants
        </p>
      </div>
    </div>
  );
}

/** 4 · Certificat vérifiable — bandeau dégradé + code + QR factice. */
function CertificatCard({ path }: { path: HeroPath }) {
  const title = path.certificationTitle ?? path.title;
  return (
    <div className={`${CARD_SHELL} w-[188px]`}>
      <div className="flex items-center gap-2 bg-gradient-da px-3.5 py-2.5">
        <Award size={16} className="text-white" />
        <span className="text-[0.74rem] font-semibold text-white">
          Certificat
        </span>
      </div>
      <div className="space-y-2.5 p-3.5">
        <h3 className="line-clamp-2 text-[0.78rem] font-semibold leading-snug text-white">
          {title}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[0.62rem] font-semibold text-success">
          <BadgeCheck size={11} /> Vérifiable
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.62rem] tracking-tight text-white/55">
            DA-CERT-4F9K2
          </span>
          <span
            className="grid shrink-0 grid-cols-4 gap-0.5 rounded bg-white/95 p-1"
            aria-hidden
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={`h-1 w-1 rounded-[1px] ${
                  [0, 1, 2, 4, 6, 8, 9, 11, 13, 14, 15].includes(i)
                    ? "bg-navy"
                    : "bg-transparent"
                }`}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 5 · Note & avis — score géant + pile d'avatars. */
function AvisCard({ learnersCount }: { learnersCount: number }) {
  const avatars = ["Awa K", "Moussa B", "Sarah F", "Yao D"];
  return (
    <div className={`${CARD_SHELL} w-[178px]`}>
      <div className="space-y-2.5 p-4">
        <div className="flex items-end gap-1.5">
          <span className="font-display text-3xl font-extrabold leading-none text-white">
            4,9
          </span>
          <span className="pb-0.5 text-[0.72rem] text-white/50">/ 5</span>
        </div>
        <Stars value={5} size={13} />
        <p className="text-[0.66rem] text-white/55">
          Sur {new Intl.NumberFormat("fr-FR").format(learnersCount)}+ avis
          d&apos;apprenants
        </p>
        <div className="flex items-center pt-0.5">
          <div className="flex -space-x-2">
            {avatars.map((a, i) => (
              <span
                key={a}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-surface-dark-card text-[0.58rem] font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg,#5b3fa8,#2b5cc6 50%,#00bcd4)",
                  zIndex: avatars.length - i,
                }}
              >
                {initials(a)}
              </span>
            ))}
          </div>
          <span className="ml-2 text-[0.62rem] font-medium text-brand-cyan">
            Rejoignez-les
          </span>
        </div>
      </div>
    </div>
  );
}

/** Micro-pastille témoignage flottante (élément humain, desktop). */
function TemoignagePastille() {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#7c3aed,#00bcd4)" }}
      >
        AK
      </span>
      <div>
        <Stars value={5} size={10} />
        <p className="mt-0.5 text-[0.62rem] font-medium text-white/80">
          « J&apos;ai décroché un emploi »
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Éventail flottant ════════════════════════════ */

type Slot = {
  key: string;
  x: number; // centre de la carte / centre du stage (px)
  arcY: number; // position verticale de repos (négatif = plus haut) → dessine l'arc
  rotate: number;
  z: number;
  halfWidth: number;
  content: React.ReactNode;
};

export default function HeroSection({
  stats,
  courses,
  paths,
  schoolsCount,
}: HeroSectionProps) {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const c0 = courses[0];
  const p0 = paths[0];
  const p1 = paths[1] ?? paths[0];

  // Surfaces disponibles (fallbacks si données manquantes).
  const lecteur = c0 ? <LecteurCard course={c0} /> : null;
  const parcours = p0 ? <ParcoursCard path={p0} /> : null;
  const dashboard = <DashboardCard learnersCount={stats.learnersCount} />;
  const certificat = p1 ? <CertificatCard path={p1} /> : null;
  const avis = <AvisCard learnersCount={stats.learnersCount} />;

  // Desktop : 5 surfaces en arc symétrique. Mobile : 3 recentrées, arc resserré.
  const desktopSlots: (Slot | null)[] = [
    lecteur && { key: "lecteur", x: -300, arcY: 44, rotate: -15, z: 10, halfWidth: 94, content: lecteur },
    parcours && { key: "parcours", x: -158, arcY: 10, rotate: -8, z: 20, halfWidth: 92, content: parcours },
    { key: "dashboard", x: 0, arcY: -30, rotate: 0, z: 30, halfWidth: 105, content: dashboard },
    certificat && { key: "certificat", x: 158, arcY: 10, rotate: 8, z: 20, halfWidth: 94, content: certificat },
    avis && { key: "avis", x: 300, arcY: 44, rotate: 15, z: 10, halfWidth: 89, content: avis },
  ];
  const mobileSlots: (Slot | null)[] = [
    parcours && { key: "m-parcours", x: -74, arcY: 18, rotate: -8, z: 20, halfWidth: 92, content: parcours },
    { key: "m-dashboard", x: 0, arcY: -14, rotate: 0, z: 30, halfWidth: 105, content: dashboard },
    avis && { key: "m-avis", x: 74, arcY: 18, rotate: 8, z: 10, halfWidth: 89, content: avis },
  ];
  const slots = (isDesktop ? desktopSlots : mobileSlots).filter(Boolean) as Slot[];

  const cardEntrance: Variants = {
    hidden: { opacity: 0, y: 60, scale: 0.85 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: 0.15 + i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <section className="relative isolate overflow-hidden bg-surface-dark text-white">
      {/* ── Fond : lever de soleil numérique violet → cyan (vertical) ── */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg,#160f2e 0%,#241653 26%,#2b3a8c 54%,#1e6fb8 78%,#0e8aa8 100%)",
        }}
        aria-hidden
      />
      {/* Halos flous type nuages lumineux */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <span
          className={`absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand-violet/40 blur-3xl ${
            reduce ? "" : "animate-blob"
          }`}
        />
        <span
          className={`absolute right-[-6rem] top-24 h-96 w-96 rounded-full bg-brand-cyan/30 blur-3xl ${
            reduce ? "" : "animate-float"
          }`}
        />
        <span className="absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand-blue-vif/30 blur-3xl" />
      </div>
      {/* Grille discrète + voile de lisibilité haut */}
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.12]" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 -z-10 h-2/3 bg-gradient-to-b from-black/25 to-transparent"
        aria-hidden
      />

      <Container className="relative pb-0 pt-20 sm:pt-24 lg:pt-28">
        {/* ── Bloc titre centré ── */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[0.8rem] font-medium text-white/85 backdrop-blur-sm">
              <GraduationCap size={15} className="text-brand-cyan" aria-hidden />
              L&apos;académie qui mène à l&apos;emploi en Côte d&apos;Ivoire
            </span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]"
          >
            Apprenez, pratiquez,{" "}
            <br className="hidden sm:block" />
            devenez{" "}
            <GradientText className="drop-shadow-[0_2px_20px_rgba(0,188,212,0.35)]">
              employable
            </GradientText>
            .
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Formations concrètes, projets réels et certifications reconnues.
            Passez de la théorie à l&apos;employabilité avec Access Academy.
          </motion.p>

          {/* ── Doubles CTA ── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/inscription"
              className={buttonClasses({
                variant: "primary",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              Commencer gratuitement
              <span className="ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight size={15} aria-hidden />
              </span>
            </Link>
            <Link
              href="/formations"
              className={buttonClasses({
                variant: "outline",
                size: "lg",
                className:
                  "w-full border-white/25 bg-white/[0.06] text-white backdrop-blur-sm hover:border-brand-cyan/60 hover:text-white sm:w-auto",
              })}
            >
              <PlayCircle size={18} aria-hidden />
              Explorer les formations
            </Link>
          </motion.div>

          {/* ── Preuve sociale étoilée ── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/80"
          >
            <span aria-label="Noté 4,9 sur 5">
              <Stars value={5} size={15} />
            </span>
            <span className="font-semibold text-white">4,9/5</span>
            <span className="text-white/50" aria-hidden>·</span>
            <span>
              Noté par{" "}
              <span className="font-semibold text-white">
                <AnimatedCounter value={stats.learnersCount} suffix="+" />
              </span>{" "}
              apprenants
            </span>
          </motion.div>

          {/* Bandeau de confiance chiffré */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.8rem] text-white/60"
          >
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={15} className="text-brand-cyan" aria-hidden />
              <AnimatedCounter value={stats.certificatesCount} /> certificats
              délivrés
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={15} className="text-brand-cyan" aria-hidden />
              <AnimatedCounter value={schoolsCount} /> écoles métiers
            </span>
            {p0 && (
              <Link
                href="/parcours-metiers"
                className="inline-flex items-center gap-1.5 text-white/70 transition-colors hover:text-brand-cyan"
              >
                <TrendingUp size={15} aria-hidden />
                Objectif : {p0.targetJob}
              </Link>
            )}
          </motion.div>
        </div>

        {/* ── Éventail de surfaces flottantes (signature) ── */}
        <div
          className="relative mx-auto mt-12 h-[280px] w-full max-w-5xl sm:h-[330px] lg:mt-16 lg:h-[370px]"
          aria-hidden
        >
          {/* Pastille témoignage, surplomb haut-droite (desktop) */}
          {mounted && isDesktop && (
            <motion.div
              className="absolute right-[6%] top-1 z-40"
              initial={reduce ? false : { opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { delay: 0.95, type: "spring", stiffness: 200, damping: 16 }
              }
            >
              <div className={reduce ? "" : "animate-float"}>
                <TemoignagePastille />
              </div>
            </motion.div>
          )}

          {/* Cartes rendues après montage (décoratives) → aucun flash SSR, espace réservé */}
          {mounted &&
            slots.map((slot, i) => (
              <motion.div
                key={slot.key}
                className="absolute bottom-0 left-1/2 will-change-transform"
                style={{ zIndex: slot.z, x: slot.x - slot.halfWidth, rotate: slot.rotate }}
                custom={i}
                variants={cardEntrance}
                initial={reduce ? false : "hidden"}
                animate="show"
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -18,
                        scale: 1.05,
                        zIndex: 60,
                        transition: { type: "spring", stiffness: 300, damping: 20 },
                      }
                }
              >
                {/* Position de repos (arc) + flottement continu — isolé du hover */}
                <motion.div
                  animate={
                    reduce
                      ? { y: slot.arcY }
                      : { y: [slot.arcY, slot.arcY - 12, slot.arcY] }
                  }
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          duration: 6 + i * 0.7,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.3,
                        }
                  }
                >
                  {slot.content}
                </motion.div>
              </motion.div>
            ))}

          {/* Fondu bas : fusionne l'éventail avec la section suivante */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-20 bg-gradient-to-t from-surface-dark to-transparent" />
        </div>
      </Container>
    </section>
  );
}
