import type { Metadata } from "next";
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  BadgeCheck,
  Calendar,
  Hash,
  User as UserIcon,
  Award,
} from "lucide-react";
import { Container, GradientText } from "@da/ui";
import { verifyCertificate, type CertificateVerification } from "@/lib/certification";
import { VerifyForm } from "@/components/certificate/VerifyForm";

export const metadata: Metadata = {
  title: "Vérifier un certificat",
  description:
    "Vérifiez l'authenticité d'un certificat Access Academy à partir de son code de vérification unique.",
};

const CERT_TYPE_LABEL: Record<string, string> = {
  COURSE: "Certificat de formation",
  CAREER_PATH: "Certification métier",
};

const INVALID_LABEL: Record<string, { title: string; message: string }> = {
  NOT_FOUND: {
    title: "Certificat introuvable",
    message: "Aucun certificat ne correspond à ce code. Vérifiez la saisie et réessayez.",
  },
  REVOKED: {
    title: "Certificat révoqué",
    message: "Ce certificat a été révoqué par Access Academy et n'est plus valide.",
  },
  SUSPENDED: {
    title: "Certificat suspendu",
    message: "Ce certificat est temporairement suspendu. Contactez Access Academy pour plus d'informations.",
  },
  EXPIRED: {
    title: "Certificat expiré",
    message: "La validité de ce certificat est arrivée à échéance.",
  },
  REPLACED: {
    title: "Certificat remplacé",
    message: "Ce certificat a été remplacé par une version plus récente.",
  },
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CI", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/* ─── Carte résultat VALIDE ─────────────────────────────────────────────── */
function ValidCard({ r }: { r: Extract<CertificateVerification, { valid: true }> }) {
  return (
    <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-success/25 bg-surface-primary shadow-lg">
      <div className="flex items-center gap-3 bg-gradient-to-r from-success/12 to-success/[0.04] px-6 py-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success text-white">
          <ShieldCheck size={24} />
        </span>
        <div>
          <p className="font-display text-lg font-bold text-navy">Certificat authentique</p>
          <p className="text-sm text-success">Vérifié auprès d'Access Academy — Digital Access</p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
          <Award size={13} />
          {CERT_TYPE_LABEL[r.type] ?? "Certificat"}
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-navy">{r.title}</h2>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <UserIcon size={18} className="mt-0.5 text-brand-blue-vif" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Titulaire</dt>
              <dd className="text-sm font-semibold text-navy">{r.holderName}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar size={18} className="mt-0.5 text-brand-blue-vif" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Délivré le</dt>
              <dd className="text-sm font-semibold text-navy">{formatDate(r.issuedAt)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hash size={18} className="mt-0.5 text-brand-blue-vif" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Numéro</dt>
              <dd className="font-mono text-sm font-semibold text-navy">{r.number}</dd>
            </div>
          </div>
          {r.mention && (
            <div className="flex items-start gap-3">
              <BadgeCheck size={18} className="mt-0.5 text-brand-blue-vif" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Mention</dt>
                <dd className="text-sm font-semibold text-navy">{r.mention}</dd>
              </div>
            </div>
          )}
        </dl>

        {r.skills.length > 0 && (
          <div className="mt-6 border-t border-navy/[0.08] pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Compétences validées</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {r.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-navy/10 bg-surface-secondary px-3 py-1 text-xs font-medium text-navy"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Carte résultat INVALIDE ───────────────────────────────────────────── */
function InvalidCard({ r }: { r: Extract<CertificateVerification, { valid: false }> }) {
  const label = INVALID_LABEL[r.reason] ?? INVALID_LABEL.NOT_FOUND;
  const isRevoked = r.reason === "REVOKED" || r.reason === "SUSPENDED";
  const Icon = isRevoked ? ShieldX : r.reason === "NOT_FOUND" ? ShieldAlert : ShieldX;

  return (
    <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-error/25 bg-surface-primary shadow-lg">
      <div className="flex items-center gap-3 bg-gradient-to-r from-error/12 to-error/[0.04] px-6 py-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-error text-white">
          <Icon size={24} />
        </span>
        <div>
          <p className="font-display text-lg font-bold text-navy">{label.title}</p>
          <p className="text-sm text-error">Ce certificat n'est pas valide</p>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-text-secondary">{label.message}</p>
        {r.title && (
          <p className="mt-4 rounded-lg bg-surface-secondary px-4 py-3 text-sm text-navy">
            Certificat concerné : <span className="font-semibold">{r.title}</span>
          </p>
        )}
        {r.revokedAt && (
          <p className="mt-3 text-xs text-text-muted">Révoqué le {formatDate(r.revokedAt)}.</p>
        )}
      </div>
    </div>
  );
}

export default async function VerifierCertificatPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const trimmed = code?.trim() ?? "";
  const result: CertificateVerification | null = trimmed ? await verifyCertificate(trimmed) : null;

  return (
    <div className="bg-surface-secondary/40 py-14 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface-primary px-3 py-1 text-xs font-semibold text-brand-blue-royal">
            <ShieldCheck size={14} />
            Vérification officielle
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Vérifiez un <GradientText>certificat</GradientText>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
            Saisissez le code de vérification unique d'un certificat Access Academy pour confirmer son authenticité, son
            titulaire et les compétences validées.
          </p>
        </div>

        <div className="mt-10">
          <VerifyForm initialCode={trimmed} />
        </div>

        {result && (result.valid ? <ValidCard r={result} /> : <InvalidCard r={result} />)}
      </Container>
    </div>
  );
}
