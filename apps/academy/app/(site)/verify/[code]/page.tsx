import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, ShieldX, Award, Calendar, Hash, GraduationCap } from "lucide-react";
import { Section, Container, GradientText } from "@da/ui";
import { getCertificateByNumber } from "@/lib/project-queries";
import { CERTIFICATE_TYPE_LABEL, CERTIFICATE_MENTION_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vérification de certificat — Digital Access Academy",
  description: "Vérifiez l'authenticité d'un certificat délivré par Digital Access Academy.",
  robots: { index: false, follow: false },
};

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; // déjà décodé par Next
  const cert = await getCertificateByNumber(code);
  const valid = cert?.valid === true;

  return (
    <Section spacing="lg" className="min-h-[80vh] pt-24">
      <Container size="md">
        {/* Bandeau d'état */}
        <div
          className={
            "relative overflow-hidden rounded-3xl p-8 text-center text-white sm:p-10 " +
            (valid ? "bg-navy" : "bg-navy/95")
          }
        >
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-da opacity-30 blur-3xl" />
          <div className="relative">
            <span
              className={
                "mx-auto grid h-16 w-16 place-items-center rounded-2xl shadow-brand " +
                (valid ? "bg-success text-white" : cert ? "bg-warning text-white" : "bg-error text-white")
              }
            >
              {valid ? <ShieldCheck size={32} /> : cert ? <ShieldAlert size={32} /> : <ShieldX size={32} />}
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">Vérification de certificat</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
              {valid ? (
                <>Certificat <GradientText>authentique</GradientText></>
              ) : cert ? (
                "Certificat non valide"
              ) : (
                "Certificat introuvable"
              )}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
              {valid
                ? "Ce certificat a bien été délivré par Digital Access Academy et est actuellement valide."
                : cert
                  ? `Ce certificat existe mais son statut est « ${cert.status} ». Contactez-nous en cas de doute.`
                  : "Aucun certificat ne correspond à ce code. Vérifiez le numéro saisi."}
            </p>
          </div>
        </div>

        {/* Détails du certificat */}
        {cert && (
          <div className="mt-6 rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                <Award size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-blue-royal">
                  {CERTIFICATE_TYPE_LABEL[cert.certificateType] ?? cert.certificateType}
                </p>
                <h2 className="mt-0.5 font-display text-xl font-bold text-navy">{cert.courseTitle}</h2>
                <p className="mt-1 text-sm text-text-secondary">Délivré à <span className="font-semibold text-navy">{cert.learnerName}</span></p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-navy/[0.06] bg-surface-secondary/50 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted"><Hash size={13} /> Numéro</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-navy">{cert.certificateNumber}</dd>
              </div>
              <div className="rounded-xl border border-navy/[0.06] bg-surface-secondary/50 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted"><Calendar size={13} /> Délivré le</dt>
                <dd className="mt-1 text-sm font-semibold text-navy">{DATE.format(new Date(cert.issuedAt))}</dd>
              </div>
              <div className="rounded-xl border border-navy/[0.06] bg-surface-secondary/50 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted"><GraduationCap size={13} /> Mention</dt>
                <dd className="mt-1 text-sm font-semibold text-navy">
                  {cert.mention ? CERTIFICATE_MENTION_LABEL[cert.mention] ?? cert.mention : "—"}
                  {cert.finalScore != null && <span className="ml-1 text-text-muted">· {cert.finalScore}%</span>}
                </dd>
              </div>
            </dl>

            {cert.skillsValidated.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Compétences attestées</p>
                <div className="flex flex-wrap gap-1.5">
                  {cert.skillsValidated.map((s) => (
                    <span key={s} className="rounded-md bg-brand-blue-vif/10 px-2.5 py-1 text-xs font-medium text-brand-blue-royal">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Digital Access Academy —{" "}
          <Link href="/certifications" className="font-semibold text-brand-blue-royal hover:text-brand-violet">
            en savoir plus sur nos certifications
          </Link>
        </p>
      </Container>
    </Section>
  );
}
