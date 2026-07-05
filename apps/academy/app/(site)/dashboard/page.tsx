import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, Trophy } from "lucide-react";
import {
  Badge,
  Container,
  GradientText,
  Monogram,
  Reveal,
  Section,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  buttonClasses,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getCourses, getDashboard } from "@/lib/queries";
import type { DashboardData } from "@/lib/types";
import { CourseCard } from "@/components/CourseCard";
import { ResumeCard } from "./ResumeCard";
import { StatsRow } from "./StatsRow";
import { StreakWeek } from "./StreakWeek";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon dashboard",
  description:
    "Suivez vos formations en cours, votre progression, votre série d'apprentissage et vos XP sur Access Academy.",
  robots: { index: false, follow: false },
};

/* ────────────────────────────── Helpers ────────────────────────────────────── */

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || "vous";
}

/** Phrase de motivation adaptée à la situation de l'apprenant. */
function motivationFor(data: DashboardData): string {
  const { enrollments, stats, user } = data;
  if (enrollments.length === 0) {
    return "Votre parcours n'attend que vous : choisissez votre première formation et gagnez vos premiers XP dès aujourd'hui.";
  }
  if (stats.inProgress === 0 && stats.completed > 0) {
    return "Tous vos cours sont terminés — félicitations ! C'est le moment idéal pour relever un nouveau défi.";
  }
  const active = enrollments.filter((e) => !e.completedAt);
  const avg =
    active.length === 0
      ? 0
      : Math.round(active.reduce((sum, e) => sum + e.progress, 0) / active.length);
  if (avg >= 75) {
    return "Vous touchez au but : encore quelques chapitres et le certificat est à vous !";
  }
  if (user.streak >= 3) {
    return `${user.streak} jours d'affilée — votre régularité fait toute la différence. On continue ?`;
  }
  if (avg >= 40) {
    return "Belle progression ! Chaque chapitre complété vous rapproche un peu plus de votre certificat.";
  }
  return "Dix minutes suffisent pour avancer d'un chapitre — c'est le moment idéal pour vous y remettre.";
}

/** Mini en-tête de bloc (sur-titre à filet dégradé). */
function MiniHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
      <span aria-hidden className="h-px w-7 bg-gradient-da" />
      {children}
    </h2>
  );
}

/* ─────────────────────────────────── Page ──────────────────────────────────── */

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard");

  const data = await getDashboard(user.id);
  if (!data) redirect("/auth/login?callbackUrl=/dashboard");

  const firstName = firstNameOf(data.user.name);
  const motivation = motivationFor(data);
  const hasEnrollments = data.enrollments.length > 0;

  /* Reprise : première inscription non terminée (déjà triées par date desc). */
  const resume = data.enrollments.find((e) => !e.completedAt) ?? null;

  /* Suggestions : cours populaires auxquels l'apprenant n'est pas inscrit. */
  const enrolledIds = new Set(data.enrollments.map((e) => e.course.id));
  const popular = await getCourses({ sort: "popular" });
  const suggestions = popular.filter((c) => !enrolledIds.has(c.id)).slice(0, 3);

  const todayRaw = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const todayLabel = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);

  return (
    <>
      {/* ── En-tête : salutation + stats sur fond décoré ───────────────────── */}
      <div className="relative overflow-hidden border-b border-navy/[0.06] bg-surface-primary">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.16] blur-[110px]" />
          <div className="absolute -top-16 right-[-5%] h-72 w-72 rounded-full bg-brand-cyan/20 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-primary to-transparent" />
        </div>

        <Container className="relative py-12 sm:py-14">
          <Reveal y={16}>
            <p className="text-sm font-medium text-text-muted">{todayLabel}</p>
          </Reveal>
          <Reveal y={16} delay={0.06}>
            <h1 className="mt-2 font-display text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl">
              Bonjour <GradientText>{firstName}</GradientText>{" "}
              <span aria-hidden>👋</span>
            </h1>
          </Reveal>
          <Reveal y={16} delay={0.12}>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {motivation}
            </p>
          </Reveal>

          <div className="mt-10">
            <StatsRow
              streak={data.user.streak}
              xp={data.user.xp}
              inProgress={data.stats.inProgress}
              chaptersCompleted={data.stats.chaptersCompleted}
            />
          </div>
        </Container>
      </div>

      {/* ── Reprendre l'apprentissage + Ma série ───────────────────────────── */}
      <Section tone="muted" spacing="sm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {/* Colonne principale : reprise / félicitations / état vide */}
            <div className="flex flex-col lg:col-span-2">
              <MiniHeading>
                {resume
                  ? "Reprendre l'apprentissage"
                  : hasEnrollments
                    ? "Parcours accompli"
                    : "Premiers pas"}
              </MiniHeading>

              <div className="mt-5 flex-1">
                {resume ? (
                  <ResumeCard enrollment={resume} />
                ) : hasEnrollments ? (
                  /* Tous les cours terminés — carte de célébration */
                  <Reveal className="h-full">
                    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary px-8 py-14 text-center">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-da opacity-10 blur-3xl"
                      />
                      <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                        <Trophy size={30} aria-hidden />
                      </span>
                      <h3 className="mt-6 font-display text-2xl font-bold text-navy">
                        Tous vos cours sont terminés&nbsp;!
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                        Bravo pour ce parcours sans faute. De nouvelles
                        formations vous attendent pour continuer à faire grandir
                        vos compétences.
                      </p>
                      <Link
                        href="/courses"
                        className={buttonClasses({
                          variant: "primary",
                          size: "md",
                          className: "mt-6",
                        })}
                      >
                        <Compass size={17} aria-hidden />
                        Explorer le catalogue
                      </Link>
                    </div>
                  </Reveal>
                ) : (
                  /* État vide brandé — aucune inscription */
                  <Reveal className="h-full">
                    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-navy/15 bg-surface-primary px-8 py-14 text-center">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-da opacity-10 blur-3xl"
                      />
                      <div className="relative">
                        <span
                          aria-hidden
                          className="absolute inset-0 scale-150 rounded-full bg-gradient-da opacity-15 blur-2xl"
                        />
                        <Monogram size={72} className="relative" />
                      </div>
                      <h3 className="mt-6 font-display text-2xl font-bold text-navy">
                        Votre aventure commence ici
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                        Inscrivez-vous à votre première formation : vidéos,
                        quiz interactifs et certificat vérifiable vous
                        attendent — certains cours sont 100&nbsp;% gratuits.
                      </p>
                      <Link
                        href="/courses"
                        className={buttonClasses({
                          variant: "primary",
                          size: "md",
                          className: "mt-6",
                        })}
                      >
                        <Compass size={17} aria-hidden />
                        Explorer le catalogue
                      </Link>
                    </div>
                  </Reveal>
                )}
              </div>
            </div>

            {/* Colonne latérale : série d'apprentissage */}
            <div className="flex flex-col">
              <MiniHeading>Ma série d&apos;apprentissage</MiniHeading>
              <div className="mt-5 flex-1">
                <StreakWeek streak={data.user.streak} />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Mes cours ──────────────────────────────────────────────────────── */}
      {hasEnrollments && (
        <Section spacing="md">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                align="left"
                eyebrow="Mes cours"
                title={
                  <>
                    Toutes mes <GradientText>formations</GradientText>
                  </>
                }
                subtitle="Reprenez exactement là où vous vous êtes arrêté — votre progression est enregistrée chapitre par chapitre."
                className="max-w-xl"
              />
              <Reveal>
                <Badge variant="soft" className="px-3.5 py-1.5 text-sm">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
                  {data.enrollments.length} inscription
                  {data.enrollments.length > 1 ? "s" : ""}
                </Badge>
              </Reveal>
            </div>

            <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.enrollments.map((e, i) => (
                <StaggerItem key={e.course.id} className="h-full">
                  <CourseCard
                    course={e.course}
                    index={i}
                    progress={e.progress}
                    href={
                      e.nextChapterId
                        ? `/courses/${e.course.slug}/learn/${e.nextChapterId}`
                        : `/courses/${e.course.slug}`
                    }
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      {/* ── Suggestions : cours populaires non suivis ──────────────────────── */}
      {suggestions.length > 0 && (
        <Section tone={hasEnrollments ? "muted" : "default"} spacing="md">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                align="left"
                eyebrow="Suggestions"
                title={
                  hasEnrollments ? (
                    <>
                      Envie d&apos;aller <GradientText>plus loin</GradientText>
                      &nbsp;?
                    </>
                  ) : (
                    <>
                      Les formations <GradientText>populaires</GradientText>{" "}
                      pour démarrer
                    </>
                  )
                }
                subtitle="Les cours les plus suivis du moment par la communauté Access Academy."
                className="max-w-xl"
              />
              <Reveal>
                <Link
                  href="/courses"
                  className={buttonClasses({ variant: "ghost", size: "md" })}
                >
                  Tout le catalogue
                  <ArrowRight size={17} aria-hidden />
                </Link>
              </Reveal>
            </div>

            <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((course, i) => (
                <StaggerItem key={course.id} className="h-full">
                  <CourseCard course={course} index={i + 1} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}
    </>
  );
}
