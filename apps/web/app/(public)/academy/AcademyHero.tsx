"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, PlayCircle, Award, Users } from "lucide-react";
import { Container, buttonClasses, cn, Monogram, GradientText } from "@da/ui";
import { siteConfig } from "@/lib/site";

const floatingStats = [
  { value: "40+", label: "formations" },
  { value: "1200+", label: "apprenants" },
  { value: "98%", label: "réussite" },
];

const heroHighlights = [
  { icon: PlayCircle, label: "Cours vidéo & interactifs" },
  { icon: Award, label: "Certificats vérifiables" },
  { icon: Users, label: "Communauté active" },
];

/** Hero dédié Access Academy : composition sombre, décor animé, double CTA. */
export function AcademyHero() {
  return (
    <section className="relative isolate overflow-hidden bg-surface-dark pb-20 pt-28 sm:pt-32">
      {/* Décor animé — jamais un fond plat */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-da opacity-[0.12]" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <motion.div
          className="absolute -left-24 top-[-12%] h-[34rem] w-[34rem] rounded-full bg-accent/25 blur-[130px]"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-12%] top-[4%] h-[30rem] w-[30rem] rounded-full bg-brand-cyan/25 blur-[130px]"
          animate={{ x: [0, -34, 0], y: [0, 40, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[-24%] left-1/3 h-[28rem] w-[28rem] rounded-full bg-brand-blue-vif/20 blur-[120px]"
          animate={{ x: [0, 24, 0], y: [0, -30, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface-dark to-transparent" />
      </div>

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Colonne texte */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan backdrop-blur"
            >
              <GraduationCap size={15} />
              Access Academy
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Formez-vous aux métiers du{" "}
              <GradientText>numérique</GradientText>, à votre rythme
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-white/70"
            >
              La plateforme e-learning de Digital Access vous ouvre les portes du
              développement web, du design, du marketing et de la data. Des cours
              conçus en Côte d'Ivoire, accessibles sur mobile, avec certification à
              la clé.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <a
                href={siteConfig.academyUrl}
                className={buttonClasses({ variant: "primary", size: "lg" })}
              >
                Explorer le catalogue
                <ArrowRight size={18} />
              </a>
              <a
                href={`${siteConfig.academyUrl}/auth/register`}
                className={cn(
                  buttonClasses({ variant: "outline", size: "lg" }),
                  "border-white/25 text-white hover:bg-white/10",
                )}
              >
                Créer un compte
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-9 flex flex-wrap gap-x-6 gap-y-3"
            >
              {heroHighlights.map(({ icon: HlIcon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 text-sm font-medium text-white/80"
                >
                  <HlIcon size={17} className="text-brand-cyan" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Colonne visuelle : mortarboard flottant + pastilles de stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden aspect-square w-full max-w-md lg:block"
          >
            <div aria-hidden className="absolute inset-6 rounded-[2.5rem] bg-gradient-da opacity-30 blur-2xl" />
            <motion.div
              animate={{ y: [0, -16, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-10 grid place-items-center rounded-[2.5rem] bg-gradient-da shadow-brand-lg"
            >
              <div aria-hidden className="absolute inset-0 rounded-[2.5rem] bg-dots opacity-20" />
              <Monogram
                variant="white"
                size={120}
                className="absolute -bottom-4 -right-2 opacity-15"
              />
              <GraduationCap size={130} className="relative text-white" strokeWidth={1.4} />
            </motion.div>

            {floatingStats.map((s, i) => (
              <motion.div
                key={s.label}
                animate={{ y: [0, i % 2 === 0 ? 12 : -12, 0] }}
                transition={{
                  duration: 6 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
                className={cn(
                  "absolute rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur",
                  i === 0 && "right-0 top-8",
                  i === 1 && "-bottom-1 left-2",
                  i === 2 && "left-1/2 top-0 -translate-x-1/2",
                )}
              >
                <p className="font-display text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
