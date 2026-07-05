import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock,
  FileDown,
  Globe,
  Infinity as InfinityIcon,
  Layers,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Container,
  GradientText,
  Monogram,
  Reveal,
  Section,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  StarRating,
  formatDate,
  formatDuration,
  formatFCFA,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getCourseDetail, getCourses, getUserEnrollment } from "@/lib/queries";
import { levelLabel } from "@/lib/site";
import { CourseCard } from "@/components/CourseCard";
import { EnrollCTA } from "./EnrollCTA";
import { ProgramAccordion } from "./ProgramAccordion";

export const dynamic = "force-dynamic";

/* ─────────────────────────────── Metadata ──────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseDetail(slug);
  if (!course) {
    return { title: "Formation introuvable" };
  }
  return {
    title: `${course.title} — Formation en ligne`,
    description:
      course.subtitle ??
      `${course.title} : formation ${levelLabel(course.level)} en ${course.category.name} sur Access Academy, avec quiz interactifs et certificat vérifiable.`,
  };
}

/* ─────────────────────────────── Helpers ───────────────────────────────── */

function languageLabel(language: string): string {
  return language.toLowerCase().startsWith("fr") ? "Français" : language;
}

/** Titre de bloc du corps de page — filet dégradé signature. */
function BlockHeading({ title, id }: { title: string; id?: string }) {
  return (
    <div className="flex items-center gap-3" id={id}>
      <span aria-hidden className="h-px w-8 rounded-full bg-gradient-da" />
      <h2 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

/* ──────────────────────────────── Page ─────────────────────────────────── */

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseDetail(slug);
  if (!course) notFound();

  const user = await currentUser();
  const enrollment = user ? await getUserEnrollment(user.id, course.id) : null;

  /* Reprise de lecture : premier chapitre non complété, ordre pédagogique. */
  const orderedChapters = course.modules.flatMap((m) => m.chapters);
  const firstChapter = orderedChapters[0];
  const nextChapter = enrollment
    ? (orderedChapters.find(
        (c) => !enrollment.completedChapterIds.includes(c.id),
      ) ?? firstChapter)
    : firstChapter;
  const continueHref = nextChapter
    ? `/courses/${slug}/learn/${nextChapter.id}`
    : `/courses/${slug}`;
  const completedCount = enrollment?.completedChapterIds.length ?? 0;

  /* Formations similaires : même catégorie, cours courant exclu. */
  const similar = (await getCourses({ category: course.category.slug }))
    .filter((c) => c.slug !== slug)
    .slice(0, 3);

  const includes = [
    { icon: InfinityIcon, label: "Accès à vie au contenu du cours" },
    {
      icon: PlayCircle,
      label: `${formatDuration(course.durationMinutes)} de contenu à la demande`,
    },
    {
      icon: Layers,
      label: `${course.modules.length} modules · ${course.chapterCount} chapitres`,
    },
    { icon: Brain, label: "Quiz interactifs avec correction immédiate" },
    { icon: Award, label: "Certificat de réussite vérifiable" },
    { icon: Smartphone, label: "Accessible sur mobile, tablette et ordinateur" },
    { icon: FileDown, label: "Ressources téléchargeables" },
  ];

  return (
    <>
      {/* ══════════════ HERO — fond sombre, halos, grille ══════════════ */}
      <section className="relative isolate overflow-hidden bg-surface-dark">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid opacity-[0.35]" />
          <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-[120px]" />
          <div className="absolute right-[-8%] top-[-10%] h-80 w-80 rounded-full bg-brand-cyan/20 blur-[110px]" />
          <div className="absolute bottom-[-30%] left-1/4 h-72 w-72 rounded-full bg-brand-blue-vif/15 blur-[100px]" />
        </div>

        <Container className="relative">
          <div className="max-w-3xl pb-24 pt-10 sm:pt-14 lg:pb-28">
            {/* Fil d'ariane */}
            <Reveal y={14}>
              <nav
                aria-label="Fil d'ariane"
                className="flex flex-wrap items-center gap-1.5 text-sm text-white/55"
              >
                <Link
                  href="/courses"
                  className="transition-colors hover:text-white"
                >
                  Catalogue
                </Link>
                <ChevronRight size={14} aria-hidden />
                <Link
                  href={`/courses?category=${course.category.slug}`}
                  className="transition-colors hover:text-white"
                >
                  {course.category.name}
                </Link>
                <ChevronRight size={14} aria-hidden />
                <span className="line-clamp-1 max-w-[14rem] text-white/85 sm:max-w-sm">
                  {course.title}
                </span>
              </nav>
            </Reveal>

            {/* Badges catégorie + niveau + gratuit */}
            <Reveal y={14} delay={0.06}>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge variant="gradient">{course.category.name}</Badge>
                <Badge className="border border-white/15 bg-white/10 text-white">
                  {levelLabel(course.level)}
                </Badge>
                {course.isFree && (
                  <Badge className="bg-success text-white">Gratuit</Badge>
                )}
              </div>
            </Reveal>

            <Reveal y={16} delay={0.12}>
              <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                {course.title}
              </h1>
            </Reveal>

            {course.subtitle && (
              <Reveal y={16} delay={0.18}>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
                  {course.subtitle}
                </p>
              </Reveal>
            )}

            {/* Méta : note, inscrits, durée, chapitres, langue */}
            <Reveal y={16} delay={0.24}>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <StarRating rating={course.rating} size={15} />
                  <strong className="font-semibold text-white">
                    {course.rating.toFixed(1)}
                  </strong>
                  <span>
                    ({course.ratingCount} avis)
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={15} aria-hidden />
                  {course.enrollmentCount.toLocaleString("fr-FR")} inscrit
                  {course.enrollmentCount > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} aria-hidden />
                  {formatDuration(course.durationMinutes)}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={15} aria-hidden />
                  {course.chapterCount} chapitres
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe size={15} aria-hidden />
                  {languageLabel(course.language)}
                </span>
              </div>
            </Reveal>

            {/* Instructeur */}
            <Reveal y={16} delay={0.3}>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="flex items-center gap-3">
                  <Avatar
                    name={course.instructor.name}
                    src={course.instructor.avatar ?? undefined}
                    className="ring-2 ring-white/20"
                  />
                  <span className="text-sm text-white/70">
                    Créé par{" "}
                    <strong className="font-semibold text-white">
                      {course.instructor.name}
                    </strong>
                  </span>
                </span>
                {course.publishedAt && (
                  <span className="text-sm text-white/45">
                    Publié le {formatDate(course.publishedAt)}
                  </span>
                )}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ══════════════ CORPS + CARTE STICKY ══════════════ */}
      <Section tone="muted" spacing="sm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
            {/* ── Carte d'inscription (sticky, chevauche le hero) ────────── */}
            <aside className="lg:order-2">
              <div className="relative z-10 -mt-20 lg:sticky lg:top-24 lg:-mt-64">
                <Reveal y={18} delay={0.1}>
                  <div className="overflow-hidden rounded-2xl bg-surface-primary shadow-brand-lg ring-1 ring-navy/[0.08]">
                    {/* Aperçu vidéo factice */}
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-violet via-brand-blue-vif to-brand-cyan">
                      <div className="absolute inset-0 bg-dots opacity-25" />
                      <Monogram
                        variant="white"
                        size={110}
                        className="absolute -bottom-6 -right-4 opacity-15"
                      />
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 backdrop-blur-sm transition-transform duration-300 hover:scale-110">
                          <PlayCircle size={38} className="text-white" aria-hidden />
                        </span>
                      </div>
                      <Badge className="absolute left-3 top-3 bg-white/90 text-navy backdrop-blur">
                        Aperçu de la formation
                      </Badge>
                    </div>

                    <div className="p-6">
                      {enrollment ? (
                        /* ── Inscrit : progression ─────────────────────── */
                        <>
                          <Badge variant="success" className="mb-4">
                            <Check size={13} aria-hidden />
                            Vous êtes inscrit·e à ce cours
                          </Badge>
                          <div className="mb-5 rounded-xl border border-navy/[0.07] bg-surface-secondary p-4">
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm font-medium text-text-secondary">
                                Votre progression
                              </span>
                              <span className="font-display text-lg font-extrabold text-navy">
                                {enrollment.progress}%
                              </span>
                            </div>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-navy/[0.08]">
                              <div
                                className="h-full rounded-full bg-gradient-da transition-[width] duration-700"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-text-muted">
                              {completedCount} chapitre
                              {completedCount > 1 ? "s" : ""} terminé
                              {completedCount > 1 ? "s" : ""} sur{" "}
                              {course.chapterCount}
                              {enrollment.completedAt && " — cours terminé 🎉"}
                            </p>
                          </div>
                        </>
                      ) : (
                        /* ── Non inscrit : prix ────────────────────────── */
                        <div className="mb-5 flex items-baseline gap-2.5">
                          {course.isFree ? (
                            <>
                              <span className="font-display text-3xl font-extrabold text-success">
                                Gratuit
                              </span>
                              <span className="text-sm text-text-muted">
                                accès complet, sans frais
                              </span>
                            </>
                          ) : (
                            <>
                              <GradientText className="font-display text-3xl font-extrabold">
                                {formatFCFA(course.price)}
                              </GradientText>
                              <span className="text-sm text-text-muted">
                                paiement unique
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      <EnrollCTA
                        slug={slug}
                        isFree={course.isFree}
                        price={course.price}
                        enrolled={Boolean(enrollment)}
                        continueHref={continueHref}
                        title={course.title}
                      />

                      {/* Ce cours inclut */}
                      <div className="mt-6 border-t border-navy/[0.07] pt-5">
                        <p className="text-sm font-bold text-navy">
                          Ce cours inclut
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {includes.map(({ icon: IconCmp, label }) => (
                            <li
                              key={label}
                              className="flex items-start gap-2.5 text-sm text-text-secondary"
                            >
                              <IconCmp
                                size={16}
                                aria-hidden
                                className="mt-0.5 shrink-0 text-brand-blue-royal"
                              />
                              {label}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="mt-5 flex items-center justify-center gap-1.5 rounded-lg bg-surface-secondary px-3 py-2.5 text-center text-xs text-text-muted">
                        <ShieldCheck
                          size={14}
                          aria-hidden
                          className="shrink-0 text-success"
                        />
                        Paiement sécurisé Mobile Money — Orange, MTN, Wave
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </aside>

            {/* ── Contenu principal ──────────────────────────────────────── */}
            <div className="min-w-0 space-y-12 lg:order-1">
              {/* Ce que vous apprendrez */}
              {course.objectives.length > 0 && (
                <Reveal>
                  <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-8">
                    <BlockHeading title="Ce que vous apprendrez" />
                    <ul className="mt-6 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
                      {course.objectives.map((objective) => (
                        <li key={objective} className="flex items-start gap-3">
                          <span
                            aria-hidden
                            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-da text-white shadow-brand"
                          >
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <span className="text-sm leading-relaxed text-navy/85">
                            {objective}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {/* Description */}
              <Reveal>
                <div>
                  <BlockHeading title="À propos de cette formation" />
                  <p className="mt-5 whitespace-pre-line text-[0.95rem] leading-relaxed text-text-secondary">
                    {course.description}
                  </p>
                </div>
              </Reveal>

              {/* Programme */}
              <Reveal>
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <BlockHeading title="Programme du cours" id="programme" />
                    <p className="text-sm text-text-muted">
                      {course.modules.length} modules · {course.chapterCount}{" "}
                      chapitres · {formatDuration(course.durationMinutes)}
                    </p>
                  </div>
                  <div className="mt-6">
                    <ProgramAccordion
                      slug={slug}
                      modules={course.modules}
                      enrolled={Boolean(enrollment)}
                      completedChapterIds={enrollment?.completedChapterIds}
                    />
                  </div>
                </div>
              </Reveal>

              {/* Prérequis */}
              <Reveal>
                <div>
                  <BlockHeading title="Prérequis" />
                  {course.prerequisites.length > 0 ? (
                    <ul className="mt-5 space-y-2.5">
                      {course.prerequisites.map((prerequisite) => (
                        <li
                          key={prerequisite}
                          className="flex items-start gap-3 text-sm leading-relaxed text-navy/85"
                        >
                          <span
                            aria-hidden
                            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-da"
                          />
                          {prerequisite}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-5 text-sm leading-relaxed text-text-secondary">
                      Aucun prérequis — cette formation est accessible à tous
                      les niveaux, même en partant de zéro.
                    </p>
                  )}
                </div>
              </Reveal>

              {/* Formateur */}
              <Reveal>
                <div className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-8">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-da"
                  />
                  <BlockHeading title="Votre formateur" />
                  <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
                    <Avatar
                      name={course.instructor.name}
                      src={course.instructor.avatar ?? undefined}
                      className="h-16 w-16 text-xl ring-4 ring-brand-blue-vif/10"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-lg font-bold text-navy">
                        {course.instructor.name}
                      </p>
                      <p className="text-sm font-medium text-brand-blue-royal">
                        Formateur · Access Academy
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                        {course.instructorBio ??
                          "Expert du numérique et mentor passionné, il accompagne les apprenants d'Access Academy avec des formations concrètes, pensées pour le marché ivoirien."}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Avis des apprenants */}
              <div>
                <Reveal>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <BlockHeading title="Avis des apprenants" />
                    <span className="flex items-center gap-2 text-sm text-text-secondary">
                      <StarRating rating={course.rating} size={15} />
                      <strong className="font-display text-base font-extrabold text-navy">
                        {course.rating.toFixed(1)}
                      </strong>
                      / 5 · {course.ratingCount} avis
                    </span>
                  </div>
                </Reveal>

                {course.reviews.length > 0 ? (
                  <StaggerGroup className="mt-6 grid gap-4 sm:grid-cols-2">
                    {course.reviews.map((review) => (
                      <StaggerItem key={review.id} className="h-full">
                        <div className="flex h-full flex-col rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={review.user.name}
                              src={review.user.avatar ?? undefined}
                              className="h-9 w-9 text-xs"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-navy">
                                {review.user.name}
                              </p>
                              <p className="text-xs text-text-muted">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                            <StarRating
                              rating={review.rating}
                              size={13}
                              className="ml-auto shrink-0"
                            />
                          </div>
                          {review.comment && (
                            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                              « {review.comment} »
                            </p>
                          )}
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                ) : (
                  <Reveal>
                    <div className="mt-6 rounded-xl border border-dashed border-navy/15 bg-surface-primary px-6 py-10 text-center">
                      <Monogram size={36} className="mx-auto opacity-80" />
                      <p className="mt-4 text-sm text-text-secondary">
                        Pas encore d&apos;avis — soyez le premier à partager
                        votre expérience après avoir suivi la formation.
                      </p>
                    </div>
                  </Reveal>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ══════════════ FORMATIONS SIMILAIRES ══════════════ */}
      {similar.length > 0 && (
        <Section tone="default" spacing="md">
          <Container>
            <SectionHeading
              eyebrow="Continuez d'explorer"
              title={
                <>
                  Formations <GradientText>similaires</GradientText>
                </>
              }
              subtitle={`D'autres parcours en ${course.category.name} pour aller plus loin, au même niveau d'exigence.`}
            />
            <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((c, i) => (
                <StaggerItem key={c.id} className="h-full">
                  <CourseCard course={c} index={i + 1} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}
    </>
  );
}
