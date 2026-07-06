import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Section,
  Container,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  Reveal,
  IconBadge,
  GradientText,
  buttonClasses,
} from "@da/ui";
import { stats, testimonials, portfolio } from "@da/db";
import { servicePacks, whyChoose, processSteps } from "@/lib/content";
import { HeroHome } from "@/components/HeroHome";
import { StatsBand } from "@/components/StatsBand";
import { ServiceCard } from "@/components/ServiceCard";
import { PortfolioCard } from "@/components/PortfolioCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { CTABanner } from "@/components/CTABanner";
import { AcademyPromo } from "@/components/AcademyPromo";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Agence web & e-learning en Côte d'Ivoire",
  description:
    "Digital Access conçoit sites vitrines, e-commerce, plateformes e-learning et applications sur-mesure à Abidjan. Paiement Mobile Money, design soigné et accompagnement local.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const homeServices = servicePacks.slice(0, 3);
  const featuredWork = portfolio.filter((p) => p.featured).slice(0, 3);
  const featuredTestimonials = testimonials.filter((t) => t.featured).slice(0, 3);

  return (
    <>
      <HeroHome />

      <StatsBand stats={stats} />

      {/* Services */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Nos services"
            title={
              <>
                Des solutions pour <GradientText>chaque ambition</GradientText>
              </>
            }
            subtitle="Du simple site vitrine à la plateforme e-learning complète, nous vous accompagnons à chaque étape de votre présence numérique."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {homeServices.map((pack) => (
              <StaggerItem key={pack.id}>
                <ServiceCard pack={pack} />
              </StaggerItem>
            ))}
          </StaggerGroup>
          <Reveal className="mt-10 text-center">
            <Link href="/services" className={buttonClasses({ variant: "outline", size: "md" })}>
              Voir tous les services
              <ArrowRight size={17} />
            </Link>
          </Reveal>
        </Container>
      </Section>

      {/* Pourquoi nous */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionHeading
              align="left"
              eyebrow="Pourquoi Digital Access"
              title={
                <>
                  Un partenaire qui pense{" "}
                  <GradientText>votre réussite</GradientText>
                </>
              }
              subtitle="Nous ne livrons pas seulement du code : nous construisons des outils qui servent réellement votre activité."
            />
            <StaggerGroup className="grid gap-5 sm:grid-cols-2">
              {whyChoose.map((f) => (
                <StaggerItem
                  key={f.title}
                  className="rounded-xl border border-navy/[0.07] bg-surface-primary p-6 transition-shadow hover:shadow-lg"
                >
                  <IconBadge tone="soft">
                    <Icon name={f.icon} size={22} />
                  </IconBadge>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {f.description}
                  </p>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </Container>
      </Section>

      {/* Process */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Notre méthode"
            title={
              <>
                De l'idée à la <GradientText>mise en ligne</GradientText>
              </>
            }
            subtitle="Un processus clair et rassurant, pensé pour vous garder informé et impliqué à chaque étape."
          />
          <StaggerGroup className="relative mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <StaggerItem key={step.number} className="relative">
                <span className="font-display text-5xl font-extrabold text-gradient-da">
                  {step.number}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Réalisations */}
      <Section>
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              align="left"
              eyebrow="Réalisations"
              title={
                <>
                  Nos derniers <GradientText>projets</GradientText>
                </>
              }
              className="max-w-xl"
            />
            <Reveal>
              <Link
                href="/portfolio"
                className={buttonClasses({ variant: "ghost", size: "md" })}
              >
                Tout voir
                <ArrowRight size={17} />
              </Link>
            </Reveal>
          </div>
          <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredWork.map((item, i) => (
              <StaggerItem key={item.id}>
                <PortfolioCard item={item} index={i} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Academy */}
      <AcademyPromo />

      {/* Témoignages */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Ils nous font confiance"
            title={
              <>
                Ce que disent <GradientText>nos clients</GradientText>
              </>
            }
            subtitle="La satisfaction de nos clients est notre plus belle réalisation."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredTestimonials.map((t) => (
              <StaggerItem key={t.id}>
                <TestimonialCard testimonial={t} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      <CTABanner secondary={{ label: "Découvrir Academy", href: "/academy" }} />
    </>
  );
}
