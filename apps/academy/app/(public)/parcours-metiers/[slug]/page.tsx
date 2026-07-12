import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  ChevronRight,
  Briefcase,
  Clock,
  CalendarDays,
  Layers,
  GraduationCap,
  Award,
  Target,
  Check,
  BadgeCheck,
  Route,
  FolderKanban,
  ClipboardCheck,
  BookOpen,
  ArrowUpRight,
  Lock,
  CornerDownRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Container, Badge, Reveal } from "@da/ui";
import { getCareerPathDetail, type CareerPathDetail } from "@/lib/catalogue";
import { currentUser } from "@/lib/guards";
import { siteConfig, formatFCFA, LEVEL_LABEL } from "@/lib/site";
import { Markdown } from "@/components/Markdown";
import { PathEnrollPanel } from "./PathEnrollPanel";

/* ══════════════════════════════════════════════════════════════════════════
   Fiche parcours métier (cahier §13.4-13.9) — hero métier, composition par
   phases (timeline), reconnaissance des acquis (§13.7) et tarification
   intelligente (§27.4), projet transversal (§13.8), conditions de
   certification (§13.9). JSON-LD. Le prix reflète les acquis de l'utilisateur.
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED_STATUSES = ["ACTIVE", "COMPLETED"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = await getCareerPathDetail(slug);
  if (!path) return { title: "Parcours introuvable" };
  const desc = `Devenez ${path.targetJob}. ${path.description.slice(0, 140)}`;
  const url = `${siteConfig.url}/parcours-metiers/${path.slug}`;
  return {
    title: `${path.title} — Parcours métier`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: path.title,
      description: desc,
      url,
      type: "website",
      ...(path.coverImage ? { images: [{ url: path.coverImage }] } : {}),
    },
  };
}

/* ─── En-tête de section ──────────────────────────────────────────────────── */
function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
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

type PathCourse = CareerPathDetail["courses"][number];

export default async function CareerPathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await currentUser();
  const path = await getCareerPathDetail(slug, user?.id ?? null);
  if (!path) notFound();

  const primarySchool = path.schools.find((s) => s.isPrimary)?.school ?? path.schools[0]?.school ?? null;
  const enrolled = !!path.pathEnrollment && ACQUIRED_STATUSES.includes(path.pathEnrollment.status);
  const { pricing } = path;

  // Titre des formations pour afficher un prérequis interne lisible.
  const titleById = new Map(path.courses.map((c) => [c.course.id, c.course.title]));

  // Regroupement des formations par phase (§13.5-13.6), phases ordonnées.
  const coursesByPhase = new Map<string | null, PathCourse[]>();
  for (const c of path.courses) {
    const key = c.phaseId ?? null;
    const list = coursesByPhase.get(key) ?? [];
    list.push(c);
    coursesByPhase.set(key, list);
  }
  const orphanCourses = coursesByPhase.get(null) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: path.title,
    description: path.description.slice(0, 300),
    provider: { "@type": "Organization", name: siteConfig.name, sameAs: siteConfig.url },
    url: `${siteConfig.url}/parcours-metiers/${path.slug}`,
    ...(path.coverImage ? { image: path.coverImage } : {}),
    occupationalCategory: path.targetJob,
    offers: {
      "@type": "Offer",
      price: path.price,
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ══════════════════ Hero métier ══════════════════ */}
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
            <Link href="/parcours-metiers" className="transition-colors hover:text-white">
              Parcours métiers
            </Link>
            <ChevronRight size={13} aria-hidden />
            <span className="truncate text-white/80">{path.title}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <Badge variant="gradient">
                <Route size={12} aria-hidden />
                Parcours métier
              </Badge>
              {primarySchool && (
                <Link
                  href={`/ecoles/${primarySchool.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm transition-colors hover:border-white/30 hover:text-white"
                >
                  <GraduationCap size={13} style={{ color: primarySchool.color }} aria-hidden />
                  {primarySchool.name}
                </Link>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {path.title}
            </h1>
            <p className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-brand-cyan">
              <Briefcase size={18} aria-hidden />
              {path.targetJob}
            </p>
            {path.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                {path.description}
              </p>
            )}

            {/* Niveaux entrée → sortie */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 font-semibold text-white/90">
                <Target size={14} aria-hidden />
                {LEVEL_LABEL[path.entryLevel] ?? path.entryLevel}
              </span>
              <span className="relative h-0.5 w-12 overflow-hidden rounded-full bg-white/20" aria-hidden>
                <span className="absolute inset-0 bg-gradient-da" />
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-da px-3.5 py-1.5 font-semibold text-white shadow-brand">
                <TrendingUp size={14} aria-hidden />
                {LEVEL_LABEL[path.exitLevel] ?? path.exitLevel}
              </span>
            </div>

            {/* Chiffres clés */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Layers size={15} aria-hidden />
                <span className="font-semibold text-white">{path.courses.length}</span> formation
                {path.courses.length > 1 ? "s" : ""}
              </span>
              {path.projects.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <FolderKanban size={15} aria-hidden />
                  <span className="font-semibold text-white">{path.projects.length}</span> projet
                  {path.projects.length > 1 ? "s" : ""}
                </span>
              )}
              {path.duration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden />
                  <span className="font-semibold text-white">{path.duration}</span>
                </span>
              )}
              {path.rhythm && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} aria-hidden />
                  {path.rhythm}
                </span>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ══════════════════ Corps + colonne d'inscription ══════════════════ */}
      <Container className="relative">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          {/* ── Colonne d'inscription (sticky) ── */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-[0_24px_60px_-30px_rgba(43,58,140,0.5)] lg:-mt-24">
                {/* Cover */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  {path.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={path.coverImage} alt="" className="h-full w-full object-cover" />
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
                  {/* ── Tarification intelligente (§27.4) ── */}
                  <div className="mb-4">
                    {pricing.deduction > 0 ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-3xl font-bold text-navy">
                            {pricing.finalPrice === 0 ? "Offert" : formatFCFA(pricing.finalPrice)}
                          </span>
                          <span className="font-display text-lg font-semibold text-text-muted line-through">
                            {formatFCFA(pricing.fullPrice)}
                          </span>
                        </div>
                        <div className="mt-2 rounded-xl border border-success/25 bg-success/[0.07] p-3">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-success">
                            <BadgeCheck size={14} aria-hidden />
                            − {formatFCFA(pricing.deduction)} de formations déjà acquises
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {pricing.acquiredCourses.map((c) => (
                              <li key={c.id} className="flex items-center justify-between gap-2 text-[11px] text-navy/70">
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Check size={11} className="shrink-0 text-success" aria-hidden />
                                  <span className="truncate">{c.title}</span>
                                </span>
                                <span className="shrink-0 font-medium">− {formatFCFA(c.price)}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 border-t border-success/20 pt-2 text-[11px] leading-relaxed text-success">
                            Vos acquis sont reconnus : vous ne payez jamais deux fois une formation.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span
                          className={
                            pricing.finalPrice === 0
                              ? "font-display text-3xl font-bold text-success"
                              : "font-display text-3xl font-bold text-navy"
                          }
                        >
                          {pricing.finalPrice === 0 ? "Gratuit" : formatFCFA(pricing.finalPrice)}
                        </span>
                        {pricing.finalPrice > 0 && <span className="text-xs text-text-muted">paiement unique</span>}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <PathEnrollPanel
                    slug={path.slug}
                    finalPrice={pricing.finalPrice}
                    authenticated={!!user}
                    emailVerified={!!user?.emailVerified}
                    enrolled={enrolled}
                  />

                  {/* Garanties */}
                  <ul className="mt-5 space-y-2.5 border-t border-navy/[0.06] pt-5 text-sm text-navy/85">
                    <li className="flex items-start gap-2.5">
                      <Award size={16} className="mt-0.5 shrink-0 text-brand-violet" aria-hidden />
                      <span>{path.certificationTitle ?? "Certification métier vérifiable"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Layers size={16} className="mt-0.5 shrink-0 text-brand-blue-vif" aria-hidden />
                      <span>
                        {path.courses.length} formation{path.courses.length > 1 ? "s" : ""} · {path.projects.length}{" "}
                        projet{path.projects.length > 1 ? "s" : ""}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                      <span>Reconnaissance des acquis intégrée</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Contenu principal ── */}
          <div className="order-2 space-y-12 py-10 lg:order-1 lg:py-12">
            {/* Missions du métier (§13.4) */}
            {path.missions.length > 0 && (
              <Block icon={Briefcase} title={`Le métier de ${path.targetJob}`}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {path.missions.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl border border-navy/[0.07] bg-surface-secondary/50 p-3.5"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-da text-white" aria-hidden>
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-relaxed text-navy/85">{m}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {/* Compétences finales / débouchés (§13.4) */}
            {path.outcomes.length > 0 && (
              <Block icon={Sparkles} title="Compétences finales et débouchés">
                <div className="flex flex-wrap gap-2">
                  {path.outcomes.map((o) => (
                    <span
                      key={o}
                      className="inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface-primary px-3.5 py-1.5 text-xs font-semibold text-navy"
                    >
                      <ArrowUpRight size={13} className="text-brand-blue-vif" aria-hidden />
                      {o}
                    </span>
                  ))}
                </div>
              </Block>
            )}

            {/* Composition par phases (§13.5-13.6) — timeline verticale */}
            <Block icon={Route} title="Composition du parcours">
              <p className="mb-6 -mt-1 text-sm text-text-secondary">
                Un itinéraire structuré en phases. Chaque formation validée est reconnue et ne se paie qu&apos;une fois.
              </p>

              <div className="space-y-8">
                {path.phases.map((phase, phaseIndex) => {
                  const phaseCourses = coursesByPhase.get(phase.id) ?? [];
                  if (phaseCourses.length === 0) return null;
                  return (
                    <PhaseTimeline
                      key={phase.id}
                      index={phaseIndex + 1}
                      title={phase.title}
                      description={phase.description}
                      courses={phaseCourses}
                      titleById={titleById}
                      isLast={phaseIndex === path.phases.length - 1 && orphanCourses.length === 0}
                    />
                  );
                })}

                {/* Formations sans phase assignée */}
                {orphanCourses.length > 0 && (
                  <PhaseTimeline
                    index={path.phases.length + 1}
                    title="Formations du parcours"
                    description={null}
                    courses={orphanCourses}
                    titleById={titleById}
                    isLast
                  />
                )}
              </div>
            </Block>

            {/* Projet transversal (§13.8) */}
            {path.projects.length > 0 && (
              <Block icon={FolderKanban} title={path.projects.length > 1 ? "Projets transversaux" : "Projet transversal"}>
                <div className="space-y-4">
                  {path.projects.map((p) => (
                    <div
                      key={p.id}
                      className="relative overflow-hidden rounded-xl border border-navy/[0.08] bg-surface-primary p-5"
                    >
                      <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-violet/[0.06] blur-2xl" aria-hidden />
                      <div className="relative">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-navy">{p.title}</h3>
                          {p.isRequired && <Badge variant="warning">Obligatoire</Badge>}
                        </div>
                        <div className="mt-2 text-sm text-navy/80">
                          <Markdown className="prose-sm">{p.context}</Markdown>
                        </div>
                        {p.deliverables.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                              Livrables attendus
                            </p>
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

            {/* Conditions de certification (§13.9) */}
            <Block icon={BadgeCheck} title="Conditions de certification">
              <div className="relative overflow-hidden rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] p-6">
                <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-da opacity-10 blur-2xl" aria-hidden />
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand" aria-hidden>
                      <Award size={24} />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-navy">
                        {path.certificationTitle ?? `Certification ${path.targetJob}`}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-navy/75">
                        Pour obtenir votre certification métier, vous devez remplir les conditions suivantes :
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    <CertCondition>Valider toutes les formations obligatoires du parcours</CertCondition>
                    {path.courses.some((c) => !c.isRequired) && (
                      <CertCondition>Valider le nombre minimal de formations optionnelles</CertCondition>
                    )}
                    {path.projects.length > 0 && <CertCondition>Réussir le projet transversal du parcours</CertCondition>}
                    <CertCondition>Compléter votre portfolio de réalisations</CertCondition>
                  </ul>
                  <Link
                    href="/certificats/verifier"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet"
                  >
                    Vérifier un certificat
                    <ChevronRight size={14} aria-hidden />
                  </Link>
                </div>
              </div>
            </Block>
          </div>
        </div>
      </Container>
    </div>
  );
}

/* ─── Timeline d'une phase ─────────────────────────────────────────────────── */
function PhaseTimeline({
  index,
  title,
  description,
  courses,
  titleById,
  isLast,
}: {
  index: number;
  title: string;
  description: string | null;
  courses: PathCourse[];
  titleById: Map<string, string>;
  isLast: boolean;
}) {
  return (
    <div className="relative pl-11">
      {/* Ligne verticale + pastille numérotée */}
      <span
        className="absolute left-3.5 top-0 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full bg-gradient-da text-xs font-bold text-white shadow-brand"
        aria-hidden
      >
        {index}
      </span>
      {!isLast && (
        <span className="absolute left-3.5 top-7 bottom-[-2rem] w-px -translate-x-1/2 bg-navy/[0.1]" aria-hidden />
      )}

      <div className="mb-3">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-blue-royal">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
      </div>

      <div className="space-y-3">
        {courses.map((c) => (
          <Reveal key={c.id}>
            <PathCourseCard course={c} prerequisiteTitle={c.prerequisiteCourseId ? titleById.get(c.prerequisiteCourseId) ?? null : null} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ─── Carte formation dans la composition ──────────────────────────────────── */
function PathCourseCard({
  course,
  prerequisiteTitle,
}: {
  course: PathCourse;
  prerequisiteTitle: string | null;
}) {
  const c = course.course;
  return (
    <Link
      href={`/formations/${c.slug}`}
      className="group relative flex gap-4 overflow-hidden rounded-xl border border-navy/[0.08] bg-surface-primary p-4 transition-all hover:border-brand-blue-vif/40 hover:shadow-[0_14px_30px_-18px_rgba(43,58,140,0.4)]"
    >
      {/* Vignette */}
      <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:block">
        {c.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: "linear-gradient(125deg,#5b3fa8,#2b5cc6 50%,#00bcd4)" }}
            aria-hidden
          />
        )}
        <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-[11px] font-bold text-navy shadow-sm">
          {course.position}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={course.isRequired ? "gradient" : "soft"}>
            {course.isRequired ? "Obligatoire" : "Optionnelle"}
          </Badge>
          <Badge variant="outline">{LEVEL_LABEL[c.level] ?? c.level}</Badge>
          {course.acquired && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-white">
              <BadgeCheck size={11} aria-hidden />
              Acquise
            </span>
          )}
        </div>

        <h4 className="mt-2 font-display text-sm font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal">
          {c.title}
        </h4>
        {c.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">{c.subtitle}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
          {c.durationHours != null && c.durationHours > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} aria-hidden />
              {c.durationHours} h
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <BookOpen size={11} aria-hidden />
            {course.modulesCount} module{course.modulesCount > 1 ? "s" : ""}
          </span>
          <span className={course.acquired ? "font-semibold text-success" : "font-semibold text-navy"}>
            {course.acquired ? "Déjà acquise" : c.price === 0 ? "Gratuit" : formatFCFA(c.price)}
          </span>
        </div>

        {/* Prérequis interne (§13.6) */}
        {prerequisiteTitle && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-secondary px-2 py-1 text-[11px] font-medium text-text-secondary">
            <Lock size={11} className="text-brand-violet" aria-hidden />
            À suivre après
            <span className="inline-flex items-center gap-0.5 font-semibold text-navy">
              <CornerDownRight size={10} aria-hidden />
              {prerequisiteTitle}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}

function CertCondition({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 rounded-xl border border-navy/[0.07] bg-surface-primary/80 p-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-da text-white" aria-hidden>
        <Check size={12} strokeWidth={3} />
      </span>
      <span className="text-sm leading-relaxed text-navy/85">{children}</span>
    </li>
  );
}
