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
  BadgeCheck,
  Award,
  Sparkles,
  Route,
  Star,
  ShieldCheck,
  QrCode,
  Hash,
  Calendar,
  User,
  Layers,
  PenLine,
  SearchCheck,
  Link2,
  FolderKanban,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Certifications",
  description:
    "Les certifications Access Academy : de l'attestation de participation à la certification de parcours métier. Certificats vérifiables publiquement avec QR code et numéro unique.",
  alternates: { canonical: "/certifications" },
};

/* Cahier §20 — Certifications : types, conditions, contenu, vérification. */

const TYPES = [
  { icon: BadgeCheck, title: "Attestation de participation", text: "Reconnaît votre assiduité et l'achèvement du programme suivi.", tone: "#1e8fe1" },
  { icon: Award, title: "Certificat de formation", text: "Valide la maîtrise des compétences d'une formation complète.", tone: "#2b5cc6" },
  { icon: Sparkles, title: "Certificat de spécialisation", text: "Atteste d'une expertise approfondie sur un ensemble de compétences.", tone: "#5b3fa8" },
  { icon: Star, title: "Certificat d'expertise", text: "Distingue un niveau d'excellence sur un domaine avancé.", tone: "#7c3aed" },
  { icon: Route, title: "Certification de parcours métier", text: "La reconnaissance la plus complète : vous êtes prêt·e à exercer le métier.", tone: "#00bcd4" },
  { icon: ShieldCheck, title: "Badge de compétence", text: "Une reconnaissance ciblée pour une compétence précise, à collectionner.", tone: "#059669" },
] as const;

const CONDITIONS = [
  { icon: TrendingUp, label: "Progression minimale atteinte" },
  { icon: ClipboardCheck, label: "Moyenne minimale aux évaluations" },
  { icon: BadgeCheck, label: "Évaluations obligatoires réussies" },
  { icon: FolderKanban, label: "Projet validé" },
  { icon: Layers, label: "Modules requis complétés" },
  { icon: ShieldCheck, label: "Paiement soldé" },
] as const;

const CONTENT = [
  { icon: User, label: "Nom complet" },
  { icon: Award, label: "Titre et type" },
  { icon: Layers, label: "Compétences validées" },
  { icon: Calendar, label: "Date de délivrance" },
  { icon: Hash, label: "Numéro unique" },
  { icon: QrCode, label: "QR code de vérification" },
  { icon: PenLine, label: "Signature Access Academy" },
  { icon: Link2, label: "Lien de vérification public" },
] as const;

export default function CertificationsPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <span className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-brand-violet opacity-25 blur-[120px]" aria-hidden />
        <span className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-brand-cyan opacity-20 blur-[110px]" aria-hidden />
        <Container className="relative py-20 sm:py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="gradient" className="mb-5">
                <Award size={13} />
                Certifications
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                Des certificats <GradientText>vérifiables</GradientText> qui prouvent vos compétences
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                De l'attestation de participation à la certification de parcours métier, chaque
                certificat délivré par Access Academy est unique, sécurisé et vérifiable en ligne à
                tout moment.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/certificats/verifier" className={buttonClasses({ variant: "white", size: "lg" })}>
                  <SearchCheck size={18} />
                  Vérifier un certificat
                </Link>
                <Link href="/formations" className={buttonClasses({ size: "lg" })}>
                  Explorer les formations
                  <ArrowRight size={18} />
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* TYPES §20.1 */}
      <Section tone="default" spacing="md">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Niveaux de reconnaissance"
            title="Un certificat adapté à chaque"
            gradient="réussite"
            subtitle="Selon le programme suivi et les conditions remplies, différents niveaux de reconnaissance vous sont délivrés."
            className="mx-auto"
          />
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TYPES.map((t) => (
              <StaggerItem key={t.title} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.08] bg-surface-primary p-6 transition-shadow duration-300 hover:shadow-brand-lg">
                  <span
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.1] blur-2xl transition-opacity group-hover:opacity-20"
                    style={{ backgroundColor: t.tone }}
                    aria-hidden
                  />
                  <span
                    className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-brand"
                    style={{ background: `linear-gradient(135deg, ${t.tone}, ${t.tone}bb)` }}
                  >
                    <t.icon size={22} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* CONDITIONS §20.2 + CONTENU §20.3 */}
      <Section tone="muted" spacing="md">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Conditions */}
            <Reveal>
              <SectionHeading
                eyebrow="Conditions d'obtention"
                title="Ce qui déclenche votre"
                gradient="certificat"
                subtitle="Les conditions sont configurées par programme. Un certificat n'est délivré que lorsqu'elles sont toutes remplies."
              />
              <ul className="mt-8 space-y-3">
                {CONDITIONS.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center gap-3 rounded-xl border border-navy/[0.08] bg-surface-primary p-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
                      <c.icon size={18} />
                    </span>
                    <span className="text-sm font-medium text-text-primary">{c.label}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Contenu du certificat — aperçu */}
            <Reveal delay={0.1}>
              <SectionHeading
                eyebrow="Contenu du certificat"
                title="Chaque certificat contient"
                gradient="l'essentiel"
              />
              <div className="mt-8 overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
                {/* Aperçu stylisé */}
                <div className="relative border-b border-navy/[0.06] bg-surface-dark p-6 text-white">
                  <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-brand-cyan">Access Academy</p>
                      <p className="mt-1 font-display text-lg font-bold">Certificat de formation</p>
                    </div>
                    <span className="grid h-14 w-14 place-items-center rounded-xl border border-white/15 bg-white/5">
                      <QrCode size={30} className="text-white/80" />
                    </span>
                  </div>
                  <p className="relative mt-4 font-mono text-xs text-white/50">
                    N° AAC-2026-XXXXXX · vérifiable en ligne
                  </p>
                </div>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-3 p-6 sm:grid-cols-2">
                  {CONTENT.map((c) => (
                    <li key={c.label} className="flex items-center gap-2.5 text-sm text-text-primary">
                      <c.icon size={16} className="shrink-0 text-brand-blue-vif" />
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* VÉRIFICATION §20.4 — CTA */}
      <Section tone="default" spacing="md">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-surface-dark px-6 py-16 text-center text-white sm:px-12">
            <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
            <span className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-brand-violet opacity-30 blur-[100px]" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                <SearchCheck size={26} />
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Vérifiez l'authenticité d'un certificat
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
                Employeurs, partenaires, apprenants : confirmez la validité d'un certificat grâce à
                son numéro unique, son QR code ou son lien direct.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/certificats/verifier"
                  className={buttonClasses({ variant: "white", size: "lg" })}
                >
                  <SearchCheck size={18} />
                  Vérifier un certificat
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
