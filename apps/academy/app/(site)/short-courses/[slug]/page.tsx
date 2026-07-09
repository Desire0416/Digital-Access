import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Clock, GraduationCap, Zap, ListChecks,
  School, BadgeCheck, Sparkles, PlayCircle,
} from "lucide-react";
import { Section, Container, Badge, GradientText, Reveal, buttonClasses, formatFCFA, cn } from "@da/ui";
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
  const free = c.price <= 0;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden bg-navy pt-20 text-white sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-gradient-da opacity-30 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/15 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
        </div>
        <Container className="relative pb-14">
          <Link href="/short-courses" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
            <ArrowLeft size={16} /> Toutes les formations courtes
          </Link>
          <div className="mt-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-cyan">
                <Zap size={13} /> Formation courte
              </span>
              <Link href={`/schools/${c.schoolSlug}`}>
                <Badge className="bg-white/90 text-navy transition-transform hover:scale-105">{c.schoolName}</Badge>
              </Link>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{LEVEL_LABEL[c.level]}</span>
              {c.courseType && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{c.courseType}</span>}
            </div>
            <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {c.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/75">{c.shortDescription}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/80">
              {c.duration && <span className="inline-flex items-center gap-2"><Clock size={16} className="text-white/60" />{c.duration}</span>}
              <span className="inline-flex items-center gap-2"><PlayCircle size={16} className="text-white/60" />À votre rythme</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck size={16} className="text-white/60" />Attestation à la clé</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Contenu + carte sticky ── */}
      <Section>
        <Container size="lg">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            {/* Colonne contenu */}
            <div className="flex flex-col gap-6">
              {c.longDescription && (
                <Reveal>
                  <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
                    <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
                      <Sparkles size={18} className="text-brand-violet" /> À propos de cette formation
                    </h2>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-navy/80">{c.longDescription}</p>
                  </div>
                </Reveal>
              )}

              {c.objectives.length > 0 && (
                <Reveal>
                  <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
                    <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
                      <ListChecks size={18} className="text-brand-blue-royal" /> Ce que vous saurez faire
                    </h2>
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {c.objectives.map((o, i) => (
                        <li key={i} className="flex items-start gap-2.5 rounded-xl border border-navy/[0.05] bg-surface-secondary/40 p-3.5 text-sm text-navy/80">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-da text-white"><Check size={12} /></span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {c.prerequisites.length > 0 && (
                <Reveal>
                  <div className="rounded-2xl border border-navy/[0.07] bg-surface-secondary/40 p-6 sm:p-7">
                    <h2 className="font-display text-lg font-bold text-navy">Prérequis</h2>
                    <ul className="mt-4 space-y-2.5 text-sm text-navy/80">
                      {c.prerequisites.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5"><Check size={16} className="mt-0.5 text-brand-blue-royal" />{p}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Carte sticky */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-sm">
                <div className="bg-gradient-da p-6 text-center text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Tarif</p>
                  <p className="mt-1 font-display text-4xl font-extrabold">{free ? "Gratuit" : formatFCFA(c.price)}</p>
                </div>
                <div className="p-6">
                  <dl className="space-y-3 text-sm">
                    <Row icon={<Clock size={16} />} label="Durée" value={c.duration ?? "Flexible"} />
                    <Row icon={<GraduationCap size={16} />} label="Niveau" value={LEVEL_LABEL[c.level]} />
                    <Row icon={<School size={16} />} label="École" value={c.schoolName} />
                  </dl>
                  <Link href="/auth/register" className={cn(buttonClasses({ variant: "primary", size: "lg" }), "mt-6 w-full")}>
                    <Zap size={17} /> {free ? "Commencer gratuitement" : "S'inscrire"}
                  </Link>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                    <BadgeCheck size={13} className="text-success" /> Accès immédiat · à votre rythme
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* ── CTA parcours ── */}
      <Section tone="muted">
        <Container size="lg">
          <div className="flex flex-col items-center justify-between gap-5 rounded-3xl bg-navy px-7 py-9 text-center text-white sm:flex-row sm:text-left">
            <div>
              <h2 className="font-display text-xl font-extrabold sm:text-2xl">Envie d'aller <GradientText>plus loin</GradientText> ?</h2>
              <p className="mt-1.5 text-sm text-white/70">Cette compétence s'inscrit dans un parcours métier complet avec projets et certificat.</p>
            </div>
            <Link href="/career-paths" className={cn(buttonClasses({ variant: "primary", size: "md" }), "shrink-0")}>
              Voir les parcours métiers <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-navy/[0.05] pb-3 last:border-0 last:pb-0">
      <dt className="inline-flex items-center gap-2 text-text-secondary"><span className="text-brand-blue-royal">{icon}</span>{label}</dt>
      <dd className="text-right font-semibold text-navy">{value}</dd>
    </div>
  );
}
