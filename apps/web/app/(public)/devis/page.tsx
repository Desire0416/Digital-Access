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
      {/* Intro — desktop : hero magazine ; mobile : en-tête d'app compact,
          aligné à gauche, pour atteindre le formulaire immédiatement. */}
      <div className="hidden lg:block">
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
      </div>
      <div className="px-5 pb-3 pt-6 lg:hidden">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blue-royal">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" aria-hidden />
          Devis gratuit
        </span>
        <h1 className="mt-3 font-display text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-navy">
          Estimons votre projet
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
          Quelques questions simples — réponse et devis gratuit sous 48h, sans engagement.
        </p>
      </div>

      {/* Wizard — plein écran sur mobile (aucun cadre), carte sur desktop. */}
      <Section spacing="sm" className="!pt-0">
        <div className="mx-auto w-full max-w-3xl sm:px-6 lg:px-8">
          <DevisWizard />
        </div>
      </Section>

      {/* Rassurance */}
      <Section tone="muted" spacing="sm">
        <Container>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {reassurance.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg md:flex-col md:gap-0 md:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-vif/10 text-brand-blue-royal md:h-12 md:w-12">
                    <Icon name={item.icon} size={22} />
                  </span>
                  <div className="md:mt-4">
                    <h3 className="font-display text-base font-bold text-navy md:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary md:mt-2">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
