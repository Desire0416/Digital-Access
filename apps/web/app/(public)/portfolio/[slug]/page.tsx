import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Section,
  Container,
  SectionHeading,
  GradientText,
  Badge,
  Divider,
  IconBadge,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from "@da/ui";
import { portfolio, testimonials } from "@da/db";
import { CTABanner } from "@/components/CTABanner";
import { PortfolioCard } from "@/components/PortfolioCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { Icon } from "@/components/Icon";
import { DetailHero } from "./DetailHero";

// Points forts génériques par catégorie, pour enrichir la page détail.
const highlights = [
  {
    icon: "target",
    title: "Objectif atteint",
    description:
      "Une solution pensée pour répondre précisément aux besoins du client et de ses utilisateurs.",
  },
  {
    icon: "zap",
    title: "Performance & rapidité",
    description:
      "Chargement optimisé pour les connexions mobiles 3G/4G, courantes en Côte d'Ivoire.",
  },
  {
    icon: "smartphone",
    title: "100% responsive",
    description:
      "Une expérience impeccable du smartphone au grand écran, sans compromis.",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = portfolio.find((p) => p.slug === slug);

  if (!item) {
    return {
      title: "Réalisation introuvable",
      description: "Cette réalisation n'existe pas ou a été déplacée.",
    };
  }

  return {
    title: `${item.title} — Réalisation ${item.category}`,
    description: item.description,
    openGraph: {
      title: item.title,
      description: item.description,
      type: "article",
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = portfolio.findIndex((p) => p.slug === slug);
  const item = index >= 0 ? portfolio[index] : undefined;

  if (!item) {
    notFound();
  }

  const relatedTestimonial = item.testimonial
    ? testimonials.find((t) => t.id === item.testimonial)
    : undefined;

  const relatedProjects = portfolio
    .filter((p) => p.slug !== item.slug && p.category === item.category)
    .slice(0, 3);

  return (
    <>
      <DetailHero item={item} index={index} />

      {/* Aperçu du projet */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            {/* Description */}
            <Reveal>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue-royal">
                Aperçu du projet
              </span>
              <Divider className="mt-4" />
              <p className="mt-6 text-lg leading-relaxed text-navy/80">
                {item.description}
              </p>
              <p className="mt-4 leading-relaxed text-text-secondary">
                Comme pour chacun de nos projets, nous avons accompagné{" "}
                <span className="font-semibold text-navy">{item.client}</span> de la
                définition du besoin jusqu'à la mise en ligne, en soignant autant
                l'expérience utilisateur que la robustesse technique. Le résultat :
                un {item.type.toLowerCase()} fiable, élégant et pensé pour durer.
              </p>
            </Reveal>

            {/* Fiche technique */}
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-navy/[0.07] bg-surface-secondary p-7">
                <h2 className="font-display text-lg font-bold text-navy">
                  Fiche technique
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-navy/[0.06] pb-4">
                    <dt className="text-text-secondary">Client</dt>
                    <dd className="text-right font-semibold text-navy">
                      {item.client}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-navy/[0.06] pb-4">
                    <dt className="text-text-secondary">Type de projet</dt>
                    <dd className="text-right font-semibold text-navy">
                      {item.type}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-navy/[0.06] pb-4">
                    <dt className="text-text-secondary">Catégorie</dt>
                    <dd className="text-right font-semibold text-navy">
                      {item.category}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-text-secondary">Année</dt>
                    <dd className="text-right font-semibold text-navy">
                      {item.year}
                    </dd>
                  </div>
                </dl>

                {/* Technologies */}
                <div className="mt-6 border-t border-navy/[0.06] pt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">
                    Technologies
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.technologies.map((tech) => (
                      <Badge key={tech} variant="soft">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Points forts */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Ce que ce projet démontre"
            title={
              <>
                Une exécution <GradientText>soignée</GradientText>
              </>
            }
            subtitle="Au-delà du design, chaque réalisation repose sur des fondations solides."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
            {highlights.map((h) => (
              <StaggerItem
                key={h.title}
                className="rounded-xl border border-navy/[0.07] bg-surface-primary p-6 transition-shadow hover:shadow-lg"
              >
                <IconBadge tone="gradient">
                  <Icon name={h.icon} size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">
                  {h.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {h.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Témoignage lié */}
      {relatedTestimonial && (
        <Section>
          <Container size="lg">
            <SectionHeading
              eyebrow="Le mot du client"
              title={
                <>
                  Ils en parlent <GradientText>mieux que nous</GradientText>
                </>
              }
            />
            <Reveal className="mx-auto mt-12 max-w-2xl">
              <TestimonialCard testimonial={relatedTestimonial} />
            </Reveal>
          </Container>
        </Section>
      )}

      {/* Projets similaires */}
      {relatedProjects.length > 0 && (
        <Section tone={relatedTestimonial ? "muted" : "default"}>
          <Container>
            <SectionHeading
              align="left"
              eyebrow="Dans la même veine"
              title={
                <>
                  D'autres <GradientText>réalisations {item.category}</GradientText>
                </>
              }
              className="max-w-xl"
            />
            <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map((related, i) => (
                <StaggerItem key={related.id}>
                  <PortfolioCard item={related} index={i} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      <CTABanner
        title="Un projet similaire en tête ?"
        description="Discutons de votre besoin. Nous vous remettons un devis gratuit et sans engagement sous 48h."
        secondary={{ label: "Voir toutes les réalisations", href: "/portfolio" }}
      />
    </>
  );
}
