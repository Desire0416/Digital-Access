import { Section, Container, Reveal } from "@da/ui";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { DevisWizard } from "./DevisWizard";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Demander un devis gratuit — Projet web à Abidjan",
  description:
    "Décrivez votre projet en quelques étapes et recevez un devis gratuit, clair et sans engagement sous 48h. Sites vitrines, plateformes institutionnelles, e-learning et maintenance en Côte d'Ivoire.",
  path: "/devis",
  keywords: [
    "devis site web Abidjan",
    "devis gratuit création site Côte d'Ivoire",
    "tarif site internet Abidjan",
    "demande de devis agence web",
    "prix site vitrine Côte d'Ivoire",
    "devis e-learning Abidjan",
  ],
});

const reassurance: { icon: string; title: string; text: string }[] = [
  {
    icon: "zap",
    title: "Réponse rapide",
    text: "Un premier retour de notre équipe sous 48h ouvrées, avec des questions ciblées si besoin.",
  },
  {
    icon: "file-text",
    title: "Devis transparent",
    text: "Un chiffrage détaillé, sans surprise ni frais cachés, adapté à votre budget réel.",
  },
  {
    icon: "handshake",
    title: "Sans engagement",
    text: "Recevoir un devis ne vous engage à rien. On échange, on affine, vous décidez.",
  },
];

export default function DevisPage() {
  return (
    <>
      <PageHero
        eyebrow="Demande de devis"
        title={
          <>
            Estimons votre projet
            <br className="hidden sm:block" /> ensemble
          </>
        }
        description="Répondez à quelques questions simples : plus vous nous en dites, plus votre devis sera précis. C'est gratuit et sans engagement."
      />

      {/* Wizard */}
      <Section spacing="sm" className="!pt-0">
        <Container size="md">
          <DevisWizard />
        </Container>
      </Section>

      {/* Rassurance */}
      <Section tone="muted">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {reassurance.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-xl border border-navy/[0.07] bg-surface-primary p-6 transition-shadow hover:shadow-lg">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-vif/10 text-brand-blue-royal">
                    <Icon name={item.icon} size={22} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
