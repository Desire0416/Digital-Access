"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Clock,
  Flame,
  Medal,
  PlayCircle,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { GradientText } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   HERO Access Academy §9.1 — « Ciel numérique »
   Direction artistique : ciel bleu lumineux DA + nuages blancs/bleutés en bas,
   contenu centré en moitié haute, éventail de 9 cartes pédagogiques (cartes
   blanches, contenu aux couleurs DA) flottant en arc au-dessus des nuages.
   Couleurs 100 % Digital Access (dégradé signature violet→cyan).
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

/* ─────────────────────────── Utilitaires locaux ─────────────────────────── */

const LEVEL_LABEL: Record<CourseLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

/** Surface de carte claire, façon interface produit posée sur le ciel. */
const CARD =
  "overflow-hidden rounded-2xl border border-navy/[0.06] bg-white shadow-[0_22px_55px_-18px_rgba(27,42,90,0.45)]";

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
      <span className="absolute -right-5 -top-6 h-20 w-20 rounded-full border border-white/25" />
      <span className="absolute -bottom-6 -left-4 h-16 w-16 rounded-full bg-white/[0.1]" />
      <span className="absolute inset-0 bg-grid opacity-25" />
      <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/40 to-transparent p-2 text-[0.66rem] font-semibold leading-tight text-white">
        {label}
      </span>
    </div>
  );
}

function Avatar({ seed, size = 28 }: { seed: string; size?: number }) {
  const parts = seed.trim().split(/\s+/);
  const ini = ((parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "")).toUpperCase();
  const hash = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = 120 + (hash % 60);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(${angle}deg,#5b3fa8,#1e8fe1 60%,#00bcd4)`,
      }}
    >
      {ini}
    </span>
  );
}

/* ═══════════════════ 9 surfaces pédagogiques (cartes blanches) ═══════════════════ */

/** 0 · Badge de compétence. */
function BadgeCard() {
  return (
    <div className={`${CARD} w-full p-3.5`}>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-da text-white shadow-brand">
          <Medal size={22} />
        </span>
        <div>
          <p className="text-[0.78rem] font-bold text-navy">Compétence validée</p>
          <p className="text-[0.66rem] text-text-secondary">Analyse de données</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue-vif/10 px-2 py-0.5 text-[0.6rem] font-semibold text-brand-blue-royal">
          <BadgeCheck size={11} /> Niveau Avancé
        </span>
      </div>
    </div>
  );
}

/** 1 · Aperçu d'un cours. */
function CoursePreviewCard({ course }: { course: HeroCourse }) {
  return (
    <div className={`${CARD} w-full`}>
      <div className="relative h-[72px]">
        {course.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <GradientCover seed={course.title} label={course.title} />
        )}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand-blue-royal shadow">
            <PlayCircle size={18} />
          </span>
        </span>
      </div>
      <div className="space-y-1.5 p-2.5">
        <span className="inline-flex rounded-full bg-gradient-da px-2 py-0.5 text-[0.58rem] font-semibold text-white">
          {LEVEL_LABEL[course.level]}
        </span>
        <p className="line-clamp-1 text-[0.74rem] font-bold text-navy">{course.title}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-navy/[0.07]">
          <span className="block h-full w-[64%] rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan" />
        </div>
      </div>
    </div>
  );
}

/** 2 · Profil d'un apprenant. */
function LearnerProfileCard() {
  return (
    <div className={`${CARD} w-full p-3`}>
      <div className="flex items-center gap-2.5">
        <Avatar seed="Awa Koné" size={38} />
        <div className="min-w-0">
          <p className="truncate text-[0.78rem] font-bold text-navy">Awa Koné</p>
          <p className="truncate text-[0.64rem] text-text-secondary">Apprenante · Abidjan</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between rounded-lg bg-surface-secondary px-2.5 py-1.5">
        <span className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-warning">
          <Flame size={12} className="fill-warning" /> 12 j
        </span>
        <span className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-brand-blue-royal">
          <Sparkles size={12} /> 2 450 XP
        </span>
      </div>
    </div>
  );
}

/** 3 · Graphique de progression. */
function ProgressGraphCard() {
  return (
    <div className={`${CARD} w-full p-3`}>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[0.74rem] font-bold text-navy">Progression</p>
        <span className="inline-flex items-center gap-0.5 text-[0.64rem] font-semibold text-success">
          <TrendingUp size={12} /> +38%
        </span>
      </div>
      <svg viewBox="0 0 120 46" className="w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="da-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e8fe1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00bcd4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="da-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b3fa8" />
            <stop offset="100%" stopColor="#00bcd4" />
          </linearGradient>
        </defs>
        <path d="M0,38 L18,32 L36,34 L54,22 L72,24 L90,12 L108,14 L120,6 L120,46 L0,46 Z" fill="url(#da-area)" />
        <path d="M0,38 L18,32 L36,34 L54,22 L72,24 L90,12 L108,14 L120,6" fill="none" stroke="url(#da-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-1 text-[0.62rem] text-text-secondary">7 derniers jours</p>
    </div>
  );
}

/** 4 · Tableau de bord (carte centrale, la plus grande). */
function DashboardCard() {
  const bars = [42, 68, 55, 88, 73, 96];
  return (
    <div className={`${CARD} w-full`}>
      <div className="flex items-center justify-between bg-gradient-da px-4 py-2.5">
        <span className="text-[0.78rem] font-semibold text-white">Ma progression</span>
        <TrendingUp size={15} className="text-white" />
      </div>
      <div className="space-y-2.5 p-3.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-[0.68rem]">
            <span className="text-text-secondary">Parcours Data Analyst</span>
            <span className="font-bold text-brand-blue-royal">72%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy/[0.07]">
            <span className="block h-full w-[72%] rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan" />
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-brand-violet/30 to-brand-cyan"
              style={{ height: `${(h / 100) * 36 + 8}px` }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-navy/[0.06] pt-2">
          <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-warning">
            <Flame size={12} className="fill-warning" /> 12 j
          </span>
          <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-navy">
            <Sparkles size={12} className="text-brand-blue-royal" /> 2 450 XP
          </span>
        </div>
      </div>
    </div>
  );
}

/** 5 · Certificat obtenu. */
function CertificateCard({ path }: { path?: HeroPath }) {
  const title = path?.certificationTitle ?? path?.title ?? "Analyste de données";
  return (
    <div className={`${CARD} w-full`}>
      <div className="flex items-center gap-2 bg-gradient-da px-3.5 py-2.5">
        <Award size={15} className="text-white" />
        <span className="text-[0.72rem] font-semibold text-white">Certificat</span>
      </div>
      <div className="space-y-2 p-3.5">
        <p className="line-clamp-2 text-[0.76rem] font-bold leading-snug text-navy">{title}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[0.6rem] font-semibold text-success">
          <BadgeCheck size={11} /> Vérifiable
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.6rem] text-text-secondary">DA-CERT-4F9K2</span>
          <span className="grid shrink-0 grid-cols-4 gap-0.5 rounded bg-navy/[0.04] p-1" aria-hidden>
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={`h-1 w-1 rounded-[1px] ${[0, 1, 2, 4, 6, 8, 9, 11, 13, 14, 15].includes(i) ? "bg-navy" : "bg-transparent"}`}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 6 · Heures de formation. */
function HoursCard() {
  return (
    <div className={`${CARD} w-full p-3.5`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-blue-vif/10 text-brand-blue-royal">
        <Clock size={16} />
      </span>
      <p className="mt-2 font-display text-2xl font-extrabold leading-none">
        <span className="text-gradient-da">1 200 h</span>
      </p>
      <p className="mt-1 text-[0.66rem] text-text-secondary">de formation suivie</p>
      <div className="mt-2 inline-flex items-center gap-1 text-[0.62rem] font-semibold text-success">
        <TrendingUp size={11} /> +18% ce mois
      </div>
    </div>
  );
}

/** 7 · Communauté d'étudiants. */
function CommunityCard() {
  const members = ["Yao D", "Awa K", "Moussa B", "Sarah F"];
  return (
    <div className={`${CARD} w-full p-3.5`}>
      <div className="mb-2 flex items-center gap-1.5">
        <Users size={14} className="text-brand-blue-royal" />
        <span className="text-[0.74rem] font-bold text-navy">Communauté</span>
      </div>
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {members.map((m) => (
            <span key={m} className="rounded-full ring-2 ring-white">
              <Avatar seed={m} size={26} />
            </span>
          ))}
        </div>
        <span className="ml-2 grid h-[26px] w-[26px] place-items-center rounded-full bg-navy/[0.06] text-[0.56rem] font-bold text-navy">
          +2k
        </span>
      </div>
      <p className="mt-2 text-[0.64rem] text-text-secondary">
        <span className="font-semibold text-navy">2 000+</span> apprenants actifs
      </p>
    </div>
  );
}

/** 8 · Jauge de réussite (tableau de bord pédagogique). */
function GaugeCard() {
  const pct = 94;
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <div className={`${CARD} w-full p-3.5`}>
      <div className="flex items-center gap-3">
        <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden>
          <defs>
            <linearGradient id="da-gauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5b3fa8" />
              <stop offset="100%" stopColor="#00bcd4" />
            </linearGradient>
          </defs>
          <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(27,26,46,0.08)" strokeWidth="6" />
          <circle
            cx="27"
            cy="27"
            r={r}
            fill="none"
            stroke="url(#da-gauge)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            transform="rotate(-90 27 27)"
          />
        </svg>
        <div>
          <p className="font-display text-lg font-extrabold leading-none text-navy">{pct}%</p>
          <p className="text-[0.62rem] text-text-secondary">Taux de réussite</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Composition du hero ══════════════════════════ */

type Tier = "mobile" | "tablet" | "desktop";

const TIER_CFG: Record<Tier, { indices: number[]; step: number; raise: number }> = {
  desktop: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8], step: 128, raise: 7 },
  tablet: { indices: [2, 3, 4, 5, 6], step: 120, raise: 9 },
  mobile: { indices: [3, 4, 5], step: 78, raise: 11 },
};
const CENTER = 4;
const BASE_WIDTH = [152, 168, 176, 182, 214, 182, 176, 168, 152];
const FLOAT_CARDS = new Set([2, 4, 6]); // flottement subtil sur quelques cartes

export default function HeroSection({ courses, paths }: HeroSectionProps) {
  const reduce = useReducedMotion();
  const [tier, setTier] = React.useState<Tier>("desktop");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const mqD = window.matchMedia("(min-width: 1024px)");
    const mqT = window.matchMedia("(min-width: 640px)");
    const update = () => setTier(mqD.matches ? "desktop" : mqT.matches ? "tablet" : "mobile");
    update();
    mqD.addEventListener("change", update);
    mqT.addEventListener("change", update);
    return () => {
      mqD.removeEventListener("change", update);
      mqT.removeEventListener("change", update);
    };
  }, []);

  const c0 = courses[0];
  const p0 = paths[0];

  // Contenu des 9 cartes (ordre gauche → droite ; l'index 4 = centre).
  const CARD_NODES: React.ReactNode[] = [
    <BadgeCard key="badge" />,
    c0 ? <CoursePreviewCard key="course" course={c0} /> : <BadgeCard key="course-f" />,
    <LearnerProfileCard key="profile" />,
    <ProgressGraphCard key="graph" />,
    <DashboardCard key="dash" />,
    <CertificateCard key="cert" path={p0} />,
    <HoursCard key="hours" />,
    <CommunityCard key="community" />,
    <GaugeCard key="gauge" />,
  ];

  const cfg = TIER_CFG[tier];
  const shown = cfg.indices;
  const maxAd = Math.max(...shown.map((oi) => Math.abs(oi - CENTER)));

  const cardEntrance: Variants = {
    hidden: { opacity: 0, y: 52 },
    show: (p: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.35 + p * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <section className="relative isolate -mt-20 flex min-h-[760px] flex-col overflow-hidden lg:-mt-24 lg:min-h-[880px]">
      {/* ── Ciel bleu lumineux DA ── */}
      <div
        className="absolute inset-0 -z-30"
        style={{
          background:
            "linear-gradient(180deg,#1E63C6 0%,#2E86DE 26%,#3f9be6 48%,#74bff0 72%,#b6e0f6 90%,#e8f6fc 100%)",
        }}
        aria-hidden
      />
      {/* Lumière diffuse centrale */}
      <div
        className="pointer-events-none absolute left-1/2 top-[8%] -z-20 h-[520px] w-[760px] max-w-[95vw] -translate-x-1/2 rounded-full bg-white/30 blur-[130px]"
        aria-hidden
      />

      {/* ── Nuages blancs / bleutés en bas ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[52%] overflow-hidden" aria-hidden>
        <span className={`absolute bottom-16 left-[6%] h-40 w-80 rounded-full bg-white/70 blur-2xl ${reduce ? "" : "animate-float"}`} />
        <span className="absolute bottom-6 left-[24%] h-44 w-96 rounded-full bg-white/80 blur-2xl" />
        <span className="absolute bottom-20 left-1/2 h-48 w-[30rem] -translate-x-1/2 rounded-full bg-white/75 blur-2xl" />
        <span className={`absolute bottom-8 right-[20%] h-44 w-96 rounded-full bg-white/80 blur-2xl ${reduce ? "" : "animate-float"}`} />
        <span className="absolute bottom-14 right-[4%] h-40 w-80 rounded-full bg-white/70 blur-2xl" />
        <span className="absolute -bottom-2 left-[14%] h-24 w-72 rounded-full bg-brand-blue-vif/20 blur-3xl" />
        {/* Fondu vers la section suivante (blanche) */}
        <span className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/85 to-transparent" />
      </div>

      {/* ══ Contenu central (moitié haute) ══ */}
      <div className="relative z-20 mx-auto w-full max-w-[850px] px-5 pt-28 text-center sm:pt-32">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[2.7rem] font-extrabold leading-[1.04] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(12,30,70,0.35)] sm:text-6xl lg:text-[4.35rem]"
        >
          Apprenez, pratiquez,
          <br />
          devenez{" "}
          <GradientText
            className="[background-image:linear-gradient(120deg,#ffffff_0%,#bde6ff_45%,#00e5ff_100%)] drop-shadow-[0_2px_20px_rgba(0,200,255,0.4)]"
          >
            employable
          </GradientText>
          .
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg"
        >
          Formations concrètes, projets réels et certifications reconnues. Passez de la théorie à
          l&apos;employabilité avec Access Academy.
        </motion.p>

        {/* ── CTA ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/formations"
            className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-da pl-7 pr-2 font-semibold text-white shadow-[0_16px_40px_-12px_rgba(43,58,140,0.7)] outline-none transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-12px_rgba(0,188,212,0.7)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-vif active:translate-y-0 active:scale-[0.98] sm:w-auto"
          >
            Découvrir les formations
            <span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={17} aria-hidden />
            </span>
          </Link>
          <Link
            href="/inscription"
            className="inline-flex h-14 w-full items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 font-medium text-white outline-none backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-vif active:translate-y-0 active:scale-[0.98] sm:w-auto"
          >
            Créer un compte
          </Link>
        </motion.div>
      </div>

      {/* ══ Éventail de cartes (moitié basse, au-dessus des nuages) ══ */}
      <div className="relative z-10 mx-auto mt-12 w-full max-w-6xl flex-1 sm:mt-14" aria-hidden>
        <div className="relative mx-auto h-[240px] sm:h-[260px] lg:h-[300px]">
          {mounted &&
            shown.map((oi, p) => {
              const d = oi - CENTER;
              const ad = Math.abs(d);
              const x = d * cfg.step;
              const arcY = -(maxAd - ad) * cfg.raise;
              const rotate = d * 3.2;
              const scale = 1 - ad * 0.05;
              const opacity = 1 - ad * 0.1;
              const blur = ad >= 3 ? (ad - 2) * 1 : 0;
              const width = BASE_WIDTH[oi];
              return (
                <motion.div
                  key={oi}
                  className="absolute bottom-0 left-1/2 will-change-transform"
                  style={{ zIndex: 60 - ad * 8, x: x - width / 2, width }}
                  custom={p}
                  variants={cardEntrance}
                  initial={reduce ? false : "hidden"}
                  animate="show"
                >
                  {/* rotation + échelle + profondeur (repos) */}
                  <motion.div
                    style={{ rotate, opacity, filter: blur ? `blur(${blur}px)` : undefined }}
                    initial={false}
                    whileHover={
                      reduce
                        ? undefined
                        : { scale: scale * 1.07, rotate: 0, opacity: 1, y: -14, zIndex: 70, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 22 } }
                    }
                    animate={{ scale }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* flottement subtil + décalage d'arc */}
                    <motion.div
                      animate={
                        reduce || !FLOAT_CARDS.has(oi)
                          ? { y: arcY }
                          : { y: [arcY, arcY - 9, arcY] }
                      }
                      transition={
                        reduce || !FLOAT_CARDS.has(oi)
                          ? { duration: 0 }
                          : { duration: 6 + p * 0.6, repeat: Infinity, ease: "easeInOut", delay: p * 0.25 }
                      }
                    >
                      {CARD_NODES[oi]}
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
        </div>
      </div>

      {/* ══ Indicateur de confiance (devant les nuages) ══ */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="relative z-30 mx-auto mb-10 mt-6 flex flex-col items-center gap-1.5 px-5 text-center"
      >
        <span className="inline-flex items-center gap-1" aria-label="Noté 5 étoiles sur 5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={15} className="fill-brand-cyan text-brand-cyan drop-shadow-[0_1px_4px_rgba(0,188,212,0.5)]" />
          ))}
        </span>
        <p className="text-sm font-medium text-navy/70">
          Déjà adopté par plus de{" "}
          <span className="font-bold text-navy">2 000 apprenants</span>
        </p>
      </motion.div>
    </section>
  );
}
