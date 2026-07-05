import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Quote } from "lucide-react";
import {
  AnimatedCounter,
  Container,
  Divider,
  GradientText,
  IconBadge,
  Monogram,
  Reveal,
  Section,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  buttonClasses,
  cn,
} from "@da/ui";
import { Icon } from "@/components/Icon";
import { AboutHero } from "./AboutHero";

export const metadata: Metadata = {
  title: "À propos — Notre mission",
  description:
    "Access Academy, la plateforme e-learning de Digital Access, démocratise les compétences numériques en Côte d'Ivoire : formations en français par des mentors praticiens, certificats vérifiables et paiement Mobile Money.",
};

/* ──────────────────────────── Contenu statique ─────────────────────────────── */

const values = [
  {
    icon: "smartphone",
    title: "Accessibilité",
    description:
      "Apprendre ne doit dépendre ni d'une carte bancaire, ni d'une fibre optique. Academy fonctionne sur un smartphone en 3G, se paie en Mobile Money et propose des cours gratuits pour commencer sans rien débourser.",
  },
  {
    icon: "target",
    title: "Excellence",
    description:
      "Accessible ne veut pas dire au rabais. Chaque cours est structuré, relu et validé : objectifs clairs, quiz exigeants, projets concrets. Le certificat Academy doit vouloir dire quelque chose sur le marché du travail.",
  },
  {
    icon: "globe",
    title: "Ancrage local",
    description:
      "Nos exemples parlent d'Abidjan, de FCFA et de vrais clients ivoiriens — pas de la Silicon Valley. Une plateforme pensée ici, pour les réalités d'ici, avec l'ambition d'ouvrir le monde à nos apprenants.",
  },
];

const reasons = [
  {
    icon: "graduation-cap",
    title: "Des mentors praticiens",
    description:
      "Nos formateurs livrent des sites, des campagnes et des designs toute l'année pour de vrais clients. Ils enseignent ce qu'ils pratiquent — pas ce qu'ils ont lu.",
  },
  {
    icon: "book-open",
    title: "Du contenu en français, pensé pour ici",
    description:
      "Cours 100 % en français, exemples ancrés dans le contexte ivoirien, vidéos optimisées pour les connexions 3G/4G. Rien n'est traduit à la va-vite.",
  },
  {
    icon: "award",
    title: "Des certificats vérifiables",
    description:
      "Chaque certificat porte un QR code unique qu'un recruteur peut vérifier en ligne en quelques secondes. Votre effort devient une preuve, pas juste un PDF.",
  },
  {
    icon: "users",
    title: "Une communauté qui avance ensemble",
    description:
      "Forums de cours, entraide entre apprenants, retours des mentors : vous n'apprenez jamais seul. Les meilleurs profils sont recommandés aux entreprises partenaires.",
  },
];

const stats = [
  { value: 2500, suffix: "+", label: "Apprenants inscrits" },
  { value: 4, suffix: "", label: "Univers de formation" },
  { value: 98, suffix: " %", label: "d'apprenants satisfaits" },
  { value: 100, suffix: " %", label: "de certificats vérifiables" },
];

/* ─────────────────────────────────── Page ──────────────────────────────────── */

export default function AboutPage() {
  return (
    <>
      {/* 1 — Hero */}
      <AboutHero />

      {/* 2 — Notre mission */}
      <Section tone="muted">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Notre mission"
                title={
                  <>
                    Le talent est partout. <GradientText>L&apos;accès</GradientText>,
                    pas encore.
                  </>
                }
              />
              <Reveal delay={0.1}>
                <div className="mt-6 space-y-5 text-base leading-relaxed text-text-secondary">
                  <p>
                    En Côte d&apos;Ivoire, des milliers de jeunes veulent
                    apprendre le développement web, le design ou le marketing
                    digital. Mais les formations de qualité sont chères, souvent
                    en anglais, et presque toujours pensées pour d&apos;autres
                    réalités — carte bancaire obligatoire, vidéos lourdes,
                    exemples hors-sol.
                  </p>
                  <p>
                    Access Academy inverse la logique&nbsp;:{" "}
                    <strong className="font-semibold text-navy">
                      des formations conçues ici, pour ici
                    </strong>
                    . En français, accessibles depuis un simple smartphone,
                    payables en Mobile Money, avec des certificats que les
                    employeurs peuvent vérifier en un scan.
                  </p>
                  <p>
                    Notre objectif&nbsp;: que chaque apprenant motivé — à
                    Abidjan, Bouaké ou Korhogo — puisse transformer sa
                    curiosité en compétence, et sa compétence en carrière.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <Divider className="mt-8 w-16" />
              </Reveal>
            </div>

            {/* Citation manifeste */}
            <Reveal delay={0.15}>
              <div className="card-gradient-border relative overflow-hidden rounded-2xl bg-surface-primary p-8 sm:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-da opacity-[0.04]"
                />
                <Quote
                  size={40}
                  className="relative text-brand-blue-vif/25"
                  fill="currentColor"
                />
                <p className="relative mt-5 font-display text-xl font-bold leading-snug text-navy sm:text-2xl">
                  «&nbsp;Nous ne formons pas pour occuper les gens. Nous formons
                  pour qu&apos;ils soient <GradientText>embauchés</GradientText>,{" "}
                  <GradientText>promus</GradientText> ou qu&apos;ils{" "}
                  <GradientText>lancent leur activité</GradientText>.&nbsp;»
                </p>
                <p className="relative mt-6 text-sm font-semibold text-text-secondary">
                  L&apos;équipe Access Academy
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* 3 — Un produit Digital Access */}
      <Section spacing="sm">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-navy/[0.08] bg-surface-dark">
              <div aria-hidden className="absolute inset-0 bg-dots opacity-15" />
              <div
                aria-hidden
                className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-[100px]"
              />
              <div
                aria-hidden
                className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-cyan/20 blur-[100px]"
              />
              <Monogram
                variant="white"
                size={220}
                className="absolute -bottom-16 right-6 opacity-[0.07]"
              />
              <div className="relative grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:p-12">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
                    <Monogram variant="current" size={14} />
                    Un produit Digital Access
                  </span>
                  <h2 className="mt-5 max-w-2xl font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                    Née dans une agence qui construit le web ivoirien{" "}
                    <GradientText>tous les jours</GradientText>
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
                    Access Academy est développée par Digital Access, l&apos;agence
                    web basée à Abidjan qui conçoit sites vitrines, plateformes
                    institutionnelles et solutions e-learning. Les cours sont
                    nourris par nos projets réels&nbsp;: ce que nos équipes
                    livrent aux clients la semaine, elles vous l&apos;enseignent
                    sur Academy.
                  </p>
                </div>
                <a
                  href="https://digitalaccess.ci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonClasses({ variant: "white", size: "lg" }),
                    "shrink-0",
                  )}
                >
                  Découvrir l&apos;agence
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* 4 — Nos valeurs */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Nos valeurs"
            title={
              <>
                Trois principes qui guident{" "}
                <GradientText>chaque décision</GradientText>
              </>
            }
            subtitle="Du choix d'un formateur au prix d'un cours, tout passe par ce filtre."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map((value, i) => (
              <StaggerItem key={value.title} className="h-full">
                <div className="group relative flex h-full flex-col rounded-2xl border border-navy/[0.08] bg-surface-primary p-7 transition-shadow duration-300 hover:shadow-xl sm:p-8">
                  <span className="absolute right-6 top-6 font-display text-4xl font-extrabold text-navy/[0.05] transition-colors duration-300 group-hover:text-transparent group-hover:bg-gradient-da group-hover:bg-clip-text">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <IconBadge tone="gradient" size="lg">
                    <Icon name={value.icon} size={26} />
                  </IconBadge>
                  <h3 className="mt-5 font-display text-xl font-bold text-navy">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {value.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* 5 — Pourquoi nous choisir + stats */}
      <Section tone="dark" className="overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
        <div
          aria-hidden
          className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-accent/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-brand-cyan/15 blur-[120px]"
        />
        <Container className="relative">
          <SectionHeading
            invert
            eyebrow="Pourquoi nous choisir"
            title={
              <>
                Ce qui rend Academy <GradientText>différente</GradientText>
              </>
            }
            subtitle="Pas une plateforme de plus : une école en ligne construite par des praticiens, pour le marché ivoirien."
          />
          <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2">
            {reasons.map((reason) => (
              <StaggerItem
                key={reason.title}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7"
              >
                <IconBadge tone="gradient">
                  <Icon name={reason.icon} size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-white">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {reason.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* Stats */}
          <StaggerGroup className="mt-16 grid grid-cols-2 gap-8 border-t border-white/10 pt-12 lg:grid-cols-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label} className="text-center">
                <p className="font-display text-4xl font-extrabold sm:text-5xl">
                  <span className="text-gradient-da">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </span>
                </p>
                <p className="mt-2 text-sm font-medium text-white/60">
                  {stat.label}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* 6 — CTA Rejoindre Academy */}
      <Section spacing="md">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-da px-8 py-14 text-center sm:px-16 sm:py-20">
              <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
              <Monogram
                variant="white"
                size={220}
                className="absolute -bottom-16 -left-10 opacity-10"
              />
              <Monogram
                variant="white"
                size={160}
                className="absolute -right-8 -top-10 opacity-10"
              />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Écrivez la suite avec nous
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
                  Rejoignez les 2&nbsp;500+ apprenants qui construisent leur
                  avenir numérique sur Academy — le premier pas est gratuit.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/auth/register"
                    className={buttonClasses({ variant: "white", size: "lg" })}
                  >
                    Rejoindre Academy
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/courses"
                    className={cn(
                      buttonClasses({ variant: "ghost", size: "lg" }),
                      "text-white hover:bg-white/10",
                    )}
                  >
                    Explorer le catalogue
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
