import {
  Section,
  Container,
  SectionHeading,
  GradientText,
  StaggerGroup,
  StaggerItem,
  IconBadge,
  Reveal,
} from "@da/ui";
import { stats } from "@da/db";
import { values, processSteps } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { StatsBand } from "@/components/StatsBand";
import { CTABanner } from "@/components/CTABanner";
import { Icon } from "@/components/Icon";
import { AboutStory } from "./AboutStory";
import { FounderCard } from "./FounderCard";
import { Timeline } from "./Timeline";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "À propos — Digital Access | Agence numérique à Abidjan",
  description:
    "Découvrez Digital Access : notre histoire, notre mission et nos valeurs. Une agence numérique ivoirienne qui conçoit des sites, applications et plateformes e-learning sur-mesure, ancrée à Abidjan.",
  path: "/a-propos",
  keywords: [
    "Digital Access",
    "agence numérique Abidjan",
    "agence web Côte d'Ivoire",
    "à propos Digital Access",
    "développement web sur-mesure Abidjan",
    "entreprise digitale ivoirienne",
  ],
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="À propos"
        title={
          <>
            Nous rendons le numérique{" "}
            <GradientText>accessible à tous</GradientText>
          </>
        }
        description="Digital Access est une agence ivoirienne animée par une conviction simple : un site ou une plateforme n'a de valeur que s'il sert réellement votre activité. Voici qui nous sommes."
      />

      {/* Histoire / Mission / Vision */}
      <Section spacing="lg">
        <Container>
          <AboutStory />
        </Container>
      </Section>

      {/* Chiffres clés */}
      <StatsBand stats={stats} />

      {/* Valeurs */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Nos valeurs"
            title={
              <>
                Ce qui nous <GradientText>anime</GradientText> chaque jour
              </>
            }
            subtitle="Quatre principes guident chacune de nos décisions, du premier échange jusqu'à la livraison de votre projet."
          />
          <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <StaggerItem
                key={value.title}
                className="group rounded-xl border border-navy/[0.07] bg-surface-primary p-6 transition-shadow hover:shadow-lg"
              >
                <IconBadge tone="gradient" size="lg">
                  <Icon name={value.icon} size={24} />
                </IconBadge>
                <h3 className="mt-5 font-display text-lg font-bold text-navy">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {value.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Fondateur */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Le fondateur"
            title={
              <>
                Une vision, portée par{" "}
                <GradientText>une équipe</GradientText>
              </>
            }
            subtitle="Derrière Digital Access, une histoire personnelle et une ambition collective pour le numérique ivoirien."
            className="mb-12"
          />
          <FounderCard />
        </Container>
      </Section>

      {/* Parcours / Timeline */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Notre parcours"
            title={
              <>
                Les étapes de <GradientText>notre aventure</GradientText>
              </>
            }
            subtitle="Depuis notre création à Abidjan, chaque année a marqué une nouvelle étape dans notre engagement pour un numérique accessible."
          />
          <div className="mt-16">
            <Timeline />
          </div>
        </Container>
      </Section>

      {/* Méthode */}
      <Section>
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
          <StaggerGroup className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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

          <Reveal className="mt-14 text-center text-sm text-text-secondary">
            Une question sur notre façon de travailler ?{" "}
            <a
              href="/contact"
              className="font-semibold text-brand-blue-royal underline-offset-4 hover:underline"
            >
              Parlons-en
            </a>
            .
          </Reveal>
        </Container>
      </Section>

      <CTABanner
        title="Construisons ensemble votre présence numérique"
        description="Vous avez un projet, une idée ou simplement une envie d'avancer ? Discutons-en autour d'un devis gratuit et sans engagement."
        secondary={{ label: "Découvrir Academy", href: "/academy" }}
      />
    </>
  );
}
