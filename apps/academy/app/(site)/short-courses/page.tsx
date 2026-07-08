import type { Metadata } from "next";
import { Section, Container, GradientText, SectionHeading, StaggerGroup, StaggerItem } from "@da/ui";
import { getShortCourses } from "@/lib/queries";
import { ShortCourseCardView } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Formations courtes — Digital Access Academy",
  description:
    "Des formations courtes pour découvrir un domaine, apprendre une compétence rapide ou préparer un parcours métier : IA, Canva, Excel, HTML, freelancing…",
  alternates: { canonical: "/short-courses" },
};

export default async function ShortCoursesPage() {
  const courses = await getShortCourses();

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Formations courtes"
          title={<>Apprenez une <GradientText>compétence rapide</GradientText></>}
          subtitle="Idéales pour découvrir un domaine, monter en compétence sur un outil précis ou préparer un parcours métier."
        />
        {courses.length > 0 ? (
          <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <StaggerItem key={c.id}><ShortCourseCardView course={c} /></StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <p className="mt-12 text-center text-text-muted">Les formations courtes seront bientôt disponibles.</p>
        )}
      </Container>
    </Section>
  );
}
