import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FolderKanban, BookOpen, GraduationCap } from "lucide-react";
import { Section, Container, GradientText, Reveal, StaggerGroup, StaggerItem, buttonClasses, cn } from "@da/ui";
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
      {/* ── Hero coloré par l'école ── */}
      <section
        className="relative isolate overflow-hidden pt-20 text-white sm:pt-24"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}d9 45%, #14142A)` }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.1]" />
        </div>
        <Container className="relative pb-14">
          <Link href="/schools" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-white">
            <ArrowLeft size={16} /> Toutes les écoles
          </Link>
          <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-start">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/15 text-white shadow-lg backdrop-blur">
              <Icon name={school.icon ?? "graduation-cap"} size={38} />
            </span>
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">École Digital Access Academy</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                {school.name}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/80">{school.shortDescription}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
                  <FolderKanban size={16} /> {school.careerPathCount} parcours métiers
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
                  <BookOpen size={16} /> {school.shortCourseCount} formations courtes
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Présentation ── */}
      {school.longDescription && (
        <Section>
          <Container size="lg">
            <Reveal>
              <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-navy/80">{school.longDescription}</p>
            </Reveal>
          </Container>
        </Section>
      )}

      {/* ── Parcours métiers ── */}
      {school.careerPaths.length > 0 && (
        <Section tone="muted">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-bold text-navy">Parcours <GradientText>métiers</GradientText></h2>
              <Link href="/career-paths" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet">
                Tous les parcours <ArrowRight size={15} />
              </Link>
            </div>
            <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {school.careerPaths.map((p) => (
                <StaggerItem key={p.id}><CareerPathCardView path={p} /></StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      {/* ── Formations courtes ── */}
      {school.shortCourses.length > 0 && (
        <Section>
          <Container>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-bold text-navy">Formations courtes</h2>
              <Link href="/short-courses" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet">
                Toutes les formations <ArrowRight size={15} />
              </Link>
            </div>
            <StaggerGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {school.shortCourses.map((c) => (
                <StaggerItem key={c.id}><ShortCourseCardView course={c} /></StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      {/* ── CTA ── */}
      <Section tone="muted">
        <Container size="lg">
          <div
            className="relative overflow-hidden rounded-3xl px-7 py-12 text-center text-white"
            style={{ background: `linear-gradient(135deg, ${color}, #14142A)` }}
          >
            <div aria-hidden className="absolute inset-0 bg-grid opacity-[0.1]" />
            <div className="relative">
              <GraduationCap size={32} className="mx-auto text-white/90" />
              <h2 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">Formez-vous dans cette école</h2>
              <p className="mx-auto mt-3 max-w-lg text-white/75">Choisissez un parcours métier ou une formation courte, et commencez à produire dès aujourd'hui.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/career-paths" className={buttonClasses({ variant: "primary", size: "lg" })}>
                  Explorer les parcours <ArrowRight size={17} />
                </Link>
                <Link href="/auth/register" className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/25 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10">
                  Créer un compte
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
