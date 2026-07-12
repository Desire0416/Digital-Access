import type { Metadata } from "next";
import { Section, Container, Reveal, GradientText, Badge } from "@da/ui";
import { Mail, MessageCircle, MapPin, Clock, Building2 } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { siteConfig } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Access Academy : posez vos questions sur nos formations, parcours métiers et offres entreprises. Par email, WhatsApp ou via notre formulaire.",
  alternates: { canonical: "/contact" },
};

const whatsappHref = `https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
  "Bonjour, j'ai une question au sujet d'Access Academy.",
)}`;

export default function ContactPage() {
  const coords: { icon: typeof Mail; label: string; value: string; href?: string }[] = [
    {
      icon: Mail,
      label: "Email",
      value: siteConfig.contactEmail,
      href: `mailto:${siteConfig.contactEmail}`,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: siteConfig.whatsapp,
      href: whatsappHref,
    },
    { icon: MapPin, label: "Localisation", value: "Abidjan, Côte d'Ivoire" },
    { icon: Clock, label: "Disponibilité", value: "Lun. – Ven., 8h – 18h (GMT)" },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <span className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-brand-cyan opacity-20 blur-[120px]" aria-hidden />
        <Container className="relative py-20 sm:py-24">
          <div className="max-w-2xl">
            <Reveal>
              <Badge variant="gradient" className="mb-5">
                <Mail size={13} />
                Contact
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                Une question ? <GradientText>Parlons-en</GradientText>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                Formations, parcours métiers, certifications ou offres entreprises : notre équipe
                vous répond rapidement.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <Section tone="default" spacing="md">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
            {/* Coordonnées */}
            <Reveal>
              <SectionHeading
                eyebrow="Nos coordonnées"
                title="Plusieurs façons de nous"
                gradient="joindre"
              />
              <div className="mt-8 space-y-3">
                {coords.map((c) => {
                  const inner = (
                    <div className="flex items-center gap-4 rounded-xl border border-navy/[0.08] bg-surface-primary p-4 transition-shadow duration-300 hover:shadow-brand">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                        <c.icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                          {c.label}
                        </p>
                        <p className="truncate font-display text-sm font-bold text-navy">{c.value}</p>
                      </div>
                    </div>
                  );
                  return c.href ? (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="block"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={c.label}>{inner}</div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.06] p-4">
                <Building2 size={20} className="mt-0.5 shrink-0 text-brand-blue-royal" />
                <p className="text-sm leading-relaxed text-text-secondary">
                  Vous représentez une entreprise ? Consultez notre{" "}
                  <a href="/entreprises" className="font-semibold text-brand-blue-royal hover:underline">
                    offre dédiée aux équipes
                  </a>
                  .
                </p>
              </div>
            </Reveal>

            {/* Formulaire */}
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-navy">Envoyez-nous un message</h2>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Remplissez le formulaire, nous vous répondrons par email.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
