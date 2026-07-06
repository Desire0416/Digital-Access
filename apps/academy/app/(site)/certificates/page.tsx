import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Compass,
  Download,
  ShieldCheck,
} from "lucide-react";
import {
  Container,
  GradientText,
  Reveal,
  Section,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  buttonClasses,
  cn,
  formatDate,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getMyCertificates, type MyCertificate } from "@/lib/certificate-queries";
import { levelLabel } from "@/lib/site";
import { CertificateActions } from "./CertificateActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes certificats",
  description:
    "Retrouvez tous vos certificats Access Academy : téléchargez le PDF, vérifiez leur authenticité et partagez votre réussite.",
  robots: { index: false, follow: false },
};

/* ─────────────────────────────── Carte diplôme ─────────────────────────────── */

function CertificateCard({ cert }: { cert: MyCertificate }) {
  const categoryName = cert.course.category?.name;
  const verifyHref = `/verify/${cert.code}`;
  const pdfHref = `/api/certificates/${cert.code}/pdf`;

  return (
    <StaggerItem className="h-full">
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary",
          "shadow-[0_1px_0_rgba(26,26,46,0.03)] transition-all duration-300",
          "hover:-translate-y-1 hover:border-brand-violet/25 hover:shadow-[0_24px_50px_-20px_rgba(91,63,168,0.35)]",
        )}
      >
        {/* Liseré dégradé signature en tête du diplôme */}
        <span aria-hidden className="h-1.5 w-full bg-gradient-da" />

        {/* Halo décoratif au survol */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-da opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.12]"
        />

        <div className="relative flex flex-1 flex-col p-6 sm:p-7">
          {/* En-tête : sceau + mention */}
          <div className="flex items-start justify-between gap-4">
            <div className="relative">
              <span
                aria-hidden
                className="absolute inset-0 scale-125 rounded-2xl bg-gradient-da opacity-20 blur-lg"
              />
              <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                <Award size={26} aria-hidden />
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <BadgeCheck size={13} aria-hidden />
              Certifié
            </span>
          </div>

          {/* Mention + intitulé du cours */}
          <p className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brand-blue-royal">
            Certificat de réussite
          </p>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug tracking-tight text-navy">
            {cert.course.title}
          </h3>

          {/* Catégorie + niveau */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="inline-flex items-center rounded-full bg-brand-blue-vif/10 px-2.5 py-1 text-xs font-semibold text-brand-blue-royal">
                {categoryName}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-navy/[0.06] px-2.5 py-1 text-xs font-semibold text-navy">
              {levelLabel(cert.course.level)}
            </span>
          </div>

          {/* Méta : date + code */}
          <dl className="mt-5 space-y-2.5 border-t border-dashed border-navy/10 pt-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Obtenu le</dt>
              <dd className="font-medium text-text-secondary">
                {formatDate(cert.issuedAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Code</dt>
              <dd>
                <span className="inline-block rounded-md bg-navy/[0.05] px-2 py-0.5 font-mono text-xs font-semibold tracking-tight text-navy">
                  {cert.code}
                </span>
              </dd>
            </div>
          </dl>

          {/* Actions — poussées en bas de carte */}
          <div className="mt-auto pt-6">
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({
                variant: "primary",
                size: "md",
                className: "w-full",
              })}
            >
              <Download size={16} aria-hidden />
              Télécharger le PDF
            </a>

            <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href={verifyHref}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-navy/12 text-sm font-semibold text-navy transition-colors hover:border-brand-violet/40 hover:text-brand-violet sm:px-4"
              >
                <ShieldCheck size={16} aria-hidden />
                Vérifier
              </Link>
              <CertificateActions code={cert.code} />
            </div>
          </div>
        </div>
      </article>
    </StaggerItem>
  );
}

/* ─────────────────────────────────── Page ──────────────────────────────────── */

export default async function CertificatesPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/certificates");

  const certs = await getMyCertificates(user.id);
  const count = certs.length;

  return (
    <Section tone="muted" spacing="md">
      <Container>
        <SectionHeading
          align="left"
          eyebrow="Espace apprenant"
          title={
            <>
              Mes <GradientText>certificats</GradientText>
            </>
          }
          subtitle={
            count > 0
              ? "Chaque certificat est vérifiable publiquement par son code unique. Téléchargez-le, partagez-le sur LinkedIn ou ajoutez-le à votre CV."
              : "Vos réussites vérifiables apparaîtront ici dès que vous aurez terminé un cours."
          }
          className="max-w-2xl"
        />

        {count === 0 ? (
          /* ── État vide brandé ─────────────────────────────────────────────── */
          <Reveal className="mt-12">
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-navy/15 bg-surface-primary px-6 py-16 text-center sm:px-10">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-da opacity-10 blur-3xl"
              />
              <div className="relative">
                <span
                  aria-hidden
                  className="absolute inset-0 scale-150 rounded-full bg-gradient-da opacity-15 blur-2xl"
                />
                <span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-da text-white shadow-brand">
                  <Award size={38} aria-hidden />
                </span>
              </div>
              <h3 className="mt-7 font-display text-2xl font-bold text-navy">
                Vous n&apos;avez pas encore de certificat
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                Terminez un cours à 100&nbsp;% pour décrocher votre premier
                certificat vérifiable — une preuve concrète de vos nouvelles
                compétences.
              </p>
              <Link
                href="/courses"
                className={buttonClasses({
                  variant: "primary",
                  size: "md",
                  className: "mt-7",
                })}
              >
                <Compass size={17} aria-hidden />
                Explorer le catalogue
              </Link>
            </div>
          </Reveal>
        ) : (
          /* ── Grille de mini-diplômes ──────────────────────────────────────── */
          <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {certs.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
          </StaggerGroup>
        )}
      </Container>
    </Section>
  );
}
