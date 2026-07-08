import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Section, Container, GradientText, Reveal, StaggerGroup, StaggerItem, buttonClasses } from "@da/ui";
import { getSchool } from "@/lib/queries";
import { Icon } from "@/components/Icon";
import { CareerPathCardView, ShortCourseCardView } from "@/components/cards";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSchool(slug);
  if (!s) return { title: "École introuvable" };
  return { title: `${s.name} — Digital Access Academy`, description: s.shortDescription };
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await getSchool(slug);
  if (!school) notFound();
  const color = school.color ?? "#2B5CC6";

  return (
    <>
      <section className="relative isolate overflow-hidden pt-20 sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full opacity-[0.12] blur-3xl" style={{ background: color }} />
          <div className="absolute inset-0 bg-grid opacity-40" />
        </div>
        <Container className="relative pb-4">
          <Link href="/schools" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal">
            <ArrowLeft size={16} /> Toutes les écoles
          </Link>
          <div className="mt-6 flex items-start gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white shadow-md" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
              <Icon name={school.icon ?? "graduation-cap"} size={32} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl">
                {school.name}
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-text-secondary">{school.shortDescription}</p>
            </div>
          </div>
        </Container>
      </section>

      {school.longDescription && (
        <Section className="pt-8">
          <Container size="lg">
            <Reveal>
              <p className="whitespace-pre-line text-lg leading-relaxed text-navy/80">{school.longDescription}</p>
            </Reveal>
          </Container>
        </Section>
      )}

      {school.careerPaths.length > 0 && (
        <Section tone="muted">
          <Container>
            <h2 className="font-display text-2xl font-bold text-navy">
              Parcours <GradientText>métiers</GradientText>
            </h2>
            <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {school.careerPaths.map((p) => (
                <StaggerItem key={p.id}><CareerPathCardView path={p} /></StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      {school.shortCourses.length > 0 && (
        <Section>
          <Container>
            <h2 className="font-display text-2xl font-bold text-navy">Formations courtes</h2>
            <StaggerGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {school.shortCourses.map((c) => (
                <StaggerItem key={c.id}><ShortCourseCardView course={c} /></StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      <Section tone="muted">
        <Container size="lg">
          <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-8 text-center">
            <p className="text-lg font-semibold text-navy">Prêt à vous former dans cette école ?</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/career-paths" className={buttonClasses({ variant: "primary", size: "md" })}>
                <Check size={16} /> Explorer les parcours
              </Link>
              <Link href="/auth/register" className={buttonClasses({ variant: "outline", size: "md" })}>
                Créer un compte
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
