import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Section, Container, GradientText, Reveal, buttonClasses } from "@da/ui";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { faqItems } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { FaqAccordion } from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes",
  description:
    "Toutes les réponses à vos questions sur Digital Access : délais, tarifs, moyens de paiement Mobile Money, maintenance, référencement et autonomie sur votre site.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            Vos questions, <GradientText>nos réponses</GradientText>
          </>
        }
        description="Délais, tarifs, paiement, maintenance… Retrouvez ici les réponses aux questions que l'on nous pose le plus souvent. Une question sans réponse ? Écrivez-nous."
      />

      <Section spacing="lg">
        <Container size="lg">
          <FaqAccordion items={faqItems} />

          {/* Encart « une autre question ? » */}
          <Reveal className="mx-auto mt-16 max-w-3xl">
            <div className="relative overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-secondary px-6 py-8 sm:px-10">
              <div
                aria-hidden
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-cyan/10 blur-3xl"
              />
              <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-da text-white shadow-brand">
                    <MessageCircle size={22} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-navy">
                      Vous ne trouvez pas votre réponse ?
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      Notre équipe vous répond avec plaisir, par e-mail ou sur
                      WhatsApp.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className={buttonClasses({ variant: "primary", size: "md" })}
                  >
                    Nous contacter
                    <ArrowRight size={17} />
                  </Link>
                  <a
                    href={`https://wa.me/${siteConfig.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({ variant: "outline", size: "md" })}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CTABanner
        title="Prêt à concrétiser votre projet ?"
        description="Obtenez un devis gratuit et sans engagement sous 48h. Discutons de vos objectifs dès aujourd'hui."
        secondary={{ label: "Voir nos tarifs", href: "/tarifs" }}
      />
    </>
  );
}
