import type { Metadata } from "next";
import { Section, Container, GradientText, SectionHeading } from "@da/ui";
import { blogPosts } from "@da/db";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { BlogList, FeaturedPost } from "./BlogList";
import { NewsletterSignup } from "./NewsletterSignup";

export const metadata: Metadata = {
  title: "Blog — Ressources & conseils numériques",
  description:
    "Conseils, guides pratiques et actualités pour réussir votre présence en ligne en Côte d'Ivoire : sites web, Mobile Money, UX, formation et stratégie digitale.",
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={
          <>
            Ressources & <GradientText>conseils</GradientText>
          </>
        }
        description="Guides pratiques, retours d'expérience et actualités du numérique. On partage ici ce qui aide vraiment les entreprises et entrepreneurs ivoiriens à réussir en ligne."
      />

      {/* Article vedette */}
      {featured && (
        <Section spacing="sm">
          <Container>
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px flex-1 bg-navy/[0.08]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue-royal">
                À la une
              </span>
              <span className="h-px flex-1 bg-navy/[0.08]" />
            </div>
            <FeaturedPost post={featured} index={0} />
          </Container>
        </Section>
      )}

      {/* Grille + filtres */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Tous les articles"
            title={
              <>
                Explorez nos <GradientText>publications</GradientText>
              </>
            }
            subtitle="Filtrez par thématique pour trouver rapidement ce qui vous intéresse."
          />
          <div className="mt-12">
            <BlogList posts={rest.length > 0 ? rest : blogPosts} />
          </div>
        </Container>
      </Section>

      {/* Newsletter */}
      <NewsletterSignup />

      <CTABanner
        title="Un projet en tête après votre lecture ?"
        description="Passons de la théorie à la pratique. Parlons de vos objectifs et recevez un devis gratuit sous 48h."
        secondary={{ label: "Découvrir nos services", href: "/services" }}
      />
    </>
  );
}
