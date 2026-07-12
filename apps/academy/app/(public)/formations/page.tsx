import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { Container, StaggerGroup } from "@da/ui";
import type { CourseLevel } from "@da/academy-db/client";
import { getCourses, getSchools, type CourseSort } from "@/lib/catalogue";
import { getAcquiredCourseIds } from "@/lib/learn-queries";
import { currentUser } from "@/lib/guards";
import { siteConfig } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/EmptyState";
import { CourseCard } from "@/components/cards";
import { FiltersBar } from "./FiltersBar";

/* ══════════════════════════════════════════════════════════════════════════
   Catalogue des formations (cahier §10) — recherche + filtres URL, grille en
   cascade, état vide brandé. Server Component : relit les searchParams et
   re-requête à chaque changement d'URL piloté par la barre de filtres.
   ══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Formations — Apprenez une compétence",
  description:
    "Explorez le catalogue Access Academy : formations certifiantes en développement, data, design et marketing. Filtrez par école, niveau et tarif.",
  alternates: { canonical: `${siteConfig.url}/formations` },
  openGraph: {
    title: "Formations Access Academy",
    description: "Apprenez une compétence numérique concrète, projet à l'appui, et obtenez un certificat vérifiable.",
    url: `${siteConfig.url}/formations`,
    type: "website",
  },
};

const VALID_LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const VALID_SORTS: CourseSort[] = ["recent", "popular", "rating", "price-asc", "price-desc", "title"];

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function FormationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const q = one(sp.q)?.trim() || undefined;
  const schoolSlug = one(sp.ecole) || undefined;
  const levelRaw = one(sp.level);
  const level = levelRaw && VALID_LEVELS.includes(levelRaw as CourseLevel) ? (levelRaw as CourseLevel) : undefined;
  const priceRaw = one(sp.price);
  const price = priceRaw === "free" || priceRaw === "paid" ? priceRaw : undefined;
  const sortRaw = one(sp.sort);
  const sort = sortRaw && VALID_SORTS.includes(sortRaw as CourseSort) ? (sortRaw as CourseSort) : undefined;

  const [courses, schools, user] = await Promise.all([
    getCourses({ q, schoolSlug, level, price, sort }),
    getSchools(),
    currentUser(),
  ]);

  const acquired = user ? await getAcquiredCourseIds(user.id) : new Set<string>();

  return (
    <div className="pb-24">
      {/* ── En-tête ── */}
      <section className="relative overflow-hidden border-b border-navy/[0.06] bg-surface-secondary/60">
        <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-da opacity-[0.08] blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4]" aria-hidden />
        <Container className="relative py-12 sm:py-16">
          <SectionHeading
            eyebrow="Catalogue"
            title="Toutes nos"
            gradient="formations"
            subtitle="Apprenez une compétence numérique concrète, mise en pratique par un projet et validée par un certificat vérifiable."
          />
        </Container>
      </section>

      <Container className="relative">
        {/* ── Barre de filtres sticky ── */}
        <div className="pt-5 sm:pt-6">
          <FiltersBar
            schools={schools.map((s) => ({ slug: s.slug, name: s.name }))}
            resultCount={courses.length}
          />
        </div>

        {/* ── Grille / état vide ── */}
        <div className="mt-8">
          {courses.length === 0 ? (
            <EmptyState
              icon={<GraduationCap size={44} className="text-brand-blue-royal/40" />}
              title="Aucune formation ne correspond"
              description="Ajustez votre recherche ou réinitialisez les filtres pour explorer l'ensemble du catalogue."
              action={{ label: "Voir tout le catalogue", href: "/formations" }}
            />
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
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
                    acquired: acquired.has(c.id),
                  }}
                />
              ))}
            </StaggerGroup>
          )}
        </div>
      </Container>
    </div>
  );
}
