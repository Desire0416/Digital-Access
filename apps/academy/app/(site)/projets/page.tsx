import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, FolderKanban, BadgeCheck } from "lucide-react";
import {
  Section,
  Container,
  GradientText,
  Reveal,
  StaggerGroup,
  StaggerItem,
  buttonClasses,
} from "@da/ui";
import { getPublicProjects } from "@/lib/queries";
import { ProjectCardView } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projets professionnels — Digital Access Academy",
  description:
    "Des projets et missions concrètes à réaliser pour prouver vos compétences, alimenter votre portfolio et décrocher un emploi. Explorez les projets de nos parcours métiers.",
  alternates: { canonical: "/projets" },
};

export default async function ProjectsPage() {
  const projects = await getPublicProjects();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-gradient-da opacity-[0.1] blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.5]" />
        </div>
        <Container className="relative py-14 text-center sm:py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-violet/20 bg-brand-violet/[0.06] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-violet">
              <Target size={15} />
              Apprendre en faisant
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl">
              Des projets qui <GradientText>prouvent vos compétences</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-secondary">
              Chaque parcours vous fait réaliser de vraies missions professionnelles. Vous les
              soumettez, elles sont évaluées, et les meilleures alimentent votre portfolio et vos badges.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Projets */}
      <Section>
        <Container>
          {projects.length > 0 ? (
            <>
              <div className="mb-8 flex items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">
                  {projects.length} projet{projects.length > 1 ? "s" : ""} à réaliser
                </span>
                <span className="h-px flex-1 bg-navy/[0.08]" />
              </div>
              <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <StaggerItem key={p.id}>
                    <ProjectCardView project={p} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </>
          ) : (
            <Reveal className="mx-auto max-w-xl rounded-3xl border border-navy/[0.08] bg-surface-secondary/40 px-8 py-14 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                <FolderKanban size={26} />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-navy">Les projets arrivent</h2>
              <p className="mt-3 text-text-secondary">
                Les projets sont intégrés à chaque parcours métier. Explorez les parcours pour découvrir
                les missions que vous réaliserez.
              </p>
              <Link href="/career-paths" className={buttonClasses({ variant: "primary", size: "lg" })}>
                Explorer les parcours
                <ArrowRight size={18} />
              </Link>
            </Reveal>
          )}
        </Container>
      </Section>

      {/* Valeur */}
      <Section tone="muted">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: FolderKanban, title: "Un portfolio concret", text: "Chaque projet validé rejoint votre portfolio — votre meilleure preuve de savoir-faire." },
              { icon: BadgeCheck, title: "Des badges par preuve", text: "Vos réalisations débloquent des badges de compétences vérifiables." },
              { icon: Target, title: "Des missions réelles", text: "Des sujets proches du terrain, pensés pour l'employabilité, pas des exercices théoriques." },
            ].map((c) => (
              <Reveal key={c.title} className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                  <c.icon size={22} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
