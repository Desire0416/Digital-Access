import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, GraduationCap } from "lucide-react";
import { Section, Container, Badge, GradientText, buttonClasses, formatFCFA } from "@da/ui";
import { getShortCourse } from "@/lib/queries";
import { LEVEL_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getShortCourse(slug);
  if (!c) return { title: "Formation introuvable" };
  return { title: `${c.title} — Digital Access Academy`, description: c.shortDescription };
}

export default async function ShortCourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getShortCourse(slug);
  if (!c) notFound();

  return (
    <Section className="pt-20 sm:pt-24">
      <Container size="lg">
        <Link href="/short-courses" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal">
          <ArrowLeft size={16} /> Toutes les formations courtes
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant="soft">{c.schoolName}</Badge>
          <span className="rounded-full bg-navy/[0.05] px-3 py-1 text-xs font-semibold text-text-secondary">{LEVEL_LABEL[c.level]}</span>
          {c.courseType && <span className="rounded-full bg-navy/[0.05] px-3 py-1 text-xs font-semibold text-text-secondary">{c.courseType}</span>}
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl">{c.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-secondary">{c.shortDescription}</p>

        {c.longDescription && (
          <p className="mt-6 max-w-2xl whitespace-pre-line leading-relaxed text-navy/80">{c.longDescription}</p>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6">
            {c.objectives.length > 0 && (
              <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
                <h2 className="font-display text-lg font-bold text-navy">Objectifs</h2>
                <ul className="mt-4 space-y-2.5">
                  {c.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-navy/80"><Check size={16} className="mt-0.5 text-success" />{o}</li>
                  ))}
                </ul>
              </div>
            )}
            {c.prerequisites.length > 0 && (
              <div className="rounded-2xl border border-navy/[0.07] bg-surface-secondary/40 p-6">
                <h2 className="font-display text-lg font-bold text-navy">Prérequis</h2>
                <ul className="mt-4 space-y-2 text-sm text-navy/80">
                  {c.prerequisites.map((p, i) => <li key={i} className="flex items-start gap-2"><Check size={15} className="mt-0.5 text-brand-blue-royal" />{p}</li>)}
                </ul>
              </div>
            )}
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 text-center">
              <p className="font-display text-3xl font-extrabold text-navy">{c.price <= 0 ? "Gratuit" : formatFCFA(c.price)}</p>
              {c.duration && <p className="mt-1 text-sm text-text-muted">Durée : {c.duration}</p>}
              <Link href="/auth/register" className={cnBtn()}>
                <GraduationCap size={17} /> Commencer
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

function cnBtn() {
  return `${buttonClasses({ variant: "primary", size: "md" })} mt-5 w-full`;
}
