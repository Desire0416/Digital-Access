import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, ScrollText, IdCard, QrCode, ShieldCheck } from "lucide-react";
import { Section, Container, GradientText, SectionHeading, IconBadge, buttonClasses } from "@da/ui";

export const metadata: Metadata = {
  title: "Certifications & badges — Digital Access Academy",
  description:
    "Badges de compétences, micro-certifications, certificats de parcours et passeport de compétences — vérifiables publiquement par QR code.",
  alternates: { canonical: "/certifications" },
};

const levels = [
  { icon: BadgeCheck, title: "Badges de compétences", text: "Reconnaissent une compétence précise et démontrée (ex. « CSS Responsive », « Prompt Engineering »), liée à une preuve." },
  { icon: ScrollText, title: "Micro-certifications", text: "Valident un bloc cohérent de compétences directement utile, ex. « Excel Professionnel » ou « Community Management »." },
  { icon: Award, title: "Certificats de parcours", text: "Attestent la réussite d'un parcours métier complet, projet final validé à l'appui." },
  { icon: IdCard, title: "Passeport de compétences", text: "Synthèse dynamique de tout ce que vous savez faire : compétences, badges, certificats et projets réunis." },
];

export default function CertificationsPage() {
  return (
    <>
      <Section className="pt-20 sm:pt-24">
        <Container>
          <SectionHeading
            eyebrow="Certification par la preuve"
            title={<>Des compétences <GradientText>vérifiables</GradientText>, pas seulement déclarées</>}
            subtitle="À Digital Access Academy, on ne certifie pas la présence à un cours : on reconnaît des compétences démontrées par des projets, des livrables et des évaluations sérieuses."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {levels.map((l) => (
              <div key={l.title} className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
                <IconBadge tone="gradient"><l.icon size={22} /></IconBadge>
                <h3 className="mt-4 font-display text-base font-bold text-navy">{l.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{l.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container size="lg">
          <div className="grid items-center gap-8 rounded-3xl border border-navy/[0.07] bg-surface-primary p-8 sm:grid-cols-2 sm:p-10">
            <div>
              <IconBadge tone="gradient"><QrCode size={22} /></IconBadge>
              <h2 className="mt-4 font-display text-2xl font-bold text-navy">Vérifiable par <GradientText>QR code</GradientText></h2>
              <p className="mt-3 leading-relaxed text-text-secondary">
                Chaque certificat porte un identifiant unique et un QR code renvoyant vers une page de vérification publique.
                Un employeur peut confirmer en un instant l'authenticité du certificat, son titulaire, sa date et les compétences validées.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/career-paths" className={buttonClasses({ variant: "primary", size: "md" })}>Choisir un parcours</Link>
                <Link href="/auth/register" className={buttonClasses({ variant: "outline", size: "md" })}>Créer un compte</Link>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                "Identifiant unique par certificat",
                "Page de vérification publique",
                "Mentions : Validé, Bien, Très Bien, Excellence",
                "Relié à votre portfolio de projets",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-surface-secondary/40 p-4">
                  <ShieldCheck size={18} className="shrink-0 text-success" />
                  <span className="text-sm font-medium text-navy/80">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
    </>
  );
}
