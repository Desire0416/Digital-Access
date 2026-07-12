import type { Metadata } from "next";
import { Route } from "lucide-react";
import { Container, StaggerGroup } from "@da/ui";
import type { CourseLevel } from "@da/academy-db/client";
import { getCareerPaths, getSchools } from "@/lib/catalogue";
import { siteConfig } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/EmptyState";
import { CareerPathCard } from "@/components/cards";
import { PathFilters } from "./PathFilters";

/* ══════════════════════════════════════════════════════════════════════════
   Catalogue des parcours métiers (cahier §13.2) — grille CareerPathCard,
   recherche + filtres légers pilotés par l'URL. Server Component.
   ══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Parcours métiers — Préparez-vous à un métier",
  description:
    "Suivez un parcours métier structuré : enchaînez les formations, réalisez des projets et décrochez une certification métier. Vos acquis sont reconnus — vous ne payez jamais deux fois une formation.",
  alternates: { canonical: `${siteConfig.url}/parcours-metiers` },
  openGraph: {
    title: "Parcours métiers Access Academy",
    description:
      "Un itinéraire complet, du niveau d'entrée au métier visé : formations, projets, certification. Reconnaissance des acquis intégrée.",
    url: `${siteConfig.url}/parcours-metiers`,
    type: "website",
  },
};

const VALID_LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CareerPathsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const q = one(sp.q)?.trim() || undefined;
  const schoolSlug = one(sp.ecole) || undefined;
  const levelRaw = one(sp.level);
  const entryLevel =
    levelRaw && VALID_LEVELS.includes(levelRaw as CourseLevel) ? (levelRaw as CourseLevel) : undefined;

  const [paths, schools] = await Promise.all([
    getCareerPaths({ q, schoolSlug, entryLevel }),
    getSchools(),
  ]);

  return (
    <div className="pb-24">
      {/* ── En-tête ── */}
      <section className="relative overflow-hidden border-b border-navy/[0.06] bg-surface-secondary/60">
        <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-da opacity-[0.08] blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4]" aria-hidden />
        <Container className="relative py-12 sm:py-16">
          <SectionHeading
            eyebrow="Parcours métiers"
            title="Préparez-vous à un"
            gradient="métier"
            subtitle="Un itinéraire complet du niveau d'entrée jusqu'au poste visé : des formations enchaînées, des projets concrets et une certification métier. Vos acquis sont reconnus — jamais payés deux fois."
          />
        </Container>
      </section>

      <Container className="relative">
        {/* ── Barre de filtres sticky ── */}
        <div className="pt-5 sm:pt-6">
          <PathFilters
            schools={schools.map((s) => ({ slug: s.slug, name: s.name }))}
            resultCount={paths.length}
          />
        </div>

        {/* ── Grille / état vide ── */}
        <div className="mt-8">
          {paths.length === 0 ? (
            <EmptyState
              icon={<Route size={44} className="text-brand-violet/40" />}
              title="Aucun parcours ne correspond"
              description="Ajustez votre recherche ou réinitialisez les filtres pour explorer tous les parcours métiers."
              action={{ label: "Voir tous les parcours", href: "/parcours-metiers" }}
            />
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paths.map((p) => (
                <CareerPathCard
                  key={p.id}
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
              ))}
            </StaggerGroup>
          )}
        </div>
      </Container>
    </div>
  );
}
