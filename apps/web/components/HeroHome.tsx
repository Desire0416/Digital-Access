"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Check, ShieldCheck, Award, MapPin, ArrowRight } from "lucide-react";
import { Container, Monogram, StarRating, AnimatedCounter, buttonClasses, cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Hero « L'Établi & l'Académie » — le plan de travail Digital Access.
   Un grand cadre (sous-main) encadre un collage skeuomorphe divisé en deux
   territoires reliés par un hub monogramme central : à gauche le pôle Agence
   (Access Web Solutions), à droite le pôle Academy. Chaque carte porte du
   contenu RÉEL DA. Le dégradé signature reste un ACCENT (badge, CTA, barres,
   sceau) — jamais un aplat de fond (anti-cliché « design IA »).
   Desktop = collage complet ; mobile = flux centré + une seule carte de preuve.
   ══════════════════════════════════════════════════════════════════════════ */

const EASE: number[] = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Punaise rouge skeuomorphe (réutilisée sur la carte site et le post-it). */
function RedPin() {
  return (
    <span
      aria-hidden
      className="absolute -top-2 left-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
      style={{
        background:
          "radial-gradient(circle at 35% 30%, #f87171 0%, #dc2626 45%, #991b1b 100%)",
      }}
    >
      <span className="absolute left-1 top-0.5 h-1 w-1 rounded-full bg-white/70" />
    </span>
  );
}

/** Petite carte de collage : entrée animée + flottement optionnel. */
function Floater({
  children,
  className,
  delay = 0,
  float = false,
  reduce,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  float?: boolean;
  reduce: boolean | null;
}) {
  return (
    <div className={cn("hidden xl:absolute xl:block", className)}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, delay }}
      >
        {float && !reduce ? (
          <motion.div
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </motion.div>
    </div>
  );
}

const cardHover =
  "transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-brand-lg";

export function HeroHome() {
  const reduce = useReducedMotion();
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <section className="bg-surface-secondary px-3 pb-6 pt-4 sm:px-4 sm:pt-6">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-navy/[0.08] bg-gradient-to-b from-white to-[#fafbff] p-6 shadow-brand-lg sm:p-10 lg:px-16 lg:py-14">
          {/* Dégradé SVG partagé (soulignement « grandir » + arc 98%) */}
          <svg aria-hidden width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="daHeroGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#5b3fa8" />
                <stop offset="1" stopColor="#00bcd4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Texture pointillée, estompée au centre pour préserver la lecture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-dots opacity-[0.45]"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 72% 62% at 50% 46%, transparent 16%, black 80%)",
              maskImage:
                "radial-gradient(ellipse 72% 62% at 50% 46%, transparent 16%, black 80%)",
            }}
          />

          {/* Vis décoratives aux 4 coins (métaphore établi) */}
          {["left-4 top-4", "right-4 top-4", "left-4 bottom-4", "right-4 bottom-4"].map((p) => (
            <span
              key={p}
              aria-hidden
              className={cn(
                "absolute hidden h-2 w-2 rounded-full bg-navy/[0.12] shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)] xl:block",
                p,
              )}
            />
          ))}

          {/* Étiquettes de pôle (coins hauts) */}
          <p className="absolute left-7 top-6 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary xl:block">
            Access Web Solutions
          </p>
          <p className="absolute right-7 top-6 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary xl:block">
            Access Academy
          </p>

          {/* Wrapper du collage */}
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center xl:min-h-[760px] xl:justify-center">
            {/* ── Bloc central ── */}
            <motion.div
              variants={stagger}
              initial={reduce ? false : "hidden"}
              animate="show"
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Eyebrow localisé */}
              <motion.span
                variants={rise}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-text-secondary shadow-sm"
              >
                <MapPin size={13} className="text-primary" />
                Cocody, Abidjan · Côte d'Ivoire
              </motion.span>

              {/* Hub monogramme central en relief */}
              <motion.div variants={rise} className="relative mt-6">
                {!reduce && (
                  <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-2xl bg-gradient-da opacity-40" />
                )}
                <div className="grid h-16 w-16 -rotate-3 place-items-center rounded-2xl border border-navy/[0.08] bg-white [box-shadow:inset_0_1px_0_rgba(255,255,255,0.9),0_22px_48px_-12px_rgba(43,58,140,0.42)] sm:h-[72px] sm:w-[72px]">
                  <Monogram variant="gradient" size={38} />
                </div>
              </motion.div>

              {/* Ligne de pôles (mobile uniquement) */}
              <motion.p
                variants={rise}
                className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary xl:hidden"
              >
                Access Web Solutions · Access Academy
              </motion.p>

              {/* Titre bichromie */}
              <motion.h1
                variants={rise}
                className="mt-5 max-w-2xl text-balance font-display font-extrabold leading-[1.07] tracking-tight"
                style={{ fontSize: "clamp(2rem, 4.6vw, 3.15rem)" }}
              >
                <span className="block text-navy">
                  Créer, former, faire{" "}
                  <span className="relative inline-block">
                    grandir
                    <svg
                      aria-hidden
                      viewBox="0 0 200 14"
                      preserveAspectRatio="none"
                      fill="none"
                      className="absolute -bottom-1.5 left-0 h-[0.42em] w-full"
                    >
                      <motion.path
                        d="M5 9 C 45 3, 120 3, 195 8"
                        stroke="url(#daHeroGrad)"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={reduce ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
                      />
                    </svg>
                  </span>
                </span>
                <span className="block text-text-secondary">votre présence numérique.</span>
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                variants={rise}
                className="mt-6 max-w-lg text-base leading-relaxed text-text-secondary sm:text-[1.05rem]"
              >
                <span className="font-semibold text-navy">Access Web Solutions</span> conçoit
                votre site et vos paiements Mobile Money.{" "}
                <span className="font-semibold text-navy">Access Academy</span> forme vos équipes
                avec des cours certifiants. Le numérique accessible, utile et stratégique.
              </motion.p>

              {/* CTA + lien secondaire */}
              <motion.div
                variants={rise}
                className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
              >
                <Link href="/devis" className={buttonClasses({ variant: "primary", size: "lg" })}>
                  Demander un devis
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/portfolio"
                  className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
                >
                  Voir nos réalisations
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            </motion.div>

            {/* ══ Pôle Agence (gauche) ══ */}

            {/* Carte « Site livré » — mini-navigateur */}
            <Floater
              reduce={reduce}
              float
              delay={0.3}
              className="xl:left-[0%] xl:top-[14%] xl:w-[242px] xl:rotate-[-4deg]"
            >
              <div className="relative">
                <RedPin />
                <div className={cn("overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-brand", cardHover)}>
                  <div className="flex items-center gap-2 border-b border-navy/[0.06] px-3 py-2.5">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-navy/15" />
                      <span className="h-2 w-2 rounded-full bg-navy/15" />
                      <span className="h-2 w-2 rounded-full bg-navy/15" />
                    </span>
                    <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-1 font-mono text-[11px] text-navy">
                      <Lock size={11} className="text-success" />
                      korastay.ci
                    </span>
                  </div>
                  <div className="relative h-[116px] w-full">
                    <Image
                      src="/Korastay.png"
                      alt="Site Korastay réalisé par Digital Access"
                      fill
                      sizes="264px"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-navy/15 to-transparent" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
                      <Check size={12} /> Livré en ~2 sem.
                    </span>
                    <span className="rounded-full bg-surface-secondary px-2 py-1 text-[11px] font-medium text-text-secondary">
                      SEO optimisé
                    </span>
                  </div>
                </div>
              </div>
            </Floater>

            {/* Post-it manuscrit épinglé (cluster haut-gauche) */}
            <Floater
              reduce={reduce}
              delay={0.55}
              className="z-30 xl:left-[11%] xl:top-[1%] xl:w-[144px] xl:rotate-[-8deg]"
            >
              <div className="relative">
                <RedPin />
                <div
                  className="rounded-md bg-[#fdf3d6] px-3.5 py-3.5 text-navy/85 shadow-[0_10px_22px_-8px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:rotate-1"
                  style={{ fontFamily: '"Segoe Script","Comic Sans MS",cursive' }}
                >
                  <p className="text-[14px] italic leading-snug">
                    « Livré vite, résultat top ! »
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <StarRating rating={5} size={12} />
                    <span className="text-[10px] not-italic text-navy/60">— Korastay</span>
                  </div>
                </div>
              </div>
            </Floater>

            {/* Carte « Paiement Mobile Money » */}
            <Floater
              reduce={reduce}
              delay={0.4}
              className="xl:bottom-[6%] xl:left-[0%] xl:w-[246px] xl:rotate-[3deg]"
            >
              <div className={cn("rounded-2xl border border-navy/[0.08] bg-white p-4 shadow-brand", cardHover)}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-navy">
                    <ShieldCheck size={15} className="text-primary" />
                    Paiement Mobile Money
                  </span>
                  {!reduce && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    { label: "Orange Money", dot: "#f59e0b" },
                    { label: "MTN MoMo", dot: "#f5c400" },
                    { label: "Wave", dot: "#1e8fe1" },
                  ].map((p) => (
                    <span
                      key={p.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-navy/[0.08] bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-navy"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: p.dot }} />
                      {p.label}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-navy/[0.06] pt-3">
                  <span className="font-display text-lg font-extrabold text-navy">150 000 FCFA</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
                    <Check size={12} /> Confirmé
                  </span>
                </div>
              </div>
            </Floater>

            {/* ══ Pôle Academy (droite) ══ */}

            {/* Carte « Cours certifiant » */}
            <Floater
              reduce={reduce}
              float
              delay={0.35}
              className="xl:right-[0%] xl:top-[6%] xl:w-[246px] xl:rotate-[4deg]"
            >
              <div className={cn("card-gradient-border overflow-hidden rounded-2xl bg-white shadow-brand", cardHover)}>
                <div className="relative h-[74px] w-full bg-gradient-da">
                  <div className="absolute inset-0 bg-grid opacity-30" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Développement Web
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm font-bold leading-snug text-navy">
                    Créer un site moderne avec Next.js
                  </h3>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-medium text-text-secondary">
                      <span>Progression</span>
                      <span className="font-bold text-navy">72%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: "72%" }}
                        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.6 }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StarRating rating={5} size={13} />
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-blue-royal">
                      <ShieldCheck size={12} className="text-brand-cyan" /> Certifiant
                    </span>
                  </div>
                </div>
              </div>
            </Floater>

            {/* Carte « Apprenants & certificat » */}
            <Floater
              reduce={reduce}
              float
              delay={0.48}
              className="z-10 xl:bottom-[7%] xl:right-[0%] xl:w-[230px] xl:rotate-[-3deg]"
            >
              <div className={cn("rounded-2xl border border-navy/[0.08] bg-white p-4 shadow-brand", cardHover)}>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2.5">
                    {[
                      "from-brand-violet to-brand-blue-royal",
                      "from-brand-blue-royal to-brand-cyan",
                      "from-accent to-brand-blue-vif",
                      "from-brand-blue-vif to-brand-cyan",
                    ].map((g, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-7 w-7 rounded-full border-2 border-white bg-gradient-to-br",
                          g,
                        )}
                      />
                    ))}
                    <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-surface-secondary text-[10px] font-bold text-navy">
                      +35
                    </span>
                  </div>
                  {/* Sceau certificat */}
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-da shadow-brand">
                    <Award size={20} className="text-white" />
                  </span>
                </div>
                <p className="mt-3 text-[13px] font-bold text-navy">
                  Parcours métiers certifiants
                </p>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  Certificat vérifiable par QR
                </p>
              </div>
            </Floater>

            {/* ══ Preuve transverse — réaffichée en flux sur mobile ══ */}
            <div className="relative mt-10 w-full max-w-md xl:absolute xl:bottom-[1%] xl:left-1/2 xl:mt-0 xl:w-[496px] xl:max-w-none xl:-translate-x-1/2">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-navy/[0.08] bg-white p-4 shadow-brand sm:flex-row sm:gap-5 sm:px-6"
              >
                {/* Anneau 98% */}
                <div className="flex shrink-0 items-center gap-3">
                  <div className="relative grid h-16 w-16 place-items-center">
                    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                      <circle cx="32" cy="32" r={R} fill="none" stroke="#e5e7eb" strokeWidth="6" />
                      <circle
                        cx="32"
                        cy="32"
                        r={R}
                        fill="none"
                        stroke="url(#daHeroGrad)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${0.98 * C} ${C}`}
                      />
                    </svg>
                    <AnimatedCounter
                      value={98}
                      suffix="%"
                      className="absolute font-display text-sm font-extrabold text-navy"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-navy">clients satisfaits</p>
                    <StarRating rating={5} size={13} />
                    <p className="mt-0.5 text-[11px] text-text-secondary">
                      <span className="font-semibold text-navy">35+ clients</span> nous font confiance
                    </p>
                  </div>
                </div>

                <span className="hidden h-12 w-px bg-navy/[0.08] sm:block" />

                {/* Logos clients réels */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {[
                    { src: "/ENS.png", alt: "Logo ENS" },
                    { src: "/ephrata.png", alt: "Logo Ephrata" },
                    { src: "/LSY.png", alt: "Logo LSY" },
                    { src: "/oijd.png", alt: "Logo OIJD" },
                    { src: "/Yehli.png", alt: "Logo Yehli" },
                  ].map((logo) => (
                    <Image
                      key={logo.src}
                      src={logo.src}
                      alt={logo.alt}
                      width={64}
                      height={26}
                      sizes="64px"
                      className="h-6 w-auto object-contain opacity-90 transition-[filter,opacity] duration-300 hover:opacity-100 xl:grayscale xl:hover:grayscale-0"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
