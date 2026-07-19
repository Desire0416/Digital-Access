import type { Metadata } from "next";
import Link from "next/link";
import {
  Section,
  Container,
  Reveal,
  StaggerGroup,
  StaggerItem,
  Badge,
  buttonClasses,
} from "@da/ui";
import {
  ArrowRight,
  BookOpen,
  Route,
  Compass,
  Target,
  MousePointerClick,
  PlayCircle,
  FolderKanban,
  Award,
  Sparkles,
  Quote,
  Star,
  Users,
  BadgeCheck,
  Building2,
} from "lucide-react";
import { getHomeData } from "@/lib/catalogue";
import { CourseCard, CareerPathCard, SchoolCard } from "@/components/cards";
import { SectionHeading } from "@/components/SectionHeading";
import HeroSection from "@/components/home/HeroSection";

export const metadata: Metadata = {
  title: "Apprenez une compétence. Préparez-vous à un métier.",
  description:
    "Access Academy est l'académie numérique de Digital Access : formations certifiantes, parcours métiers et projets pratiques pour développer des compétences concrètes et booster votre employabilité en Côte d'Ivoire.",
  alternates: { canonical: "/" },
};

/* ══════════════════════════════════════════════════════════════════════════
   Page d'accueil Access Academy — cahier §9. Composition visuelle DA
   originale, aucune section générique. Données réelles via getHomeData().
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── Sous-composants statiques (contenus institutionnels §9.6/§9.8/§9.9) ─── */

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Choisir",
    text: "Sélectionnez une formation, un parcours métier ou explorez un domaine dans nos écoles.",
  },
  {
    icon: PlayCircle,
    title: "Apprendre",
    text: "Progressez à votre rythme : vidéos, cours structurés et évaluations notées automatiquement.",
  },
  {
    icon: FolderKanban,
    title: "Pratiquer",
    text: "Réalisez des projets concrets qui prouvent vos compétences et enrichissent votre portfolio.",
  },
  {
    icon: Award,
    title: "Certifier",
    text: "Obtenez un certificat vérifiable avec QR code, reconnu et partageable sur vos réseaux.",
  },
] as const;

const CERTIFICATION_LEVELS = [
  {
    icon: BadgeCheck,
    title: "Attestation de participation",
    text: "Reconnaît votre assiduité et l'achèvement du programme suivi.",
  },
  {
    icon: Award,
    title: "Certificat de formation",
    text: "Valide la maîtrise des compétences d'une formation complète, projet inclus.",
  },
  {
    icon: Sparkles,
    title: "Certificat de spécialisation",
    text: "Atteste d'une expertise approfondie sur un ensemble de compétences avancées.",
  },
  {
    icon: Route,
    title: "Certification de parcours métier",
    text: "La reconnaissance la plus complète : vous êtes prêt·e à exercer le métier visé.",
  },
] as const;

const TESTIMONIALS = [
  {
    name: "Awa Traoré",
    role: "Analyste de données, Abidjan",
    quote:
      "Le parcours métier m'a fait passer de débutante à un poste d'analyste en quelques mois. Les projets pratiques ont fait toute la différence lors de mes entretiens.",
    rating: 5,
  },
  {
    name: "Koffi N'Guessan",
    role: "Développeur web freelance",
    quote:
      "J'ai apprécié de ne payer qu'une seule fois chaque formation, même en suivant plusieurs parcours. Le certificat vérifiable rassure vraiment mes clients.",
    rating: 5,
  },
  {
    name: "Fatoumata Bamba",
    role: "Responsable RH, PME industrielle",
    quote:
      "Nous formons nos équipes sur Access Academy. Le suivi de progression et les rapports nous permettent de piloter la montée en compétences sereinement.",
    rating: 5,
  },
] as const;

/* ─── Bloc d'orientation §9.2 ──────────────────────────────────────────────── */

const ORIENTATION = [
  {
    icon: BookOpen,
    title: "Apprendre une compétence",
    text: "Suivez une formation ciblée pour maîtriser un outil ou une compétence précise.",
    href: "/formations",
    cta: "Voir les formations",
    color: "#1e8fe1",
  },
  {
    icon: Target,
    title: "Se préparer à un métier",
    text: "Suivez un parcours métier complet qui assemble les formations dans le bon ordre.",
    href: "/parcours-metiers",
    cta: "Voir les parcours",
    color: "#5b3fa8",
  },
  {
    icon: Compass,
    title: "Explorer un domaine",
    text: "Découvrez nos écoles thématiques et l'ensemble de leur offre pédagogique.",
    href: "/ecoles",
    cta: "Voir les écoles",
    color: "#00bcd4",
  },
] as const;

export default async function HomePage() {
  const { featuredPaths, popularCourses, schools, stats } = await getHomeData();

  // Données sérialisables pour le hero (composant client) — §9.1
  const heroCourses = popularCourses.map((c) => ({
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    level: c.level,
    price: c.price,
    coverImage: c.coverImage,
    rating: c.rating,
    reviewsCount: c.reviewsCount,
    modulesCount: c.modulesCount,
    hasCertificate: c.hasCertificate,
    hasProject: c.hasProject,
    schoolName: c.primarySchool?.name ?? null,
  }));
  const heroPaths = featuredPaths.map((p) => ({
    slug: p.slug,
    title: p.title,
    targetJob: p.targetJob,
    coursesCount: p.coursesCount,
    projectsCount: p.projectsCount,
    exitLevel: p.exitLevel,
    certificationTitle: p.certificationTitle,
  }));

  return (
    <>
      {/* ═══════════════════════ HERO §9.1 ═══════════════════════ */}
      <HeroSection
        stats={stats}
        courses={heroCourses}
        paths={heroPaths}
        schoolsCount={schools.length}
      />

      {/* ═══════════════════════ ORIENTATION §9.2 ═══════════════════════ */}
      <Section tone="default" spacing="md">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Par où commencer"
            title="Trois façons de"
            gradient="progresser"
            subtitle="Que vous cherchiez une compétence précise, un métier complet ou un domaine à explorer, il y a un chemin fait pour vous."
            className="mx-auto"
          />
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ORIENTATION.map((o) => (
              <StaggerItem key={o.href}>
                <Link
                  href={o.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.08] bg-surface-primary p-7 transition-shadow duration-300 hover:shadow-brand-lg"
                >
                  <span
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.1] blur-2xl transition-opacity group-hover:opacity-20"
                    style={{ backgroundColor: o.color }}
                    aria-hidden
                  />
                  <span
                    className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-brand"
                    style={{ background: `linear-gradient(135deg, ${o.color}, ${o.color}bb)` }}
                  >
                    <o.icon size={26} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold text-navy">{o.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{o.text}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal">
                    {o.cta}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* ═══════════════════════ PARCOURS VEDETTES §9.3 ═══════════════════════ */}
      {featuredPaths.length > 0 && (
        <Section tone="muted" spacing="md">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Parcours métiers"
                title="Devenez opérationnel pour un"
                gradient="métier"
                subtitle="Des programmes complets qui assemblent nos formations dans le bon ordre, jusqu'à la certification."
              />
              <Link
                href="/parcours-metiers"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-blue-royal hover:underline sm:inline-flex"
              >
                Tous les parcours
                <ArrowRight size={15} />
              </Link>
            </div>
            <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredPaths.map((p) => (
                <StaggerItem key={p.id} className="h-full">
                  <CareerPathCard
                    path={{
                      slug: p.slug,
                      title: p.title,
                      targetJob: p.targetJob,
                      coverImage: p.coverImage,
                      schoolName: p.primarySchool?.name ?? null,
                      duration: p.duration,
                      courseCount: p.coursesCount,
                      projectCount: p.projectsCount,
                      entryLevel: p.entryLevel,
                      exitLevel: p.exitLevel,
                      certificationTitle: p.certificationTitle,
                      price: p.price,
                    }}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      {/* ═══════════════════════ FORMATIONS POPULAIRES §9.4 ═══════════════════════ */}
      {popularCourses.length > 0 && (
        <Section tone="default" spacing="md">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Formations populaires"
                title="Les compétences les plus"
                gradient="demandées"
                subtitle="Chaque formation est unique, réutilisable dans plusieurs parcours, et jamais facturée deux fois."
              />
              <Link
                href="/formations"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-blue-royal hover:underline sm:inline-flex"
              >
                Toutes les formations
                <ArrowRight size={15} />
              </Link>
            </div>
            <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {popularCourses.map((c) => (
                <StaggerItem key={c.id} className="h-full">
                  <CourseCard
                    course={{
                      slug: c.slug,
                      title: c.title,
                      subtitle: c.subtitle,
                      coverImage: c.coverImage,
                      level: c.level,
                      price: c.price,
                      durationHours: c.durationHours,
                      moduleCount: c.modulesCount,
                      rating: c.rating,
                      reviewCount: c.reviewsCount,
                      hasCertificate: c.hasCertificate,
                      hasProject: c.hasProject,
                      schoolName: c.primarySchool?.name ?? null,
                    }}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      {/* ═══════════════════════ ÉCOLES §9.5 ═══════════════════════ */}
      {schools.length > 0 && (
        <Section tone="muted" spacing="md">
          <Container>
            <SectionHeading
              align="center"
              eyebrow="Nos écoles"
              title="Explorez nos"
              gradient="domaines d'expertise"
              subtitle="Chaque école regroupe formations et parcours autour d'un domaine professionnel."
              className="mx-auto"
            />
            <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((s) => (
                <StaggerItem key={s.id} className="h-full">
                  <SchoolCard
                    school={{
                      slug: s.slug,
                      name: s.name,
                      tagline: s.tagline,
                      description: s.description,
                      color: s.color,
                      icon: s.icon,
                      coverImage: s.coverImage,
                      courseCount: s.coursesCount,
                      pathCount: s.careerPathsCount,
                      jobs: [],
                    }}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      {/* ═══════════════════════ FONCTIONNEMENT §9.6 ═══════════════════════ */}
      <Section tone="default" spacing="md">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Comment ça marche"
            title="De l'inscription au"
            gradient="certificat"
            subtitle="Un parcours d'apprentissage clair, en quatre étapes."
            className="mx-auto"
          />
          <div className="relative mt-14">
            {/* Ligne de progression dégradée (desktop) */}
            <span
              className="pointer-events-none absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-da opacity-30 lg:block"
              aria-hidden
            />
            <StaggerGroup className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <StaggerItem key={s.title} className="relative text-center">
                  <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-da text-white shadow-brand">
                    <s.icon size={24} />
                    <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-surface-primary bg-navy text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-navy">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
                    {s.text}
                  </p>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </Container>
      </Section>

      {/* ═══════════════════════ CERTIFICATIONS §9.8 ═══════════════════════ */}
      <Section tone="muted" spacing="md">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <SectionHeading
                eyebrow="Reconnaissance"
                title="Des certificats qui"
                gradient="ont de la valeur"
                subtitle="Selon votre programme, différents niveaux de reconnaissance attestent de vos compétences. Chaque certificat est vérifiable publiquement grâce à un QR code et un numéro unique."
              />
              <Link href="/certifications" className={buttonClasses({ variant: "outline", className: "mt-8" })}>
                En savoir plus sur les certifications
                <ArrowRight size={16} />
              </Link>
            </Reveal>
            <StaggerGroup className="grid gap-4 sm:grid-cols-2">
              {CERTIFICATION_LEVELS.map((c) => (
                <StaggerItem key={c.title}>
                  <div className="flex h-full flex-col rounded-xl border border-navy/[0.08] bg-surface-primary p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
                      <c.icon size={20} />
                    </span>
                    <h3 className="mt-4 font-display text-base font-bold text-navy">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{c.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </Container>
      </Section>

      {/* ═══════════════════════ TÉMOIGNAGES §9.9 ═══════════════════════ */}
      <Section tone="default" spacing="md">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Témoignages"
            title="Ils ont transformé leur"
            gradient="carrière"
            className="mx-auto"
          />
          <StaggerGroup className="mt-12 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <StaggerItem key={t.name} className="h-full">
                <figure className="flex h-full flex-col rounded-xl border border-navy/[0.08] bg-surface-secondary/60 p-7">
                  <Quote size={28} className="text-brand-blue-vif/40" aria-hidden />
                  <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} sur 5`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={15} className="fill-warning text-warning" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-text-primary">
                    « {t.quote} »
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-navy/[0.06] pt-4">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-da font-display text-sm font-bold text-white">
                      {t.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-display text-sm font-bold text-navy">{t.name}</span>
                      <span className="block text-xs text-text-secondary">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* ═══════════════════════ CTA FINAL §9.11 ═══════════════════════ */}
      <Section tone="default" spacing="md">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-surface-dark px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
            <span className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-violet opacity-30 blur-[100px]" aria-hidden />
            <span className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-cyan opacity-25 blur-[100px]" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <Badge variant="gradient" className="mb-5">
                <Sparkles size={13} />
                Prêt·e à commencer ?
              </Badge>
              <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Lancez votre montée en compétences dès aujourd'hui
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
                Créez votre compte gratuitement, explorez le catalogue ou découvrez nos offres
                pour les équipes.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/inscription" className={buttonClasses({ variant: "white", size: "lg" })}>
                  <Users size={18} />
                  S'inscrire gratuitement
                </Link>
                <Link href="/formations" className={buttonClasses({ size: "lg" })}>
                  Explorer le catalogue
                  <ArrowRight size={18} />
                </Link>
              </div>
              <Link
                href="/entreprises"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                <Building2 size={15} />
                Vous formez une équipe ? Découvrez l'offre entreprise
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
