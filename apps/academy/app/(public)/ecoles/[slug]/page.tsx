import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  ChevronRight,
  GraduationCap,
  Route,
  BookOpen,
  Briefcase,
  Code2,
  Database,
  BarChart3,
  LineChart,
  Palette,
  PenTool,
  Megaphone,
  ShieldCheck,
  Cpu,
  Globe,
  Layers,
  Info,
} from "lucide-react";
import { Container, Badge, StaggerGroup, Reveal } from "@da/ui";
import { getSchoolDetail } from "@/lib/catalogue";
import { getAcquiredCourseIds } from "@/lib/learn-queries";
import { currentUser } from "@/lib/guards";
import { siteConfig } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";
import { CourseCard, CareerPathCard } from "@/components/cards";

/* ══════════════════════════════════════════════════════════════════════════
   Fiche école (cahier §14.3-14.5) — identité visuelle (couleur), description,
   métiers préparés, PARCOURS rattachés puis FORMATIONS rattachées. Les contenus
   sont affichés PAR RELATION (jamais dupliqués) ; une formation également
   proposée dans une autre école le signale explicitement.
   ══════════════════════════════════════════════════════════════════════════ */

const SCHOOL_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  "graduation-cap": GraduationCap,
  code: Code2,
  database: Database,
  "bar-chart": BarChart3,
  "line-chart": LineChart,
  palette: Palette,
  "pen-tool": PenTool,
  megaphone: Megaphone,
  shield: ShieldCheck,
  cpu: Cpu,
  globe: Globe,
  briefcase: Briefcase,
  book: BookOpen,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const school = await getSchoolDetail(slug);
  if (!school) return { title: "École introuvable" };
  const desc = school.tagline ?? school.description.slice(0, 160);
  const url = `${siteConfig.url}/ecoles/${school.slug}`;
  return {
    title: `${school.name} — École Access Academy`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: school.name,
      description: desc,
      url,
      type: "website",
      ...(school.coverImage ? { images: [{ url: school.coverImage }] } : {}),
    },
  };
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await getSchoolDetail(slug);
  if (!school) notFound();

  const user = await currentUser();
  const acquired = user ? await getAcquiredCourseIds(user.id) : new Set<string>();

  const Icon = SCHOOL_ICONS[school.icon] ?? GraduationCap;

  return (
    <div className="pb-24">
      {/* ══════════════════ Hero identité de l'école ══════════════════ */}
      <section className="relative overflow-hidden bg-navy text-white">
        {/* Halo à la couleur d'identité de l'école */}
        <span
          className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ backgroundColor: school.color }}
          aria-hidden
        />
        <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        {school.coverImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={school.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
            <span className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/70" aria-hidden />
          </>
        )}

        <Container className="relative py-10 sm:py-14">
          {/* Fil d'Ariane */}
          <nav aria-label="Fil d'Ariane" className="mb-6 flex items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-white">
              <Home size={13} aria-hidden />
              Accueil
            </Link>
            <ChevronRight size={13} aria-hidden />
            <Link href="/ecoles" className="transition-colors hover:text-white">
              Écoles
            </Link>
            <ChevronRight size={13} aria-hidden />
            <span className="truncate text-white/80">{school.name}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Emblème coloré */}
            <span
              className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl text-white shadow-brand"
              style={{ background: `linear-gradient(135deg, ${school.color}, ${school.color}bb)` }}
              aria-hidden
            >
              <Icon size={38} />
            </span>

            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                {school.name}
              </h1>
              {school.tagline && (
                <p className="mt-2 text-lg font-semibold" style={{ color: school.color }}>
                  {school.tagline}
                </p>
              )}
              <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">{school.description}</p>

              {/* Compteurs */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <Route size={15} aria-hidden />
                  <span className="font-semibold text-white">{school.careerPaths.length}</span> parcours métier
                  {school.careerPaths.length > 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={15} aria-hidden />
                  <span className="font-semibold text-white">{school.courses.length}</span> formation
                  {school.courses.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Métiers préparés */}
              {school.jobs.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Métiers préparés</p>
                  <div className="flex flex-wrap gap-2">
                    {school.jobs.map((job) => (
                      <span
                        key={job}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm"
                      >
                        <Briefcase size={12} className="text-brand-cyan" aria-hidden />
                        {job}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="relative space-y-16 py-12 sm:py-16">
        {/* ══════════════════ Parcours rattachés ══════════════════ */}
        {school.careerPaths.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Devenir professionnel"
              title="Les parcours"
              gradient="métiers"
              subtitle="Des itinéraires complets pour vous préparer à un métier, du niveau d'entrée jusqu'au poste visé."
            />
            <StaggerGroup className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {school.careerPaths.map((p) => (
                <CareerPathCard
                  key={p.id}
                  path={{
                    slug: p.slug,
                    title: p.title,
                    targetJob: p.targetJob,
                    coverImage: p.coverImage,
                    schoolName: null,
                    duration: p.duration,
                    courseCount: p.coursesCount,
                    projectCount: p.projectsCount,
                    entryLevel: p.entryLevel,
                    exitLevel: p.exitLevel,
                    certificationTitle: p.certificationTitle,
                    price: p.price,
                  }}
                />
              ))}
            </StaggerGroup>
          </section>
        )}

        {/* ══════════════════ Formations rattachées ══════════════════ */}
        {school.courses.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Apprendre une compétence"
              title="Les"
              gradient="formations"
              subtitle="Des formations certifiantes, chacune validée par un projet concret. Une formation acquise compte pour chaque parcours qui l'inclut — jamais payée deux fois."
            />
            <StaggerGroup className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {school.courses.map((c) => (
                <div key={c.id} className="flex flex-col gap-2">
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
                      schoolName: null,
                      acquired: acquired.has(c.id),
                    }}
                  />
                  {/* Rattachement multiple sans duplication (§14.4-14.5) */}
                  {c.otherSchools.length > 0 && (
                    <p className="flex items-start gap-1.5 px-1 text-[11px] leading-relaxed text-text-muted">
                      <Info size={12} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                      <span>
                        Également proposée dans{" "}
                        {c.otherSchools.map((s, i) => (
                          <span key={s.slug}>
                            {i > 0 && ", "}
                            <Link
                              href={`/ecoles/${s.slug}`}
                              className="relative z-20 font-semibold text-brand-blue-royal underline-offset-2 hover:underline"
                            >
                              {s.name}
                            </Link>
                          </span>
                        ))}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </StaggerGroup>
          </section>
        )}

        {/* État vide global */}
        {school.careerPaths.length === 0 && school.courses.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy/[0.12] bg-surface-secondary/50 px-6 py-14 text-center">
            <Layers size={44} className="mb-4 opacity-30" style={{ color: school.color }} aria-hidden />
            <h3 className="font-display text-lg font-bold text-navy">Contenus bientôt disponibles</h3>
            <p className="mt-1.5 max-w-sm text-sm text-text-secondary">
              Cette école enrichit actuellement son catalogue de formations et de parcours.
            </p>
            <Link
              href="/formations"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand"
            >
              Explorer tout le catalogue
              <ChevronRight size={15} aria-hidden />
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
