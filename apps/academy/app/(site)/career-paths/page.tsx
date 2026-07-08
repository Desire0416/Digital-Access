import type { Metadata } from "next";
import { Section, Container, GradientText, SectionHeading, StaggerGroup, StaggerItem } from "@da/ui";
import { getCareerPaths } from "@/lib/queries";
import { CareerPathCardView } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Parcours métiers — Digital Access Academy",
  description:
    "Des parcours métiers structurés : Assistant IA, Développeur Front-End, Community Manager, Graphiste, Analyste Excel, Assistant Administratif. Projets, badges et certificats.",
  alternates: { canonical: "/career-paths" },
};

export default async function CareerPathsPage() {
  const paths = await getCareerPaths();

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Parcours métiers"
          title={<>Formez-vous à un <GradientText>métier recherché</GradientText></>}
          subtitle="Chaque parcours vous mène d'une ambition à un portfolio et un certificat vérifiable, par la pratique et les projets."
        />
        {paths.length > 0 ? (
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paths.map((p) => (
              <StaggerItem key={p.id}><CareerPathCardView path={p} /></StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <p className="mt-12 text-center text-text-muted">Les parcours métiers seront bientôt disponibles.</p>
        )}
      </Container>
    </Section>
  );
}
