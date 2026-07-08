import type { Metadata } from "next";
import { Section, Container, GradientText, SectionHeading, StaggerGroup, StaggerItem } from "@da/ui";
import { getSchools } from "@/lib/queries";
import { SchoolCardView } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Les écoles — Digital Access Academy",
  description:
    "Huit écoles de compétences : Intelligence Artificielle, Développement, Marketing, Design, Data, Productivité, Cybersécurité et Entrepreneuriat.",
  alternates: { canonical: "/schools" },
};

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Nos écoles"
          title={<>Choisissez votre <GradientText>domaine de compétences</GradientText></>}
          subtitle="Chaque école regroupe des parcours métiers et des formations courtes autour d'un grand domaine du numérique."
        />
        {schools.length > 0 ? (
          <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((s) => (
              <StaggerItem key={s.id}>
                <SchoolCardView school={s} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <p className="mt-12 text-center text-text-muted">Les écoles seront bientôt disponibles.</p>
        )}
      </Container>
    </Section>
  );
}
