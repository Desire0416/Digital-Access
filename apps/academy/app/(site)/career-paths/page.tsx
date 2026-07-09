import type { Metadata } from "next";
import { Section, Container, GradientText, SectionHeading, StaggerGroup, StaggerItem } from "@da/ui";
import { getCareerPaths, getSchools } from "@/lib/queries";
import { CareerPathCardView } from "@/components/cards";
import { AdvancedCatalogueFilters } from "@/components/AdvancedCatalogueFilters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Parcours métiers — Digital Access Academy",
  description:
    "Des parcours métiers structurés : Assistant IA, Développeur Front-End, Community Manager, Graphiste, Analyste Excel, Assistant Administratif. Projets, badges et certificats.",
  alternates: { canonical: "/career-paths" },
};

type SearchParams = Promise<{ school?: string; level?: string; q?: string; price?: "free" | "paid"; sort?: string }>;

export default async function CareerPathsPage({ searchParams }: { searchParams: SearchParams }) {
  const { school, level, q, price, sort } = await searchParams;
  const [paths, schools] = await Promise.all([
    getCareerPaths({ schoolSlug: school, level, search: q, price, sort: sort as never }),
    getSchools(),
  ]);
  const filtering = Boolean(school || level || q || price);

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Parcours métiers"
          title={<>Formez-vous à un <GradientText>métier recherché</GradientText></>}
          subtitle="Chaque parcours vous mène d'une ambition à un portfolio et un certificat vérifiable, par la pratique et les projets."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[17rem_1fr] lg:items-start">
          <AdvancedCatalogueFilters schools={schools} basePath="/career-paths" total={paths.length} itemLabel="parcours" />

          <div>
            <p className="mb-6 text-sm text-text-muted">
              <span className="font-semibold text-navy">{paths.length}</span> parcours
              {filtering ? " correspondant à votre recherche" : " disponibles"}
            </p>

            {paths.length > 0 ? (
              <StaggerGroup className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paths.map((p) => (
                  <StaggerItem key={p.id}><CareerPathCardView path={p} /></StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <div className="rounded-2xl border border-navy/10 bg-surface-secondary/60 px-6 py-16 text-center">
                <p className="font-display text-lg font-semibold text-navy">Aucun parcours ne correspond</p>
                <p className="mt-2 text-sm text-text-muted">
                  {filtering
                    ? "Essayez d'élargir votre recherche ou de réinitialiser les filtres."
                    : "Les parcours métiers seront bientôt disponibles."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
