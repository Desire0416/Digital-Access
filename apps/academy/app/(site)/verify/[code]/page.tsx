import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Download,
  FolderOpen,
  Hash,
  Search,
  ShieldAlert,
  ShieldCheck,
  Signal,
  UserRound,
} from "lucide-react";
import {
  Container,
  GradientText,
  Monogram,
  Reveal,
  buttonClasses,
  cn,
  formatDate,
} from "@da/ui";
import { getCertificateByCode } from "@/lib/certificate-queries";
import { academyConfig, levelLabel } from "@/lib/site";

export const dynamic = "force-dynamic";

/* La page est une preuve publique d'authenticité : elle DOIT être indexable. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: "Vérification de certificat",
    description:
      "Vérifiez l'authenticité d'un certificat Access Academy à partir de son code unique.",
    robots: { index: true, follow: true },
    alternates: { canonical: `/verify/${code}` },
  };
}

/* Décor de marque commun aux deux états. */
function BrandBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-violet/15 blur-[120px]" />
      <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-cyan/15 blur-[120px]" />
      <Monogram
        size={440}
        className="absolute -bottom-32 left-1/2 -translate-x-1/2 opacity-[0.04]"
      />
    </div>
  );
}

/* En-tête de marque de la carte (logo Academy + libellé). */
function CardBrandHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-da shadow-brand">
        <Monogram variant="white" size={18} />
      </span>
      <span className="font-display text-sm font-bold tracking-tight text-navy">
        Access Academy
      </span>
    </div>
  );
}

/* ─── État invalide ────────────────────────────────────────────────────────── */
function CertificateNotFound({ code }: { code: string }) {
  return (
    <Reveal className="w-full max-w-md">
      <div className="rounded-3xl border border-navy/[0.07] bg-surface-primary p-7 text-center shadow-brand-lg sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10 text-error">
          <ShieldAlert size={34} strokeWidth={2.2} />
        </div>

        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Certificat introuvable
        </h1>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-text-secondary">
          Aucun certificat ne correspond au code{" "}
          <span className="break-all font-mono text-sm font-semibold text-navy">
            {code}
          </span>
          . Vérifiez le code saisi et réessayez.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/courses"
            className={buttonClasses({
              variant: "primary",
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            <Search size={17} />
            Explorer le catalogue
          </Link>
          <Link
            href="/"
            className={cn(
              buttonClasses({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto",
            )}
          >
            Aller à l&apos;accueil
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

/* ─── État valide ──────────────────────────────────────────────────────────── */
type ValidCertificate = NonNullable<
  Awaited<ReturnType<typeof getCertificateByCode>>
>;

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/[0.05] text-brand-violet">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </p>
        <div className="mt-0.5 break-words font-medium text-navy">{children}</div>
      </div>
    </div>
  );
}

function CertificateVerified({
  cert,
  code,
}: {
  cert: ValidCertificate;
  code: string;
}) {
  const instructor = cert.course.instructor?.name ?? academyConfig.name;
  const category = cert.course.category?.name;

  return (
    <Reveal className="w-full max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-navy/[0.07] bg-surface-primary shadow-brand-lg">
        {/* Bandeau de confiance vert */}
        <div className="flex items-center gap-3 border-b border-success/15 bg-success/[0.08] px-6 py-4 sm:px-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <ShieldCheck size={22} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-display text-sm font-bold text-success sm:text-base">
              <BadgeCheck size={16} strokeWidth={2.6} className="shrink-0" />
              Certificat authentique
            </p>
            <p className="text-xs text-success/80 sm:text-sm">
              Vérifié par Access Academy
            </p>
          </div>
        </div>

        {/* Filet dégradé signature */}
        <div aria-hidden className="h-1 w-full bg-gradient-da" />

        <div className="p-6 sm:p-8 lg:p-10">
          <CardBrandHeader />

          {/* Titulaire + cours */}
          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Certificat délivré à
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
              {cert.user.name}
            </p>
            <p className="mt-4 text-text-secondary">
              a complété avec succès la formation
            </p>
            <p className="mt-1.5 font-display text-xl font-bold leading-snug sm:text-2xl">
              <GradientText>{cert.course.title}</GradientText>
            </p>
          </div>

          {/* Détails */}
          <div className="mt-7 grid gap-x-8 divide-y divide-navy/[0.06] border-t border-navy/[0.06] sm:grid-cols-2 sm:divide-y-0">
            <DetailRow
              icon={<FolderOpen size={18} />}
              label="Catégorie"
            >
              {category ?? "Formation Access Academy"}
            </DetailRow>
            <DetailRow icon={<Signal size={18} />} label="Niveau">
              {levelLabel(cert.course.level)}
            </DetailRow>
            <DetailRow icon={<UserRound size={18} />} label="Formateur">
              {instructor}
            </DetailRow>
            <DetailRow
              icon={<CalendarDays size={18} />}
              label="Date de délivrance"
            >
              {formatDate(cert.issuedAt)}
            </DetailRow>
            <DetailRow icon={<Hash size={18} />} label="Code du certificat">
              <span className="break-all font-mono text-sm">{cert.code}</span>
            </DetailRow>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/api/certificates/${code}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({
                variant: "primary",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              <Download size={18} />
              Télécharger le certificat (PDF)
            </a>
            <Link
              href="/courses"
              className={cn(
                buttonClasses({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              Découvrir les formations
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-relaxed text-text-muted">
        Ce certificat a été émis par Access Academy, la plateforme e-learning de
        Digital Access. Son authenticité est garantie par ce code unique et
        vérifiable en ligne.
      </p>
    </Reveal>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await getCertificateByCode(code);

  return (
    <section className="relative overflow-hidden bg-surface-secondary py-16 sm:py-20 lg:py-24">
      <BrandBackdrop />
      <Container className="flex justify-center">
        {cert ? (
          <CertificateVerified cert={cert} code={code} />
        ) : (
          <CertificateNotFound code={code} />
        )}
      </Container>
    </section>
  );
}
