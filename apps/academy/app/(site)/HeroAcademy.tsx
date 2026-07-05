"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  PlayCircle,
  Star,
  UserPlus,
} from "lucide-react";
import {
  Container,
  GradientText,
  Monogram,
  StarRating,
  buttonClasses,
  cn,
} from "@da/ui";
import { HeroBackground } from "@/components/HeroBackground";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const chips = [
  { icon: Award, label: "Certificat vérifiable", className: "-left-4 top-6", delay: 0 },
  { icon: Brain, label: "Quiz interactifs", className: "-right-3 top-28", delay: 0.5 },
  { icon: Flame, label: "Streak 7 jours 🔥", className: "-left-7 bottom-20", delay: 1 },
];

/** Hero Academy — message + carte de cours flottante animée (jamais un hero générique). */
export function HeroAcademy() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-28 sm:pt-32 lg:pb-28">
      <HeroBackground />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Colonne gauche — message */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
              Access Academy · E-learning
            </motion.span>

            <motion.h1
              variants={item}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]"
            >
              Apprenez les <GradientText>métiers du numérique</GradientText>, à
              votre rythme
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
            >
              Des formations 100&nbsp;% en ligne conçues par des mentors
              ivoiriens&nbsp;: vidéos, quiz interactifs, certificats
              vérifiables — et paiement Mobile Money (Orange, MTN, Wave).
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className={buttonClasses({ variant: "primary", size: "lg" })}
              >
                Explorer le catalogue
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth/register"
                className={buttonClasses({ variant: "outline", size: "lg" })}
              >
                <UserPlus size={18} />
                Créer un compte gratuit
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-10 flex items-center gap-5">
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
                      "inline-block h-10 w-10 rounded-full border-2 border-surface-primary bg-gradient-to-br",
                      g,
                    )}
                  />
                ))}
              </div>
              <div>
                <StarRating rating={5} size={15} />
                <p className="mt-0.5 text-sm text-text-secondary">
                  <span className="font-bold text-navy">2 500+ apprenants</span>{" "}
                  se forment déjà avec Academy
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Colonne droite — carte de cours flottante */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative mx-auto hidden aspect-square w-full max-w-md lg:block"
          >
            {/* Halo */}
            <div className="absolute inset-8 rounded-full bg-gradient-da opacity-20 blur-3xl" />

            {/* Carte de cours principale */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-x-4 top-12 rotate-[-3deg] overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-brand-lg"
            >
              {/* Couverture vidéo */}
              <div className="relative h-32 bg-gradient-da">
                <div className="absolute inset-0 bg-dots opacity-25" />
                <Monogram
                  variant="white"
                  size={88}
                  className="absolute -bottom-4 -right-3 opacity-15"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy backdrop-blur">
                  Développement Web
                </span>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/20 backdrop-blur">
                    <PlayCircle size={34} className="text-white" />
                  </span>
                </div>
              </div>

              {/* Corps */}
              <div className="p-5">
                <span className="text-xs font-semibold text-brand-blue-royal">
                  Débutant
                </span>
                <p className="mt-1 font-display text-base font-bold leading-snug text-navy">
                  Développement Web Moderne&nbsp;: votre premier site en ligne
                </p>
                <div className="mt-2.5 flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <BookOpen size={13} /> 12 chapitres
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> 8h30
                  </span>
                </div>

                {/* Progression */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">
                      Progression
                    </span>
                    <span className="font-bold text-navy">68 %</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy/[0.08]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "68%" }}
                      transition={{
                        type: "spring",
                        stiffness: 60,
                        damping: 20,
                        delay: 0.9,
                      }}
                      className="h-full rounded-full bg-gradient-da"
                    />
                  </div>
                </div>

                {/* Feedback quiz */}
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                  <CheckCircle2 size={15} />
                  Quiz réussi — +25 XP
                </div>
              </div>
            </motion.div>

            {/* Chips flottants */}
            {chips.map(({ icon: ChipIcon, label, className, delay }) => (
              <motion.div
                key={label}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
                className={cn(
                  "absolute z-10 inline-flex items-center gap-2 rounded-xl border border-navy/[0.06] bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-navy shadow-lg backdrop-blur",
                  className,
                )}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
                  <ChipIcon size={15} />
                </span>
                {label}
              </motion.div>
            ))}

            {/* Badge note flottant */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -bottom-1 right-2 z-10 inline-flex items-center gap-2 rounded-xl border border-navy/[0.06] bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur"
            >
              <Star size={18} className="fill-warning text-warning" />
              <span className="text-sm font-bold text-navy">
                4,8/5{" "}
                <span className="font-medium text-text-secondary">
                  · 320 avis
                </span>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
