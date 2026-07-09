import type { Metadata } from "next";
import { Section, Container, GradientText, SectionHeading, StaggerGroup, StaggerItem } from "@da/ui";
import { getShortCourses, getSchools } from "@/lib/queries";
import { ShortCourseCardView } from "@/components/cards";
import { AdvancedCatalogueFilters } from "@/components/AdvancedCatalogueFilters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Formations courtes — Digital Access Academy",
  description:
    "Des formations courtes pour découvrir un domaine, apprendre une compétence rapide ou préparer un parcours métier : IA, Canva, Excel, HTML, freelancing…",
  alternates: { canonical: "/short-courses" },
};

type SearchParams = Promise<{ school?: string; level?: string; q?: string; price?: "free" | "paid"; sort?: string }>;

export default async function ShortCoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const { school, level, q, price, sort } = await searchParams;
  const [courses, schools] = await Promise.all([
    getShortCourses({ schoolSlug: school, level, search: q, price, sort: sort as never }),
    getSchools(),
  ]);
  const filtering = Boolean(school || level || q || price);

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Formations courtes"
          title={<>Apprenez une <GradientText>compétence rapide</GradientText></>}
          subtitle="Idéales pour découvrir un domaine, monter en compétence sur un outil précis ou préparer un parcours métier."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[17rem_1fr] lg:items-start">
          <AdvancedCatalogueFilters schools={schools} basePath="/short-courses" total={courses.length} itemLabel="formations" />

          <div>
            <p className="mb-6 text-sm text-text-muted">
              <span className="font-semibold text-navy">{courses.length}</span> formation{courses.length > 1 ? "s" : ""}
              {filtering ? " correspondant à votre recherche" : " disponibles"}
            </p>

            {courses.length > 0 ? (
              <StaggerGroup className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((c) => (
                  <StaggerItem key={c.id}><ShortCourseCardView course={c} /></StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <div className="rounded-2xl border border-navy/10 bg-surface-secondary/60 px-6 py-16 text-center">
                <p className="font-display text-lg font-semibold text-navy">Aucune formation ne correspond</p>
                <p className="mt-2 text-sm text-text-muted">
                  {filtering
                    ? "Essayez d'élargir votre recherche ou de réinitialiser les filtres."
                    : "Les formations courtes seront bientôt disponibles."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
