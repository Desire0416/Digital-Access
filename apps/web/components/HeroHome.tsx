"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Globe,
  Store,
  GraduationCap,
  Building2,
  MonitorPlay,
  PlayCircle,
} from "lucide-react";
import { Container, cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   HERO accueil (apps/web) — composition « agence » : photo de fond (bureau
   Digital Access, sujet à droite), voile dégradé signature à gauche pour la
   lisibilité, titre + CTA à gauche, et une rangée de cartes services qui
   déborde sur une bande claire, façon vitrine d'agence. Identité 100 % DA.
   ══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const;

const SERVICES = [
  { icon: Globe, name: "Présence Web", href: "/services#presence-web" },
  { icon: Store, name: "Établissement Visible", href: "/services#etablissement-visible" },
  { icon: GraduationCap, name: "Établissement Scolaire", href: "/services#etablissement-scolaire" },
  { icon: Building2, name: "Institution Premium", href: "/services#institution-premium" },
  { icon: MonitorPlay, name: "E-Learning", href: "/services#elearning" },
] as const;

const CLIENTS = ["/ENS.png", "/ephrata.png", "/LSY.png", "/oijd.png", "/Yehli.png"] as const;

export function HeroHome() {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <section className="relative -mt-18">
      {/* ─── Bloc sombre : photo + voile dégradé + contenu (passe sous le header) ─── */}
      <div className="relative isolate overflow-hidden bg-navy text-white">
        <Image
          src="/hero-web.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[72%_center] lg:object-right"
        />
        {/* Voile dégradé DA diagonal — fort à gauche (texte), transparent à droite (sujet) */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            background:
              "linear-gradient(102deg, rgba(20,20,40,0.96) 0%, rgba(37,52,130,0.92) 32%, rgba(30,143,225,0.55) 56%, rgba(0,188,212,0.14) 76%, rgba(0,188,212,0) 100%)",
          }}
          aria-hidden
        />
        {/* Mobile : assombrissement global pour garder le texte lisible */}
        <div className="absolute inset-0 -z-20 bg-navy/45 lg:bg-transparent" aria-hidden />
        <span
          className="pointer-events-none absolute -left-32 top-0 -z-10 h-96 w-96 rounded-full bg-brand-violet/30 blur-[120px]"
          aria-hidden
        />

        <Container className="relative">
          <div className="grid items-center gap-8 pb-36 pt-28 sm:pt-32 lg:min-h-[620px] lg:grid-cols-2 lg:pb-44 lg:pt-36">
            <div className="max-w-xl">
              <motion.span
                {...fade(0)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
              >
                <MapPin size={15} className="text-brand-cyan" aria-hidden />
                Votre agence digitale à Abidjan
              </motion.span>

              <motion.h1
                {...fade(0.08)}
                className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.9rem]"
              >
                Voyez grand.
                <br />
                Le numérique,{" "}
                <span className="bg-gradient-to-r from-white via-[#bfe8ff] to-brand-cyan bg-clip-text text-transparent">
                  on le rend possible.
                </span>
              </motion.h1>

              <motion.p
                {...fade(0.16)}
                className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg"
              >
                Sites web, plateformes e-learning et solutions sur-mesure. Nous plaçons votre
                organisation au cœur du numérique ivoirien pour faire avancer vos ambitions.
              </motion.p>

              <motion.div {...fade(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/devis"
                  className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-gradient-da pl-7 pr-2 font-semibold text-white shadow-[0_16px_40px_-12px_rgba(0,188,212,0.55)] outline-none transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy active:translate-y-0 active:scale-[0.98]"
                >
                  Demander un devis
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight size={17} aria-hidden />
                  </span>
                </Link>
                <Link
                  href="/portfolio"
                  className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/[0.06] px-6 font-medium text-white outline-none backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/[0.14] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy active:translate-y-0 active:scale-[0.98]"
                >
                  <PlayCircle size={20} className="text-brand-cyan" aria-hidden />
                  Voir nos réalisations
                </Link>
              </motion.div>
            </div>

            {/* Colonne droite : le sujet vit dans la photo de fond */}
            <div aria-hidden className="hidden lg:block" />
          </div>
        </Container>
      </div>

      {/* ─── Bande claire : cartes services (débordent) + confiance ─── */}
      <div className="bg-surface-secondary">
        <Container>
          <motion.div
            {...fade(0.32)}
            className="relative z-10 -mt-24 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:-mt-28 lg:grid-cols-5"
          >
            {SERVICES.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-navy/[0.06] bg-white p-5 text-center shadow-[0_20px_50px_-20px_rgba(27,42,90,0.4)] outline-none transition-all hover:-translate-y-1 hover:shadow-brand-lg focus-visible:ring-2 focus-visible:ring-brand-blue-vif"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand transition-transform group-hover:scale-105">
                  <s.icon size={26} aria-hidden />
                </span>
                <span className="text-sm font-bold leading-snug text-navy group-hover:text-brand-blue-royal">
                  {s.name}
                </span>
              </Link>
            ))}
          </motion.div>

          {/* Bande de confiance */}
          <div className="flex flex-col items-center gap-5 py-9 sm:flex-row sm:justify-between">
            <p className="shrink-0 text-sm font-semibold text-navy">
              Ils nous font confiance ·{" "}
              <span className="text-gradient-da">+35 clients satisfaits</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:justify-end">
              {CLIENTS.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden
                  className="h-8 w-auto opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                />
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

export default HeroHome;
