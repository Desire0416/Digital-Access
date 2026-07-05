import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import {
  Container,
  GradientText,
  Monogram,
  Reveal,
  Section,
  SectionHeading,
  buttonClasses,
  cn,
} from "@da/ui";
import { academyConfig } from "@/lib/site";
import { PricingHero } from "./PricingHero";
import { PricingPlans } from "./PricingPlans";
import { MobileMoneyBanner } from "./MobileMoneyBanner";
import { PricingFaq } from "./PricingFaq";

export const metadata: Metadata = {
  title: "Tarifs — Des tarifs simples et accessibles",
  description:
    "Cours gratuits pour découvrir, cours à la carte avec accès à vie à partir de 25 000 FCFA, abonnement illimité bientôt disponible. Paiement Mobile Money (Orange Money, MTN MoMo, Wave) — Access Academy, Côte d'Ivoire.",
};

const whatsappHref = `https://wa.me/${academyConfig.contact.whatsapp}?text=${encodeURIComponent(
  "Bonjour ! J'ai une question sur les tarifs d'Access Academy.",
)}`;

export default function PricingPage() {
  return (
    <>
      {/* 1 — Hero */}
      <PricingHero />

      {/* 2 — Les 3 modèles */}
      <Section spacing="sm" className="pt-6 sm:pt-8">
        <Container>
          <div className="lg:px-2 lg:py-4">
            <PricingPlans />
          </div>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-text-muted">
              Les prix varient selon le cours — chaque page du catalogue affiche
              son prix exact, en FCFA et sans frais cachés. Les cours achetés
              restent à vous, pour toujours.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* 3 — Paiement Mobile Money */}
      <Section tone="muted" id="paiement">
        <SectionHeading
          eyebrow="Paiement"
          title={
            <>
              Pensé pour la <GradientText>Côte d&apos;Ivoire</GradientText>
            </>
          }
          subtitle="Ici, on paie avec son téléphone. Academy aussi."
          className="px-4"
        />
        <div className="mt-12">
          <MobileMoneyBanner />
        </div>
      </Section>

      {/* 4 — Mini FAQ */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Questions fréquentes"
            title={
              <>
                Tout ce qu&apos;il faut savoir{" "}
                <GradientText>avant de vous lancer</GradientText>
              </>
            }
            subtitle="Mobile, certificats, paiement : les réponses aux questions qu'on nous pose le plus."
          />
          <Reveal className="mt-12">
            <PricingFaq />
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 text-center text-sm text-text-secondary">
              Une autre question&nbsp;?{" "}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
              >
                <MessageCircle size={15} />
                Écrivez-nous sur WhatsApp
              </a>
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* 5 — CTA final vers le catalogue */}
      <Section spacing="sm" className="pb-20 sm:pb-24">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-da px-8 py-14 text-center sm:px-16 sm:py-16">
              <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
              <Monogram
                variant="white"
                size={200}
                className="absolute -bottom-14 -left-10 opacity-10"
              />
              <Monogram
                variant="white"
                size={140}
                className="absolute -right-8 -top-10 opacity-10"
              />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Le meilleur moyen de choisir&nbsp;? Explorer.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
                  Parcourez le catalogue, testez les chapitres en aperçu gratuit
                  et lancez-vous quand vous êtes prêt.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/courses"
                    className={buttonClasses({ variant: "white", size: "lg" })}
                  >
                    Explorer le catalogue
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/auth/register"
                    className={cn(
                      buttonClasses({ variant: "ghost", size: "lg" }),
                      "text-white hover:bg-white/10",
                    )}
                  >
                    Créer un compte gratuit
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
