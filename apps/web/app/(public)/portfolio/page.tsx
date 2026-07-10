import { Section, Container, GradientText } from "@da/ui";
import { getPublicPortfolio } from "@/lib/public-portfolio";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { PortfolioGallery } from "./PortfolioGallery";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Réalisations — Nos projets web & e-learning à Abidjan",
  description:
    "Découvrez les sites vitrines, e-commerce, plateformes institutionnelles et e-learning conçus par Digital Access pour des entreprises et institutions en Côte d'Ivoire.",
  path: "/portfolio",
  keywords: [
    "réalisations Digital Access",
    "portfolio agence web Abidjan",
    "création site web Côte d'Ivoire",
    "projets e-learning Abidjan",
    "site vitrine e-commerce Côte d'Ivoire",
    "études de cas web Abidjan",
  ],
});

export default async function PortfolioPage() {
  const portfolio = await getPublicPortfolio();
  return (
    <>
      <PageHero
        eyebrow="Réalisations"
        title={
          <>
            Des projets qui <GradientText>font la différence</GradientText>
          </>
        }
        description="Chaque réalisation raconte une ambition. Explorez une sélection de sites, applications et plateformes que nous avons conçus et livrés, du premier croquis à la mise en ligne."
      />

      <Section tone="muted">
        <Container>
          <PortfolioGallery items={portfolio} />
        </Container>
      </Section>

      <CTABanner
        title="Votre projet mérite la même exigence"
        description="Parlez-nous de votre idée. Nous transformons vos objectifs en une solution numérique sur-mesure, pensée pour votre marché."
        secondary={{ label: "Voir nos services", href: "/services" }}
      />
    </>
  );
}
