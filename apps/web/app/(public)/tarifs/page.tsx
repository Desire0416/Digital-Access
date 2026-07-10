import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  Section,
  Container,
  SectionHeading,
  GradientText,
  Reveal,
  Badge,
  buttonClasses,
  formatFCFA,
} from "@da/ui";
import { servicePacks, faqItems } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { PricingGrid } from "./PricingGrid";
import {
  ComparisonTable,
  type ComparisonPack,
  type ComparisonRow,
} from "./ComparisonTable";
import { PaymentNote } from "./PaymentNote";
import { PricingFaq } from "./PricingFaq";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Tarifs — Des offres claires, sans surprise",
  description:
    "Découvrez les tarifs Digital Access : sites vitrines, sites d'établissements scolaires, plateformes institutionnelles, e-learning et maintenance. Prix transparents, paiement Mobile Money (Orange, MTN, Wave) et en plusieurs fois.",
  path: "/tarifs",
  keywords: ["tarif site web Abidjan", "prix création site internet Côte d'Ivoire", "tarif site école", "prix plateforme e-learning"],
});

/* Les 3 packs « projet » mis en grille tarifaire principale. */
const mainPacks = servicePacks.filter((p) =>
  ["presence-web", "etablissement-visible", "institution-premium"].includes(
    p.id,
  ),
);

/* Packs colonnes du tableau comparatif. */
const comparisonPacks: ComparisonPack[] = mainPacks.map((p) => ({
  id: p.id,
  name: p.name,
  icon: p.icon,
  featured: p.featured,
}));

/* Matrice de livrables (ordre des colonnes = presence-web, etablissement-visible, institution-premium). */
const comparisonRows: ComparisonRow[] = [
  { label: "Design responsive sur-mesure", values: [true, true, true] },
  { label: "Formulaire de contact + WhatsApp", values: [true, true, true] },
  { label: "Nom de domaine + hébergement (1 an)", values: [true, true, true] },
  { label: "Référencement (SEO) de base", values: [true, true, true] },
  { label: "Nombre de pages", values: [true, true, true] },
  { label: "Blog & actualités", values: [false, true, true] },
  { label: "Catalogue produits / services", values: [false, true, true] },
  { label: "Paiement Mobile Money intégré", values: [false, true, true] },
  { label: "Espace d'administration", values: [false, true, true] },
  { label: "SEO avancé + Google Business", values: [false, true, true] },
  { label: "Formation à la prise en main", values: [false, true, true] },
  { label: "Espaces membres & tableaux de bord", values: [false, false, true] },
  { label: "Site multilingue (FR / EN)", values: [false, false, true] },
  { label: "Intégrations métiers (API, CRM)", values: [false, false, true] },
  { label: "Sécurité & performances renforcées", values: [false, false, true] },
  { label: "Accompagnement dédié", values: [false, false, true] },
];

/* Offres dédiées & complémentaires (bandeau bas) : établissements scolaires,
   e-learning et maintenance. Le pack scolaire a aussi sa page dédiée
   /services/site-etablissement-scolaire. */
const extraPacks = servicePacks.filter((p) =>
  ["etablissement-scolaire", "elearning", "maintenance"].includes(p.id),
);

const pricingFaq = faqItems.filter((f) => f.category === "Tarifs");

export default function TarifsPage() {
  return (
    <>
      <PageHero
        eyebrow="Tarifs"
        title={
          <>
            Des offres claires, <GradientText>sans surprise</GradientText>
          </>
        }
        description="Un prix de départ transparent pour chaque ambition, sans coût caché. Vous savez exactement ce que vous obtenez — et payez comme il vous arrange."
      >
        <Link
          href="/devis"
          className={buttonClasses({ variant: "primary", size: "lg" })}
        >
          Demander un devis gratuit
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/contact"
          className={buttonClasses({ variant: "outline", size: "lg" })}
        >
          Parler à un conseiller
        </Link>
      </PageHero>

      {/* Grille tarifaire principale */}
      <Section spacing="lg">
        <Container>
          <SectionHeading
            eyebrow="Nos packs"
            title={
              <>
                Choisissez le pack fait pour{" "}
                <GradientText>votre projet</GradientText>
              </>
            }
            subtitle="Trois formules pour couvrir chaque étape de votre présence en ligne. Tous nos prix sont indiqués « à partir de » et affinés dans le devis selon vos besoins précis."
          />
          <div className="mt-16">
            <PricingGrid packs={mainPacks} />
          </div>

          <Reveal className="mt-8 text-center text-sm text-text-secondary">
            Un besoin plus spécifique ?{" "}
            <Link
              href="/devis"
              className="font-semibold text-brand-blue-royal underline-offset-4 hover:underline"
            >
              Demandez un devis sur-mesure
            </Link>{" "}
            — réponse sous 48h.
          </Reveal>
        </Container>
      </Section>

      {/* Tableau comparatif */}
      <Section tone="muted" spacing="lg">
        <Container>
          <SectionHeading
            eyebrow="Comparatif"
            title={
              <>
                Ce que comprend <GradientText>chaque pack</GradientText>
              </>
            }
            subtitle="Un récapitulatif complet des livrables pour choisir en toute confiance. Survolez une ligne ou une colonne pour comparer sans vous perdre."
          />
          <div className="mt-14">
            <ComparisonTable packs={comparisonPacks} rows={comparisonRows} />
          </div>
        </Container>
      </Section>

      {/* Offres complémentaires */}
      <Section>
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Aussi disponible"
            title={
              <>
                Des offres <GradientText>complémentaires</GradientText>
              </>
            }
            subtitle="Au-delà des sites web, nous vous accompagnons sur la durée et sur des projets à forte valeur ajoutée."
            className="max-w-xl"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {extraPacks.map((pack) => (
              <ExtraPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Paiement */}
      <Section tone="muted" spacing="lg">
        <SectionHeading
          eyebrow="Paiement"
          title={
            <>
              Réglez <GradientText>comme il vous arrange</GradientText>
            </>
          }
          subtitle="Le Mobile Money d'abord, mais aussi le virement et le paiement échelonné pour les projets d'envergure."
          className="mb-14"
        />
        <PaymentNote />
      </Section>

      {/* FAQ tarifaire */}
      <Section spacing="lg">
        <Container>
          <SectionHeading
            eyebrow="Questions fréquentes"
            title={
              <>
                Tout savoir sur <GradientText>nos tarifs</GradientText>
              </>
            }
            subtitle="Les réponses aux questions que l'on nous pose le plus souvent sur les prix et le paiement."
          />
          <div className="mt-14">
            <PricingFaq items={pricingFaq} />
          </div>

          <Reveal className="mt-10 text-center">
            <p className="text-sm text-text-secondary">
              Une autre question sur nos tarifs ?
            </p>
            <Link
              href="/contact"
              className={buttonClasses({
                variant: "ghost",
                size: "md",
                className: "mt-3",
              })}
            >
              Contactez-nous
              <ArrowRight size={17} />
            </Link>
          </Reveal>
        </Container>
      </Section>

      <CTABanner
        title="Un devis gratuit, sans engagement"
        description="Décrivez-nous votre projet en quelques minutes. Nous revenons vers vous sous 48h avec une proposition claire et chiffrée."
        secondary={{ label: "Voir nos réalisations", href: "/portfolio" }}
      />
    </>
  );
}

/* ── Carte offre complémentaire (e-learning / maintenance) — server, style horizontal. ── */
function ExtraPackCard({
  pack,
}: {
  pack: (typeof servicePacks)[number];
}) {
  return (
    <Reveal className="group h-full">
      <div className="flex h-full flex-col rounded-2xl border border-navy/[0.08] bg-surface-primary p-7 transition-shadow hover:shadow-lg sm:p-8">
        <div className="flex items-center gap-2">
          <Badge variant="soft">
            <Sparkles size={12} />
            {pack.tagline}
          </Badge>
        </div>
        <h3 className="mt-4 font-display text-xl font-bold text-navy">
          {pack.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {pack.description}
        </p>

        <ul className="mt-5 grid flex-1 gap-2.5 sm:grid-cols-2">
          {pack.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-sm text-text-secondary"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-da" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-navy/[0.07] pt-5">
          <div>
            <span className="text-xs uppercase tracking-wide text-text-muted">
              {pack.priceLabel}
            </span>
            <p className="font-display text-2xl font-extrabold text-navy">
              {formatFCFA(pack.price)}
            </p>
          </div>
          <Link
            href="/devis"
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            {pack.cta}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
