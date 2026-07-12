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
  Target,
  Route,
  FolderKanban,
  Award,
  Briefcase,
  RefreshCw,
  Users,
  Layers,
  ShieldCheck,
  Heart,
  Sparkles,
  Building2,
} from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Access Academy est l'académie numérique de Digital Access : un environnement complet d'apprentissage orienté compétences, métiers, projets et certification pour l'employabilité en Côte d'Ivoire et en Afrique.",
  alternates: { canonical: "/a-propos" },
};

/* Cahier §2 — Vision du produit. Académie orientée compétences / métiers /
   projets / certification, portée par Digital Access. */

const PILLARS = [
  { icon: Target, title: "Compétences concrètes", text: "Chaque formation vise des savoir-faire immédiatement applicables, pas de la théorie hors-sol." },
  { icon: Route, title: "Préparation aux métiers", text: "Nos parcours métiers assemblent les formations dans le bon ordre pour rendre opérationnel." },
  { icon: FolderKanban, title: "Projets pratiques", text: "On apprend en faisant : des projets réels qui prouvent vos compétences et nourrissent votre portfolio." },
  { icon: Award, title: "Certification", text: "Des certificats vérifiables publiquement, avec QR code et numéro unique, reconnus et partageables." },
  { icon: Briefcase, title: "Employabilité", text: "Tout est pensé pour rapprocher l'apprentissage du marché du travail et de ses attentes réelles." },
  { icon: RefreshCw, title: "Formation continue", text: "Un espace d'apprentissage durable pour monter en compétences tout au long de sa carrière." },
] as const;

const VALUES = [
  { icon: Layers, title: "Réutilisabilité", text: "Une formation est créée une seule fois puis réutilisée dans plusieurs parcours et écoles. Jamais dupliquée, jamais facturée deux fois." },
  { icon: ShieldCheck, title: "Rigueur pédagogique", text: "Objectifs clairs, évaluations notées, projets corrigés : la qualité prime sur la quantité de vidéos." },
  { icon: Heart, title: "Accessibilité", text: "Une expérience fluide, moderne et pensée mobile-first pour les usages réels en Côte d'Ivoire." },
  { icon: Users, title: "Accompagnement", text: "De l'orientation à la certification, l'apprenant n'est jamais seul face à son parcours." },
] as const;

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <span className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-brand-violet opacity-25 blur-[120px]" aria-hidden />
        <Container className="relative py-20 sm:py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="gradient" className="mb-5">
                <Sparkles size={13} />
                Notre vision
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                Bien plus qu'une bibliothèque de vidéos :{" "}
                <GradientText>une académie complète</GradientText>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                Access Academy est l'académie numérique portée par{" "}
                <span className="font-semibold text-white">{siteConfig.legalName}</span>. Nous
                construisons un environnement d'apprentissage moderne, institutionnel et fluide,
                entièrement orienté vers l'acquisition de compétences, la préparation aux métiers
                et l'employabilité.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* MISSION / PILIERS §2 */}
      <Section tone="default" spacing="md">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Ce que nous défendons"
            title="Une plateforme orientée"
            gradient="résultats"
            subtitle="Access Academy n'est pas une simple bibliothèque de contenus. C'est un environnement complet qui mène l'apprenant de la compétence au métier."
            className="mx-auto"
          />
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <StaggerItem key={p.title} className="h-full">
                <div className="flex h-full flex-col rounded-xl border border-navy/[0.08] bg-surface-primary p-6 transition-shadow duration-300 hover:shadow-brand-lg">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                    <p.icon size={22} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{p.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* PORTEUR — DIGITAL ACCESS */}
      <Section tone="muted" spacing="md">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <SectionHeading
                eyebrow="Porté par Digital Access"
                title="Une expertise numérique au service de"
                gradient="l'apprentissage"
                subtitle="Digital Access conçoit des solutions numériques pour les organisations en Côte d'Ivoire. Access Academy prolonge cette mission : transmettre les compétences numériques et professionnelles qui comptent, avec la même exigence de qualité."
              />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/formations" className={buttonClasses({})}>
                  Découvrir les formations
                  <ArrowRight size={16} />
                </Link>
                <Link href="/contact" className={buttonClasses({ variant: "outline" })}>
                  Nous contacter
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="relative overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary p-8">
                <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-da opacity-[0.08] blur-2xl" aria-hidden />
                <div className="relative grid grid-cols-2 gap-6">
                  {[
                    { k: "Compétences", v: "au cœur", icon: Target },
                    { k: "Métiers", v: "préparés", icon: Briefcase },
                    { k: "Projets", v: "concrets", icon: FolderKanban },
                    { k: "Certificats", v: "vérifiables", icon: Award },
                  ].map((s) => (
                    <div key={s.k} className="rounded-xl bg-surface-secondary p-5">
                      <s.icon size={22} className="text-brand-blue-vif" />
                      <p className="mt-3 font-display text-lg font-bold text-navy">{s.v}</p>
                      <p className="text-xs text-text-secondary">{s.k}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* VALEURS */}
      <Section tone="default" spacing="md">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Nos valeurs"
            title="Les principes qui nous"
            gradient="guident"
            className="mx-auto"
          />
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <StaggerItem key={v.title}>
                <div className="flex gap-4 rounded-xl border border-navy/[0.08] bg-surface-primary p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
                    <v.icon size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-navy">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{v.text}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* CTA */}
      <Section tone="muted" spacing="sm">
        <Container>
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-navy/[0.08] bg-surface-primary p-8 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="font-display text-xl font-bold text-navy">
                Vous formez une équipe ou une organisation ?
              </h2>
              <p className="mt-1.5 text-sm text-text-secondary">
                Découvrez comment Access Academy accompagne la montée en compétences des entreprises.
              </p>
            </div>
            <Link href="/entreprises" className={buttonClasses({ className: "shrink-0" })}>
              <Building2 size={16} />
              Offre entreprise
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
