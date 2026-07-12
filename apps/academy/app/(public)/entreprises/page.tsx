import type { Metadata } from "next";
import Link from "next/link";
import {
  Section,
  Container,
  Reveal,
  StaggerGroup,
  StaggerItem,
  GradientText,
  Badge,
  buttonClasses,
} from "@da/ui";
import {
  ArrowRight,
  Users,
  Route,
  LineChart,
  FileBarChart,
  Award,
  MessageCircle,
  Mail,
  Building2,
  Sparkles,
  CheckCircle2,
  Layers,
  UserCog,
} from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Entreprises — Formez vos équipes",
  description:
    "Access Academy pour les entreprises : formation des équipes, parcours personnalisés, suivi de progression, rapports détaillés et certifications reconnues. Contactez notre équipe commerciale.",
  alternates: { canonical: "/entreprises" },
};

/* Cahier §28.1 — Page publique entreprises. */

const OFFERS = [
  { icon: Users, title: "Formation des équipes", text: "Donnez à vos collaborateurs l'accès à tout le catalogue de formations et de parcours métiers, à leur rythme." },
  { icon: Route, title: "Parcours personnalisés", text: "Nous construisons des parcours sur mesure alignés sur vos besoins métiers et vos objectifs de montée en compétences." },
  { icon: LineChart, title: "Suivi de progression", text: "Suivez en temps réel l'avancement de chaque collaborateur et de chaque cohorte depuis un espace dédié." },
  { icon: FileBarChart, title: "Rapports détaillés", text: "Exportez des rapports clairs sur l'activité, la progression et les résultats pour piloter vos actions de formation." },
  { icon: Award, title: "Certifications reconnues", text: "Vos équipes obtiennent des certificats vérifiables qui valorisent leurs nouvelles compétences." },
  { icon: UserCog, title: "Responsables dédiés", text: "Désignez des responsables internes pour gérer les membres, les licences et les affectations." },
] as const;

const STEPS = [
  { title: "Échange", text: "Vous nous partagez vos besoins et vos objectifs de formation." },
  { title: "Proposition", text: "Nous construisons une offre adaptée : formations, parcours, cohortes." },
  { title: "Déploiement", text: "Vos équipes accèdent à la plateforme et démarrent leur montée en compétences." },
  { title: "Pilotage", text: "Vous suivez la progression et recevez des rapports réguliers." },
] as const;

const contactSubject = encodeURIComponent("Demande d'offre entreprise — Access Academy");
const contactBody = encodeURIComponent(
  "Bonjour,\n\nNous souhaitons former nos équipes avec Access Academy.\n\n- Organisation : \n- Nombre de collaborateurs : \n- Besoins / métiers visés : \n\nMerci de nous recontacter.",
);
const mailtoHref = `mailto:${siteConfig.contactEmail}?subject=${contactSubject}&body=${contactBody}`;
const whatsappHref = `https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
  "Bonjour, nous souhaitons en savoir plus sur l'offre entreprise d'Access Academy.",
)}`;

export default function EntreprisesPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <span className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-brand-blue-royal opacity-30 blur-[120px]" aria-hidden />
        <span className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-cyan opacity-20 blur-[120px]" aria-hidden />
        <Container className="relative py-20 sm:py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="gradient" className="mb-5">
                <Building2 size={13} />
                Access Academy pour les entreprises
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                Faites monter vos équipes en <GradientText>compétences</GradientText>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                Formez vos collaborateurs sur des compétences numériques et professionnelles
                concrètes. Parcours personnalisés, suivi de progression, rapports et certifications :
                tout pour piloter la formation de vos équipes en toute sérénité.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={mailtoHref} className={buttonClasses({ variant: "white", size: "lg" })}>
                  <Mail size={18} />
                  Contacter l'équipe commerciale
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({ size: "lg" })}
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* OFFRES §28.1 */}
      <Section tone="default" spacing="md">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Ce que nous proposons"
            title="Une solution de formation"
            gradient="clé en main"
            subtitle="Tout ce dont votre organisation a besoin pour développer les compétences de ses équipes."
            className="mx-auto"
          />
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERS.map((o) => (
              <StaggerItem key={o.title} className="h-full">
                <div className="flex h-full flex-col rounded-xl border border-navy/[0.08] bg-surface-primary p-6 transition-shadow duration-300 hover:shadow-brand-lg">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                    <o.icon size={22} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">{o.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{o.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* PARCOURS PERSONNALISÉ §28.3 */}
      <Section tone="muted" spacing="md">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <SectionHeading
                eyebrow="Sur mesure"
                title="Un parcours adapté à"
                gradient="votre organisation"
                subtitle="Au-delà du catalogue, nous construisons des dispositifs qui collent à votre réalité."
              />
              <ul className="mt-6 space-y-3">
                {[
                  "Sélection de formations existantes pertinentes pour vos métiers",
                  "Conception d'un parcours personnalisé complet",
                  "Intégration possible de contenus internes à votre entreprise",
                  "Organisation de cohortes privées pour vos équipes",
                ].map((li) => (
                  <li key={li} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
                    <span className="text-sm leading-relaxed text-text-primary">{li}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
                    <Layers size={22} />
                  </span>
                  <p className="font-display text-lg font-bold text-navy">Comment ça se passe</p>
                </div>
                <ol className="mt-6 space-y-5">
                  {STEPS.map((s, i) => (
                    <li key={s.title} className="flex gap-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-da text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-navy">{s.title}</p>
                        <p className="text-sm leading-relaxed text-text-secondary">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* CTA CONTACT COMMERCIAL */}
      <Section tone="default" spacing="md">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-surface-dark px-6 py-16 text-center text-white sm:px-12">
            <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
            <span className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-cyan opacity-25 blur-[100px]" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <Badge variant="gradient" className="mb-5">
                <Sparkles size={13} />
                Parlons de votre projet
              </Badge>
              <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Prêt·e à former vos équipes ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
                Notre équipe commerciale vous accompagne pour construire l'offre la plus adaptée à
                votre organisation.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={mailtoHref} className={buttonClasses({ variant: "white", size: "lg" })}>
                  <Mail size={18} />
                  {siteConfig.contactEmail}
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({ size: "lg" })}
                >
                  <MessageCircle size={18} />
                  Écrire sur WhatsApp
                </a>
              </div>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                Ou utilisez notre formulaire de contact
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
