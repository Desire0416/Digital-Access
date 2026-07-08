import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Check, Clock, BookOpen, FolderKanban, Wrench,
  Target, Building2, BadgeCheck, PlayCircle, FileText, ListChecks,
} from "lucide-react";
import { Section, Container, GradientText, Badge, Reveal } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getCareerPath } from "@/lib/queries";
import { getPathEnrollmentState } from "@/lib/learn-queries";
import { LEVEL_LABEL } from "@/lib/types";
import { EnrollCTA } from "@/components/EnrollCTA";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getCareerPath(slug);
  if (!p) return { title: "Parcours introuvable" };
  return { title: `${p.title} — Digital Access Academy`, description: p.shortDescription };
}

const lessonIcon: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle, TEXT: FileText, EXERCISE: ListChecks, QUIZ: ListChecks, RESOURCE: FileText,
};

export default async function CareerPathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await currentUser();
  const [p, enr] = await Promise.all([getCareerPath(slug), getPathEnrollmentState(slug, user?.id)]);
  if (!p) notFound();
  const lessonCount = p.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy pt-20 text-white sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-da opacity-30 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
        </div>
        <Container className="relative pb-14">
          <Link href="/career-paths" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
            <ArrowLeft size={16} /> Tous les parcours
          </Link>
          <div className="mt-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/90 text-navy">{p.schoolName}</Badge>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{LEVEL_LABEL[p.level]}</span>
            </div>
            <p className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-cyan">{p.targetJob}</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {p.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/75">{p.shortDescription}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/80">
              {p.duration && <span className="inline-flex items-center gap-2"><Clock size={16} className="text-white/60" />{p.duration}</span>}
              <span className="inline-flex items-center gap-2"><BookOpen size={16} className="text-white/60" />{p.modules.length} modules · {lessonCount} leçons</span>
              <span className="inline-flex items-center gap-2"><FolderKanban size={16} className="text-white/60" />{p.projects.length} projets</span>
            </div>
            <div className="mt-8">
              <EnrollCTA
                slug={slug}
                price={p.price}
                isAuthed={Boolean(user)}
                enrolled={enr.enrolled}
                status={enr.status}
                resumeLessonId={enr.resumeLessonId}
                firstLessonId={enr.firstLessonId}
                showPreview
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Ce que vous saurez faire */}
      {p.outcomes.length > 0 && (
        <Section>
          <Container size="lg">
            <h2 className="font-display text-2xl font-bold text-navy">Ce que vous saurez <GradientText>faire</GradientText></h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {p.outcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-navy/[0.06] bg-surface-secondary/40 p-4">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-da text-white"><Check size={14} /></span>
                  <span className="text-sm leading-relaxed text-navy/80">{o}</span>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* Programme */}
      {p.modules.length > 0 && (
        <Section tone="muted">
          <Container size="lg">
            <h2 className="font-display text-2xl font-bold text-navy">Programme détaillé</h2>
            <div className="mt-8 flex flex-col gap-4">
              {p.modules.map((m, i) => (
                <Reveal key={m.id} className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
                  <div className="flex items-center gap-4 border-b border-navy/[0.06] p-5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-da font-display text-sm font-bold text-white">{i + 1}</span>
                    <div>
                      <h3 className="font-display text-base font-bold text-navy">{m.title}</h3>
                      {m.description && <p className="mt-0.5 text-sm text-text-secondary">{m.description}</p>}
                    </div>
                  </div>
                  <ul className="divide-y divide-navy/[0.05]">
                    {m.lessons.map((l) => {
                      const LI = lessonIcon[l.lessonType] ?? FileText;
                      return (
                        <li key={l.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                          <LI size={16} className="shrink-0 text-brand-blue-royal" />
                          <span className="flex-1 text-navy/80">{l.title}</span>
                          {l.estimatedDuration && <span className="text-xs text-text-muted">{l.estimatedDuration} min</span>}
                        </li>
                      );
                    })}
                  </ul>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Projets */}
      {p.projects.length > 0 && (
        <Section>
          <Container size="lg">
            <h2 className="font-display text-2xl font-bold text-navy">Projets <GradientText>professionnels</GradientText></h2>
            <p className="mt-2 text-text-secondary">Vous prouvez vos compétences en produisant des livrables concrets pour votre portfolio.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {p.projects.map((pr) => (
                <div key={pr.id} className="flex items-start gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet"><FolderKanban size={18} /></span>
                  <div>
                    <p className="font-semibold text-navy">{pr.title}</p>
                    <span className="mt-1 inline-block rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                      {pr.projectType === "FINAL_PROJECT" ? "Projet final" : pr.projectType === "PROFESSIONAL_MISSION" ? "Mission pro" : "Mini-projet"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Compétences + outils + certificat */}
      <Section tone="muted">
        <Container size="lg">
          <div className="grid gap-6 lg:grid-cols-3">
            {p.skills.length > 0 && (
              <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy"><Target size={18} className="text-brand-blue-royal" /> Compétences visées</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.skills.map((s) => <Badge key={s.slug} variant="soft">{s.name}</Badge>)}
                </div>
              </div>
            )}
            {p.tools.length > 0 && (
              <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy"><Wrench size={18} className="text-brand-blue-royal" /> Outils utilisés</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tools.map((t) => <span key={t} className="rounded-md bg-navy/[0.05] px-2.5 py-1 text-xs font-medium text-text-secondary">{t}</span>)}
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-brand-violet/20 bg-brand-violet/[0.04] p-6">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy"><BadgeCheck size={18} className="text-brand-violet" /> À la clé</h3>
              <ul className="mt-4 space-y-2 text-sm text-navy/80">
                <li className="flex items-center gap-2"><Check size={15} className="text-success" /> {p.certificateTitle ?? "Certificat de parcours vérifiable"}</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-success" /> Badges de compétences par preuve</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-success" /> Un portfolio de projets professionnels</li>
              </ul>
            </div>
          </div>

          {/* À qui s'adresse / prérequis */}
          {p.prerequisites.length > 0 && (
            <div className="mt-6 rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy"><Building2 size={18} className="text-brand-blue-royal" /> Prérequis</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {p.prerequisites.map((pr, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-navy/80"><Check size={15} className="mt-0.5 text-brand-blue-royal" />{pr}</li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container size="lg">
          <div className="rounded-3xl bg-navy px-7 py-12 text-center text-white">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Lancez-vous dans le parcours <GradientText>{p.title}</GradientText></h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <EnrollCTA
                slug={slug}
                price={p.price}
                isAuthed={Boolean(user)}
                enrolled={enr.enrolled}
                status={enr.status}
                resumeLessonId={enr.resumeLessonId}
                firstLessonId={enr.firstLessonId}
              />
              <Link href={`/schools/${p.schoolSlug}`} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10">
                Voir l'école
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
