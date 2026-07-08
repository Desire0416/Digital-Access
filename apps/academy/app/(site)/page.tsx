import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Compass,
  Rocket,
  Target,
  FolderKanban,
  Award,
  Briefcase,
  BadgeCheck,
} from "lucide-react";
import {
  Section,
  Container,
  SectionHeading,
  GradientText,
  Reveal,
  StaggerGroup,
  StaggerItem,
  IconBadge,
  buttonClasses,
  cn,
} from "@da/ui";
import { getSchools, getFeaturedCareerPaths, getAcademyStats } from "@/lib/queries";
import { SchoolCardView, CareerPathCardView } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apprenez un métier du numérique — Digital Access Academy",
  description:
    "Parcours métiers, projets concrets, portfolio, badges et certificats vérifiables. L'académie numérique qui transforme vos compétences en opportunités professionnelles en Côte d'Ivoire.",
  alternates: { canonical: "/" },
};

const method = [
  { icon: Compass, title: "Choisir un parcours métier", text: "Un objectif professionnel clair : Assistant IA, Développeur Front-End, Community Manager…" },
  { icon: Target, title: "Apprendre en pratiquant", text: "Des modules courts, des exercices et des quiz orientés savoir-faire, pas seulement des vidéos." },
  { icon: FolderKanban, title: "Réaliser des projets", text: "Des missions professionnelles concrètes qui alimentent votre portfolio et prouvent vos compétences." },
  { icon: Award, title: "Certifier & valoriser", text: "Badges par preuve, certificats vérifiables par QR code, et accès à des opportunités." },
];

export default async function HomePage() {
  const [schools, featured, stats] = await Promise.all([
    getSchools(),
    getFeaturedCareerPaths(6),
    getAcademyStats(),
  ]);

  const statItems = [
    { value: stats.schools, label: "Écoles" },
    { value: stats.careerPaths, label: "Parcours métiers" },
    { value: stats.shortCourses, label: "Formations courtes" },
    { value: stats.projects, label: "Projets professionnels" },
  ].filter((s) => s.value > 0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gradient-da opacity-[0.12] blur-3xl" />
          <div className="absolute -left-40 top-40 h-[28rem] w-[28rem] rounded-full bg-brand-violet/10 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.5]" />
        </div>
        <Container className="relative pb-16 pt-20 sm:pt-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/[0.06] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-blue-royal">
              <GraduationCap size={15} />
              Académie numérique · Côte d'Ivoire
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Apprenez un métier. Réalisez des projets.{" "}
              <GradientText>Construisez votre avenir.</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
              Digital Access Academy vous forme aux compétences pratiques du numérique, de
              l'intelligence artificielle, du marketing, du design, de la data et de
              l'entrepreneuriat — à travers des parcours métiers, des projets concrets, des badges
              et des certificats vérifiables.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/career-paths" className={buttonClasses({ variant: "primary", size: "lg" })}>
                Explorer les parcours métiers
                <ArrowRight size={18} />
              </Link>
              <Link href="/schools" className={buttonClasses({ variant: "outline", size: "lg" })}>
                Découvrir les écoles
              </Link>
            </div>
          </Reveal>

          {statItems.length > 0 && (
            <Reveal delay={0.2}>
              <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {statItems.map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-3xl font-extrabold text-navy sm:text-4xl">
                      {s.value}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-text-secondary">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </Container>
      </section>

      {/* ── Écoles ── */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Nos écoles"
            title={<>Huit écoles, <GradientText>un objectif</GradientText> : l'employabilité</>}
            subtitle="Chaque école regroupe des parcours métiers et des formations courtes autour d'un grand domaine de compétences."
          />
          {schools.length > 0 ? (
            <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {schools.map((s) => (
                <StaggerItem key={s.id}>
                  <SchoolCardView school={s} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <p className="mt-12 text-center text-text-muted">Les écoles arrivent très bientôt.</p>
          )}
        </Container>
      </Section>

      {/* ── Parcours métiers vedettes ── */}
      {featured.length > 0 && (
        <Section>
          <Container>
            <SectionHeading
              eyebrow="Parcours métiers"
              title={<>Formez-vous à un <GradientText>métier recherché</GradientText></>}
              subtitle="Des parcours structurés qui vous mènent d'une ambition à un portfolio et un certificat."
            />
            <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <StaggerItem key={p.id}>
                  <CareerPathCardView path={p} />
                </StaggerItem>
              ))}
            </StaggerGroup>
            <div className="mt-12 text-center">
              <Link href="/career-paths" className={buttonClasses({ variant: "ghost", size: "md" })}>
                Voir tous les parcours
                <ArrowRight size={16} />
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* ── Méthode ── */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Notre méthode"
            title={<>Apprendre <GradientText>en faisant</GradientText></>}
            subtitle="Pas de compétence sans pratique. Pas de certification sans projet. Pas d'employabilité sans preuve."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {method.map((m, i) => (
              <StaggerItem
                key={m.title}
                className="relative rounded-2xl border border-navy/[0.07] bg-surface-primary p-6"
              >
                <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-navy/[0.06]">
                  0{i + 1}
                </span>
                <IconBadge tone="gradient">
                  <m.icon size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{m.text}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* ── Preuve & employabilité ── */}
      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: FolderKanban, title: "Un portfolio de projets", text: "Chaque projet validé enrichit votre portfolio professionnel — votre meilleure preuve de savoir-faire." },
              { icon: BadgeCheck, title: "Badges & certificats vérifiables", text: "Des badges par preuve et des certificats à QR code, vérifiables publiquement par un employeur." },
              { icon: Briefcase, title: "Un pont vers l'emploi", text: "Passeport de compétences, opportunités, missions freelance et mise en relation avec les entreprises." },
            ].map((c) => (
              <Reveal key={c.title} className="rounded-2xl border border-navy/[0.07] bg-surface-secondary/40 p-7">
                <IconBadge tone="gradient">
                  <c.icon size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── CTA ── */}
      <Section tone="muted">
        <Container size="lg">
          <div className="relative overflow-hidden rounded-3xl bg-navy px-7 py-14 text-center sm:px-12">
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-da opacity-30 blur-3xl" />
              <div className="absolute inset-0 bg-grid opacity-[0.08]" />
            </div>
            <div className="relative">
              <Rocket size={34} className="mx-auto text-brand-cyan" />
              <h2 className="mt-5 font-display text-3xl font-extrabold text-white sm:text-4xl">
                Prêt à construire des compétences <GradientText>visibles et utiles</GradientText> ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70">
                Créez votre compte gratuitement, choisissez votre parcours et commencez à produire dès aujourd'hui.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/register" className={cn(buttonClasses({ variant: "primary", size: "lg" }))}>
                  Créer un compte gratuit
                  <ArrowRight size={18} />
                </Link>
                <Link href="/career-paths" className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10">
                  Explorer les parcours
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
