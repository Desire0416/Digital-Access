import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search, Megaphone, GraduationCap, Handshake, Building2, ArrowRight } from "lucide-react";
import { Section, Container, GradientText, SectionHeading, IconBadge, buttonClasses } from "@da/ui";

export const metadata: Metadata = {
  title: "Espace entreprises — Digital Access Academy",
  description:
    "Formez vos collaborateurs, recrutez des talents formés et certifiés, publiez des offres et missions, et accédez à un vivier de profils opérationnels.",
  alternates: { canonical: "/companies" },
};

const offers = [
  { icon: Search, title: "Recruter des talents", text: "Accédez à des profils formés, certifiés et vérifiés, avec portfolios et passeports de compétences." },
  { icon: Megaphone, title: "Publier une offre ou une mission", text: "Stages, emplois, missions freelance et projets clients diffusés aux apprenants éligibles." },
  { icon: GraduationCap, title: "Former vos collaborateurs", text: "Parcours B2B sur mesure : IA, productivité, marketing, data, cybersécurité de base." },
  { icon: Handshake, title: "Devenir partenaire", text: "Cas pratiques, jurys de soutenance, sponsoring de parcours et co-construction de programmes." },
];

export default function CompaniesPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy pt-20 text-white sm:pt-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-da opacity-30 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
        </div>
        <Container className="relative pb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-cyan">
            <Building2 size={15} /> Espace entreprises
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            Recrutez des talents <GradientText>opérationnels</GradientText>, formez vos équipes
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Digital Access Academy connecte les compétences formées aux besoins réels des organisations. Accédez à un vivier de
            profils certifiés, avec des projets concrets à l'appui.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/register" className={buttonClasses({ variant: "primary", size: "lg" })}>
              Créer un compte entreprise <ArrowRight size={18} />
            </Link>
            <a href="https://digitalaccess.ci/contact" className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10">
              Contacter l'équipe
            </a>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Ce que vous pouvez faire"
            title={<>Un pont entre <GradientText>formation et emploi</GradientText></>}
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map((o) => (
              <div key={o.title} className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
                <IconBadge tone="gradient"><o.icon size={22} /></IconBadge>
                <h3 className="mt-4 font-display text-base font-bold text-navy">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{o.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container size="lg">
          <div className="rounded-3xl border border-navy/[0.07] bg-surface-primary p-8 text-center sm:p-10">
            <IconBadge tone="gradient" className="mx-auto"><Users size={22} /></IconBadge>
            <h2 className="mt-5 font-display text-2xl font-bold text-navy">Rejoignez le réseau d'entreprises partenaires</h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              L'espace entreprise complet (comptes vérifiés, publication d'offres, recherche de talents, formation B2B) est en cours de déploiement.
              Manifestez votre intérêt dès maintenant.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/auth/register" className={buttonClasses({ variant: "primary", size: "md" })}>Créer un compte entreprise</Link>
              <a href="https://digitalaccess.ci/contact" className={buttonClasses({ variant: "outline", size: "md" })}>Nous contacter</a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
