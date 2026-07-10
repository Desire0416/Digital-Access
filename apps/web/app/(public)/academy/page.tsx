import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Section,
  Container,
  SectionHeading,
  GradientText,
  StaggerGroup,
  StaggerItem,
  Reveal,
  buttonClasses,
} from "@da/ui";
import { categories, featuredCourses } from "@da/db";
import { siteConfig } from "@/lib/site";
import { CourseCard } from "@/components/CourseCard";
import { AcademyHero } from "./AcademyHero";
import { CategoryGrid } from "./CategoryGrid";
import { HowItWorks } from "./HowItWorks";
import { AdvantagesBand } from "./AdvantagesBand";
import { AcademyCTA } from "./AcademyCTA";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Access Academy — Formations numériques en ligne en Côte d'Ivoire",
  description:
    "Découvrez Access Academy, la plateforme e-learning de Digital Access. Développement web, design, marketing digital et data : formez-vous aux métiers du numérique en Côte d'Ivoire, à votre rythme, avec certificats vérifiables et paiement Mobile Money.",
  path: "/academy",
  keywords: [
    "Access Academy",
    "formation en ligne Côte d'Ivoire",
    "formation numérique Abidjan",
    "e-learning développement web Abidjan",
    "formation marketing digital Côte d'Ivoire",
    "cours en ligne certifiants Abidjan",
  ],
});

export default function AcademyLandingPage() {
  return (
    <>
      <AcademyHero />

      {/* Catégories */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Domaines de formation"
            title={
              <>
                Explorez nos <GradientText>catégories</GradientText>
              </>
            }
            subtitle="Des parcours pensés pour le marché ivoirien, du premier pas jusqu'à l'expertise. Choisissez le domaine qui fera avancer votre carrière."
          />
          <CategoryGrid categories={categories} />
          <Reveal className="mt-12 text-center">
            <a
              href={`${siteConfig.academyUrl}/courses`}
              className={buttonClasses({ variant: "outline", size: "md" })}
            >
              Voir toutes les formations
              <ArrowRight size={17} />
            </a>
          </Reveal>
        </Container>
      </Section>

      {/* Cours vedettes */}
      <Section>
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              align="left"
              eyebrow="Cours vedettes"
              title={
                <>
                  Les formations les plus <GradientText>suivies</GradientText>
                </>
              }
              subtitle="Une sélection de cours plébiscités par notre communauté d'apprenants."
              className="max-w-xl"
            />
            <Reveal>
              <a
                href={siteConfig.academyUrl}
                className={buttonClasses({ variant: "ghost", size: "md" })}
              >
                Explorer le catalogue
                <ArrowRight size={17} />
              </a>
            </Reveal>
          </div>
          <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredCourses.map((course, i) => (
              <StaggerItem key={course.id}>
                <CourseCard course={course} index={i} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Comment ça marche */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Comment ça marche"
            title={
              <>
                Apprendre n'a jamais été aussi{" "}
                <GradientText>simple</GradientText>
              </>
            }
            subtitle="Quatre étapes pour passer de la curiosité à la compétence, sans quitter votre téléphone."
          />
          <HowItWorks />
        </Container>
      </Section>

      {/* Avantages */}
      <AdvantagesBand />

      {/* CTA final vers Academy */}
      <AcademyCTA />

      {/* Retour site DA */}
      <Section tone="default" spacing="sm">
        <Container>
          <Reveal className="text-center text-sm text-text-secondary">
            Besoin d'une plateforme e-learning sur-mesure pour votre organisation ?{" "}
            <Link
              href="/services#elearning"
              className="font-semibold text-brand-blue-royal underline-offset-4 hover:underline"
            >
              Découvrez nos solutions
            </Link>
            .
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
