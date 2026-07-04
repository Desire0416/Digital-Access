import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  Section,
  Container,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  Reveal,
  GradientText,
  IconBadge,
  Badge,
  buttonClasses,
  cn,
} from "@da/ui";
import { servicePacks, whyChoose, processSteps } from "@/lib/content";
import { ServiceCard } from "@/components/ServiceCard";
import { CTABanner } from "@/components/CTABanner";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Sites vitrines, plateformes institutionnelles, e-learning et maintenance : découvrez les packs Digital Access pour donner vie à votre présence numérique en Côte d'Ivoire.",
};

/**
 * Ancres supplémentaires attendues par les liens du footer
 * (ex. /services#institution pointe sur le pack « Institution Premium »).
 */
const anchorAliases: Record<string, string> = {
  "institution-premium": "institution",
  "etablissement-visible": "etablissement",
};

/** Points de repère du comparatif rapide entre packs. */
const compareRows = [
  {
    label: "Idéal pour",
    values: [
      "Indépendants & premiers pas",
      "Commerces & PME",
      "Institutions & grandes structures",
      "Écoles & organismes de formation",
      "Tout site déjà en ligne",
    ],
  },
  {
    label: "Délai moyen",
    values: ["2 semaines", "3 à 4 semaines", "6 à 10 semaines", "8 à 12 semaines", "En continu"],
  },
  {
    label: "Paiement Mobile Money",
    values: [false, true, true, true, false],
  },
  {
    label: "Espace d'administration",
    values: [false, true, true, true, false],
  },
  {
    label: "Accompagnement dédié",
    values: [false, false, true, true, true],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Nos services"
        title={
          <>
            Des solutions numériques{" "}
            <GradientText>taillées pour vous</GradientText>
          </>
        }
        description="Site vitrine, boutique en ligne, plateforme institutionnelle ou e-learning : nous concevons l'outil qui sert vraiment votre activité, sans template générique."
      >
        <Link href="/devis" className={buttonClasses({ variant: "primary", size: "lg" })}>
          Demander un devis
          <ArrowRight size={18} />
        </Link>
        <Link href="/contact" className={buttonClasses({ variant: "outline", size: "lg" })}>
          Parler à un expert
        </Link>
      </PageHero>

      {/* Les 5 packs */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Nos packs"
            title={
              <>
                Un pack pour <GradientText>chaque étape</GradientText> de votre
                croissance
              </>
            }
            subtitle="Du premier site à la plateforme sur-mesure, chaque offre est claire, sans surprise, et pensée pour le marché ivoirien."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {servicePacks.map((pack) => {
              const alias = anchorAliases[pack.slug];
              return (
                <StaggerItem key={pack.id}>
                  <div id={pack.slug} className="scroll-mt-28 h-full">
                    {/* Ancre alias (liens du footer) sans casser la mise en page */}
                    {alias && (
                      <span
                        id={alias}
                        aria-hidden
                        className="pointer-events-none block h-0 scroll-mt-28"
                      />
                    )}
                    <ServiceCard pack={pack} />
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-4 text-center">
            <p className="text-sm text-text-secondary">
              Un besoin particulier ou hybride ? Nous composons une offre sur-mesure.
            </p>
            <Link
              href="/devis"
              className={buttonClasses({ variant: "secondary", size: "md" })}
            >
              Construire mon offre
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </Container>
      </Section>

      {/* Comparatif rapide */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Comparatif"
            title={
              <>
                Trouvez le pack qui vous{" "}
                <GradientText>correspond</GradientText>
              </>
            }
            subtitle="Une vue d'ensemble pour choisir en confiance. Rien n'est figé : tout se personnalise."
          />
          <Reveal className="mt-12">
            <div className="overflow-x-auto rounded-2xl border border-navy/[0.08] bg-surface-primary">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-navy/[0.08]">
                    <th className="p-5 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                      Ce que comprend chaque pack
                    </th>
                    {servicePacks.map((pack) => (
                      <th key={pack.id} className="p-5 align-bottom">
                        <div className="flex items-center gap-2">
                          <IconBadge
                            tone={pack.featured ? "gradient" : "soft"}
                            size="sm"
                          >
                            <Icon name={pack.icon} size={16} />
                          </IconBadge>
                          <span className="font-display text-sm font-bold text-navy">
                            {pack.name}
                          </span>
                        </div>
                        {pack.featured && (
                          <Badge variant="gradient" className="mt-2">
                            Le plus choisi
                          </Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-navy/[0.06] last:border-0 even:bg-surface-secondary/60"
                    >
                      <th
                        scope="row"
                        className="p-5 text-sm font-semibold text-navy"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, i) => (
                        <td
                          key={i}
                          className="p-5 text-sm text-text-secondary"
                        >
                          {typeof value === "boolean" ? (
                            value ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
                                <Check size={14} strokeWidth={3} />
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-5" />
                    {servicePacks.map((pack) => (
                      <td key={pack.id} className="p-5">
                        <Link
                          href="/devis"
                          className={cn(
                            buttonClasses({
                              variant: pack.featured ? "primary" : "outline",
                              size: "sm",
                            }),
                            "w-full",
                          )}
                        >
                          {pack.cta}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Notre méthode */}
      <Section tone="dark">
        <Container>
          <SectionHeading
            invert
            eyebrow="Notre méthode"
            title={
              <>
                De l'idée à la <GradientText>mise en ligne</GradientText>
              </>
            }
            subtitle="Un processus limpide et rassurant : vous gardez la main et la visibilité à chaque étape."
          />
          <StaggerGroup className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Filet dégradé reliant les étapes (desktop) */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-da opacity-40 lg:block"
            />
            {processSteps.map((step) => (
              <StaggerItem key={step.number} className="relative">
                <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-da font-display text-lg font-extrabold text-white shadow-brand">
                  {step.number}
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {step.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Pourquoi Digital Access */}
      <Section tone="muted">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionHeading
              align="left"
              eyebrow="Nos engagements"
              title={
                <>
                  Bien plus qu'un prestataire, un{" "}
                  <GradientText>partenaire</GradientText>
                </>
              }
              subtitle="Nous construisons des outils qui servent réellement votre activité, avec un accompagnement humain et durable."
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

          <Reveal className="mt-14">
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-navy/[0.08] bg-surface-primary p-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-da text-white">
                  <Sparkles size={22} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy">
                    Une question sur nos offres ?
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Retrouvez toutes les réponses (délais, paiement, maintenance)
                    dans notre FAQ.
                  </p>
                </div>
              </div>
              <Link
                href="/faq"
                className={buttonClasses({ variant: "outline", size: "md" })}
              >
                Consulter la FAQ
                <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CTABanner
        title="Un projet en tête ? Discutons-en."
        description="Recevez un devis gratuit et personnalisé sous 48h, sans engagement."
        secondary={{ label: "Voir nos réalisations", href: "/portfolio" }}
      />
    </>
  );
}
