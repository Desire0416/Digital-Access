import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  ChevronRight,
  Star,
  Users,
  Clock,
  Layers,
  BookOpen,
  Globe,
  GraduationCap,
  Award,
  FolderKanban,
  Infinity as InfinityIcon,
  Check,
  Target,
  Sparkles,
  UserCheck,
  ListChecks,
  ClipboardCheck,
  BadgeCheck,
  Route,
  CalendarDays,
} from "lucide-react";
import { Container, Badge, Avatar, StarRating, StaggerGroup, Reveal } from "@da/ui";
import { getCourseDetail } from "@/lib/catalogue";
import { getCourseUserState } from "@/lib/learn-queries";
import { currentUser } from "@/lib/guards";
import { siteConfig, formatFCFA, LEVEL_LABEL } from "@/lib/site";
import { Markdown } from "@/components/Markdown";
import { CareerPathCard } from "@/components/cards";
import { EnrollPanel } from "./EnrollPanel";
import { ProgramAccordion } from "./ProgramAccordion";

/* ══════════════════════════════════════════════════════════════════════════
   Fiche formation (cahier §11) — hero navy, colonne d'achat sticky, sections
   objectifs / public / programme / projet / évaluations / certification /
   formateurs / appartenances / avis. JSON-LD Course.
   ══════════════════════════════════════════════════════════════════════════ */

const LANG_LABEL: Record<string, string> = { fr: "Français", en: "Anglais" };
const ASSESSMENT_LABEL: Record<string, string> = { QUIZ: "Quiz", ASSIGNMENT: "Devoir", EXAM: "Examen" };
const SKILL_LEVEL_LABEL: Record<string, string> = {
  DISCOVERY: "Découverte",
  BEGINNER: "Débutant",
  OPERATIONAL: "Opérationnel",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

function langLabel(code: string): string {
  return LANG_LABEL[code] ?? code.toUpperCase();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseDetail(slug);
  if (!course) return { title: "Formation introuvable" };
  const desc = course.subtitle ?? course.description.slice(0, 160);
  const url = `${siteConfig.url}/formations/${course.slug}`;
  return {
    title: course.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: course.title,
      description: desc,
      url,
      type: "website",
      ...(course.coverImage ? { images: [{ url: course.coverImage }] } : {}),
    },
  };
}

/* ─── Sous-composant : en-tête de section ──────────────────────────────────── */
function Block({
  id,
  icon: Icon,
  title,
  children,
}: {
  id?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-da text-white shadow-brand" aria-hidden>
          <Icon size={18} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseDetail(slug);
  if (!course) notFound();

  const user = await currentUser();
  const state = await getCourseUserState(course.id, user?.id ?? null);

  const primarySchool = course.schools.find((s) => s.isPrimary)?.school ?? course.schools[0]?.school ?? null;
  const durationLabel = course.durationHours && course.durationHours > 0 ? `${course.durationHours} h` : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.subtitle ?? course.description.slice(0, 300),
    provider: { "@type": "Organization", name: siteConfig.name, sameAs: siteConfig.url },
    url: `${siteConfig.url}/formations/${course.slug}`,
    inLanguage: course.language,
    ...(course.coverImage ? { image: course.coverImage } : {}),
    ...(course.rating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: course.rating,
            reviewCount: course.reviewsCount,
            bestRating: 5,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: course.price,
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
      category: course.price === 0 ? "Free" : "Paid",
    },
  };

  return (
    <div className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ══════════════════ Hero navy ══════════════════ */}
      <section className="relative overflow-hidden bg-navy text-white">
        <span className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        <Container className="relative py-10 sm:py-14">
          {/* Fil d'Ariane */}
          <nav aria-label="Fil d'Ariane" className="mb-6 flex items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-white">
              <Home size={13} aria-hidden />
              Accueil
            </Link>
            <ChevronRight size={13} aria-hidden />
            <Link href="/formations" className="transition-colors hover:text-white">
              Formations
            </Link>
            <ChevronRight size={13} aria-hidden />
            <span className="truncate text-white/80">{course.title}</span>
          </nav>

          <div className="max-w-3xl">
            {primarySchool && (
              <Link
                href={`/ecoles/${primarySchool.slug}`}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm transition-colors hover:border-white/30 hover:text-white"
              >
                <GraduationCap size={13} style={{ color: primarySchool.color }} aria-hidden />
                {primarySchool.name}
              </Link>
            )}

            <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{course.subtitle}</p>
            )}

            {/* Badges méta */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Badge variant="gradient">{LEVEL_LABEL[course.level] ?? course.level}</Badge>
              {durationLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                  <Clock size={13} aria-hidden />
                  {durationLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                <Globe size={13} aria-hidden />
                {langLabel(course.language)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                <Layers size={13} aria-hidden />
                {course.modules.length} module{course.modules.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Note + inscrits */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {course.rating != null ? (
                <span className="inline-flex items-center gap-2">
                  <StarRating rating={course.rating} size={16} />
                  <span className="font-bold text-white">{course.rating.toFixed(1)}</span>
                  <span className="text-white/55">
                    ({course.reviewsCount} avis)
                  </span>
                </span>
              ) : (
                <span className="text-white/55">Pas encore d&apos;avis</span>
              )}
              {course.enrolledCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-white/70">
                  <Users size={15} aria-hidden />
                  <span className="font-semibold text-white">{course.enrolledCount}</span> apprenant{course.enrolledCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ══════════════════ Corps + colonne d'achat ══════════════════ */}
      <Container className="relative">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          {/* ── Colonne d'achat (sticky) ── */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-[0_24px_60px_-30px_rgba(43,58,140,0.5)] lg:-mt-24">
                {/* Cover */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  {course.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="relative h-full w-full"
                      style={{ background: "linear-gradient(125deg,#5b3fa8,#2b5cc6 45%,#1e8fe1 72%,#00bcd4)" }}
                      aria-hidden
                    >
                      <span className="absolute -right-6 -top-8 h-28 w-28 rounded-full border border-white/20" />
                      <span className="absolute inset-0 bg-grid opacity-30" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Prix */}
                  <div className="mb-4 flex items-baseline gap-2">
                    <span
                      className={
                        course.price === 0
                          ? "font-display text-3xl font-bold text-success"
                          : "font-display text-3xl font-bold text-navy"
                      }
                    >
                      {course.price === 0 ? "Gratuit" : formatFCFA(course.price)}
                    </span>
                    {course.price > 0 && <span className="text-xs text-text-muted">paiement unique</span>}
                  </div>

                  {/* CTA */}
                  <EnrollPanel
                    slug={course.slug}
                    price={course.price}
                    authenticated={!!user}
                    emailVerified={!!user?.emailVerified}
                    enrolled={state.enrolled}
                    pending={state.pending}
                  />

                  {/* Garanties */}
                  <ul className="mt-5 space-y-2.5 border-t border-navy/[0.06] pt-5 text-sm text-navy/85">
                    <li className="flex items-start gap-2.5">
                      <Award size={16} className="mt-0.5 shrink-0 text-brand-violet" aria-hidden />
                      <span>{course.certificateTitle ?? "Certificat de réussite vérifiable"}</span>
                    </li>
                    {course.projects.length > 0 && (
                      <li className="flex items-start gap-2.5">
                        <FolderKanban size={16} className="mt-0.5 shrink-0 text-brand-blue-vif" aria-hidden />
                        <span>Projet pratique évalué</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2.5">
                      <InfinityIcon size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                      <span>Accès à vie au contenu et aux mises à jour</span>
                    </li>
                  </ul>

                  {/* Méta détaillée */}
                  <dl className="mt-5 space-y-2.5 border-t border-navy/[0.06] pt-5 text-sm">
                    <MetaRow icon={Layers} label="Modules" value={`${course.modules.length}`} />
                    <MetaRow icon={BookOpen} label="Leçons" value={`${course.lessonsCount}`} />
                    {durationLabel && <MetaRow icon={Clock} label="Durée" value={durationLabel} />}
                    <MetaRow icon={Target} label="Niveau" value={LEVEL_LABEL[course.level] ?? course.level} />
                    <MetaRow icon={Globe} label="Langue" value={langLabel(course.language)} />
                    <MetaRow
                      icon={CalendarDays}
                      label="Mise à jour"
                      value={new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(course.updatedAt)}
                    />
                  </dl>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Contenu principal ── */}
          <div className="order-2 space-y-12 py-10 lg:order-1 lg:py-12">
            {/* À propos */}
            <Block icon={Sparkles} title="À propos de cette formation">
              <Markdown className="prose-sm sm:prose-base">{course.description}</Markdown>
            </Block>

            {/* Objectifs */}
            {course.objectives.length > 0 && (
              <Block icon={ListChecks} title="Ce que vous allez apprendre">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-xl border border-navy/[0.07] bg-surface-secondary/50 p-3.5">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-da text-white" aria-hidden>
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-relaxed text-navy/85">{o}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {/* Compétences visées */}
            {course.skills.length > 0 && (
              <Block icon={Target} title="Compétences visées">
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((s) => (
                    <span
                      key={s.skill.slug}
                      className={
                        s.isPrimary
                          ? "inline-flex items-center gap-1.5 rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white shadow-brand"
                          : "inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface-primary px-3.5 py-1.5 text-xs font-semibold text-navy"
                      }
                    >
                      {s.skill.name}
                      <span className={s.isPrimary ? "text-white/70" : "text-text-muted"}>
                        · {SKILL_LEVEL_LABEL[s.targetLevel] ?? s.targetLevel}
                      </span>
                    </span>
                  ))}
                </div>
              </Block>
            )}

            {/* Public & prérequis (§11.2) */}
            {(course.targetAudience.length > 0 || course.prerequisitesText.length > 0 || course.requires.length > 0) && (
              <Block icon={UserCheck} title="À qui s'adresse cette formation">
                <div className="grid gap-4 sm:grid-cols-2">
                  {course.targetAudience.length > 0 && (
                    <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                      <h3 className="mb-3 font-display text-sm font-bold text-navy">Public cible</h3>
                      <ul className="space-y-2">
                        {course.targetAudience.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-navy/80">
                            <Users size={14} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(course.prerequisitesText.length > 0 || course.requires.length > 0) && (
                    <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                      <h3 className="mb-3 font-display text-sm font-bold text-navy">Prérequis</h3>
                      <ul className="space-y-2">
                        {course.prerequisitesText.map((p, i) => (
                          <li key={`t-${i}`} className="flex items-start gap-2 text-sm text-navy/80">
                            <Check size={14} className="mt-0.5 shrink-0 text-brand-blue-vif" aria-hidden />
                            {p}
                          </li>
                        ))}
                        {course.requires.map((r) => (
                          <li key={r.requiresCourse.slug} className="flex items-start gap-2 text-sm">
                            <Route size={14} className="mt-0.5 shrink-0 text-brand-violet" aria-hidden />
                            <Link
                              href={`/formations/${r.requiresCourse.slug}`}
                              className="font-medium text-brand-blue-royal underline-offset-2 hover:text-brand-violet hover:underline"
                            >
                              {r.requiresCourse.title}
                            </Link>
                          </li>
                        ))}
                        {course.prerequisitesText.length === 0 && course.requires.length === 0 && (
                          <li className="text-sm text-text-secondary">Aucun prérequis particulier.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                {course.tools.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Outils :</span>
                    {course.tools.map((t) => (
                      <Badge key={t} variant="soft">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </Block>
            )}

            {/* Programme (§11.4) */}
            {course.modules.length > 0 && (
              <Block icon={BookOpen} title="Programme de la formation">
                <p className="mb-4 -mt-1 text-sm text-text-secondary">
                  {course.modules.length} module{course.modules.length > 1 ? "s" : ""} · {course.lessonsCount} leçon
                  {course.lessonsCount > 1 ? "s" : ""}
                </p>
                <ProgramAccordion
                  modules={course.modules.map((m) => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    objectives: m.objectives,
                    durationMinutes: m.durationMinutes,
                    lessons: m.lessons,
                  }))}
                />
              </Block>
            )}

            {/* Projet (§11.5) */}
            {course.projects.length > 0 && (
              <Block icon={FolderKanban} title={course.projects.length > 1 ? "Projets pratiques" : "Projet pratique"}>
                <div className="space-y-4">
                  {course.projects.map((p) => (
                    <div
                      key={p.id}
                      className="relative overflow-hidden rounded-xl border border-navy/[0.08] bg-surface-primary p-5"
                    >
                      <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-blue-vif/[0.06] blur-2xl" aria-hidden />
                      <div className="relative">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-navy">{p.title}</h3>
                          {p.isRequired && <Badge variant="warning">Obligatoire</Badge>}
                          <Badge variant="soft">Note minimale {p.minScore}/100</Badge>
                        </div>
                        <div className="mt-2 text-sm text-navy/80">
                          <Markdown className="prose-sm">{p.context}</Markdown>
                        </div>
                        {p.deliverables.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Livrables attendus</p>
                            <ul className="space-y-1.5">
                              {p.deliverables.map((d, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-navy/80">
                                  <ClipboardCheck size={14} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {/* Évaluations (§11.6) — sans réponses */}
            {course.assessments.length > 0 && (
              <Block icon={ClipboardCheck} title="Évaluations">
                <div className="grid gap-3 sm:grid-cols-2">
                  {course.assessments.map((a) => (
                    <div key={a.id} className="rounded-xl border border-navy/[0.08] bg-surface-primary p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="info">{ASSESSMENT_LABEL[a.type] ?? a.type}</Badge>
                        {a.isRequired && <span className="text-[11px] font-semibold uppercase tracking-wide text-warning">Requise</span>}
                      </div>
                      <h3 className="mt-2.5 font-display text-sm font-bold text-navy">{a.title}</h3>
                      {a.description && <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{a.description}</p>}
                      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                        <span>
                          <span className="font-semibold text-navy">{a._count.questions}</span> question{a._count.questions > 1 ? "s" : ""}
                        </span>
                        <span>
                          Seuil <span className="font-semibold text-navy">{a.passingScore}%</span>
                        </span>
                        <span>
                          Tentatives{" "}
                          <span className="font-semibold text-navy">{a.attemptsAllowed > 0 ? a.attemptsAllowed : "illimitées"}</span>
                        </span>
                        {a.durationMinutes && a.durationMinutes > 0 && (
                          <span>
                            <span className="font-semibold text-navy">{a.durationMinutes} min</span>
                          </span>
                        )}
                      </dl>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {/* Certification (§11.7) */}
            <Block icon={BadgeCheck} title="Certification">
              <div className="relative overflow-hidden rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] p-6">
                <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-da opacity-10 blur-2xl" aria-hidden />
                <div className="relative flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand" aria-hidden>
                    <Award size={24} />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-navy">
                      {course.certificateTitle ?? "Certificat de réussite Access Academy"}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-navy/75">
                      À la fin de la formation, vous obtenez un certificat nominatif, doté d&apos;un code de vérification public
                      et téléchargeable en PDF — à valoriser sur votre CV et LinkedIn.
                    </p>
                    <Link
                      href="/certificats/verifier"
                      className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet"
                    >
                      Vérifier un certificat
                      <ChevronRight size={14} aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </Block>

            {/* Formateurs (§11.8) */}
            {course.instructors.length > 0 && (
              <Block icon={GraduationCap} title={course.instructors.length > 1 ? "Vos formateurs" : "Votre formateur"}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {course.instructors.map((ins) => (
                    <div key={ins.user.id} className="flex gap-4 rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                      <Avatar name={ins.user.name} src={ins.user.avatar ?? undefined} className="h-14 w-14 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold text-navy">{ins.user.name}</p>
                        <p className="text-xs font-semibold text-brand-blue-royal">{ins.roleLabel}</p>
                        {ins.user.bio && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-text-secondary">{ins.user.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {/* Appartenances (§11.9) */}
            {course.careerPaths.length > 0 && (
              <Block icon={Route} title="Cette formation fait partie de">
                <StaggerGroup className="grid gap-5 sm:grid-cols-2">
                  {course.careerPaths.map((cp) => (
                    <CareerPathCard
                      key={cp.careerPath.slug}
                      path={{
                        slug: cp.careerPath.slug,
                        title: cp.careerPath.title,
                        targetJob: cp.careerPath.targetJob,
                        coverImage: cp.careerPath.coverImage,
                        courseCount: 0,
                        projectCount: 0,
                        entryLevel: course.level,
                        exitLevel: course.level,
                        price: 0,
                      }}
                    />
                  ))}
                </StaggerGroup>
                <p className="mt-3 text-xs text-text-secondary">
                  Une formation validée compte pour chaque parcours qui l&apos;inclut — jamais payée deux fois.
                </p>
              </Block>
            )}

            {/* Avis (§11.10) */}
            {course.reviews.length > 0 && (
              <Block icon={Star} title="Avis des apprenants">
                <div className="mb-4 flex items-center gap-4 rounded-xl border border-navy/[0.07] bg-surface-secondary/50 p-4">
                  <span className="font-display text-4xl font-bold text-navy">{course.rating?.toFixed(1)}</span>
                  <div>
                    <StarRating rating={course.rating ?? 0} size={18} />
                    <p className="mt-1 text-sm text-text-secondary">
                      {course.reviewsCount} avis d&apos;apprenants
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {course.reviews.map((r) => (
                    <Reveal key={r.id}>
                      <figure className="h-full rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.user.name} src={r.user.avatar ?? undefined} className="h-10 w-10" />
                          <div>
                            <figcaption className="text-sm font-semibold text-navy">{r.user.name}</figcaption>
                            <StarRating rating={r.rating} size={13} />
                          </div>
                        </div>
                        {r.comment && <blockquote className="mt-3 text-sm leading-relaxed text-navy/80">« {r.comment} »</blockquote>}
                      </figure>
                    </Reveal>
                  ))}
                </div>
              </Block>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-text-secondary">
        <Icon size={15} className="text-brand-blue-royal" aria-hidden />
        {label}
      </dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  );
}
