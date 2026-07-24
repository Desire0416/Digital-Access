import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Download,
  QrCode,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Route as RouteIcon,
  GraduationCap,
  BadgeCheck,
  Medal,
  Sparkles,
} from "lucide-react";
import { StaggerGroup, StaggerItem, cn } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getMyCertificates } from "@/lib/learn-queries";
import { CERTIFICATE_TYPE_LABEL, CERTIFICATE_TYPE_SHORT, isSkillBadge } from "@/lib/certificate-types";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader } from "@/components/espace/parts";

export const metadata: Metadata = { title: "Mes certificats" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Valide",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
  EXPIRED: "Expiré",
  REPLACED: "Remplacé",
};

/** Icône par type de crédential (§20.1). */
const TYPE_ICON: Record<string, LucideIcon> = {
  PARTICIPATION: Award,
  COURSE: GraduationCap,
  SPECIALIZATION: Medal,
  EXPERTISE: Medal,
  CAREER_PATH: RouteIcon,
  SKILL_BADGE: BadgeCheck,
};

type Cert = Awaited<ReturnType<typeof getMyCertificates>>[number];

export default async function MyCertificatesPage() {
  const user = await requireUser("/espace/certificats");
  const certificates = await getMyCertificates(user.id);
  const formal = certificates.filter((c) => !isSkillBadge(c.type));
  const badges = certificates.filter((c) => isSkillBadge(c.type));

  return (
    <div>
      <EspaceHeader
        title="Mes certificats"
        subtitle="Vos certificats et badges nominatifs, vérifiables publiquement et téléchargeables en PDF."
        action={{ label: "Vérifier un certificat", href: "/certificats/verifier" }}
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award size={40} className="text-brand-violet/40" />}
          title="Vous n'avez pas encore de certificat"
          description="Terminez une formation ou un parcours pour obtenir votre premier certificat Access Academy."
          action={{ label: "Commencer une formation", href: "/formations" }}
        />
      ) : (
        <div className="space-y-10">
          {formal.length > 0 && (
            <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {formal.map((cert) => (
                <StaggerItem key={cert.id}>
                  <CertificateCard cert={cert} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}

          {badges.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent/15 to-brand-cyan/15 text-accent" aria-hidden>
                  <Sparkles size={16} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-navy">Badges de compétence</h2>
                  <p className="text-xs text-text-secondary">Décernés à la validation d'une formation — chacun est vérifiable.</p>
                </div>
              </div>
              <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((cert) => (
                  <StaggerItem key={cert.id}>
                    <BadgeCard cert={cert} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Certificat formel (participation / formation / spécialisation / parcours) ─ */
function CertificateCard({ cert }: { cert: Cert }) {
  const active = cert.status === "ACTIVE";
  const target = cert.course ?? cert.careerPath ?? null;
  const Icon = TYPE_ICON[cert.type] ?? GraduationCap;
  const typeLabel = CERTIFICATE_TYPE_LABEL[cert.type] ?? "Certificat";
  const targetKind = cert.careerPath ? "Parcours métier" : cert.course ? "Formation" : null;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface-primary",
        active ? "border-brand-violet/20" : "border-navy/[0.08]",
      )}
    >
      <span className="h-1 w-full bg-gradient-da" aria-hidden />
      {active && (
        <span className="pointer-events-none absolute -right-10 -top-6 h-32 w-32 rounded-full bg-gradient-da opacity-[0.07] blur-2xl" aria-hidden />
      )}

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-violet/15 to-brand-cyan/15 text-brand-violet"
            aria-hidden
          >
            <Icon size={22} />
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              active ? "bg-success/10 text-success" : "bg-error/10 text-error",
            )}
          >
            {active ? <ShieldCheck size={12} aria-hidden /> : <ShieldX size={12} aria-hidden />}
            {STATUS_LABEL[cert.status] ?? cert.status}
          </span>
        </div>

        <span className="mt-3.5 inline-flex w-fit items-center rounded-full bg-navy/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-violet">
          {typeLabel}
        </span>
        <h2 className="mt-1.5 font-display text-base font-bold leading-snug text-navy">{cert.title}</h2>
        {target && targetKind && (
          <p className="mt-0.5 text-xs text-text-secondary">
            {targetKind} · {target.title}
          </p>
        )}

        <dl className="mt-4 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">Numéro</dt>
            <dd className="font-mono font-semibold text-navy">{cert.number}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">Délivré le</dt>
            <dd className="font-medium text-navy">{dateFmt.format(cert.issuedAt)}</dd>
          </div>
          {cert.mention && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-text-secondary">Mention</dt>
              <dd className="font-semibold text-brand-violet">
                {cert.mention}
                {cert.score !== null ? ` · ${cert.score}%` : ""}
              </dd>
            </div>
          )}
        </dl>

        {cert.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cert.skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-medium text-navy/75">
                {s}
              </span>
            ))}
            {cert.skills.length > 4 && (
              <span className="rounded-full border border-navy/10 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                +{cert.skills.length - 4}
              </span>
            )}
          </div>
        )}

        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-text-muted">
          <QrCode size={13} aria-hidden />
          QR de vérification inclus dans le PDF · code{" "}
          <span className="font-mono font-semibold text-navy">{cert.verifyCode}</span>
        </p>

        <div className="mt-auto flex items-center gap-2 pt-5">
          {active ? (
            <a
              href={`/api/certificats/${cert.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Download size={15} aria-hidden />
              Télécharger le PDF
            </a>
          ) : (
            <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-navy/10 px-4 py-2.5 text-sm font-semibold text-text-muted">
              PDF indisponible
            </span>
          )}
          <Link
            href={`/certificats/verifier?code=${cert.verifyCode}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-navy/10 px-3 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
          >
            <ExternalLink size={15} aria-hidden />
            <span className="hidden sm:inline">Vérifier</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─── Badge de compétence (crédential léger, §20.1) ─────────────────────────── */
function BadgeCard({ cert }: { cert: Cert }) {
  const active = cert.status === "ACTIVE";
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-surface-primary p-4",
        active ? "border-accent/25" : "border-navy/[0.08]",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent/15 to-brand-cyan/15 text-accent" aria-hidden>
          <BadgeCheck size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-accent">{CERTIFICATE_TYPE_SHORT.SKILL_BADGE}</p>
          <h3 className="truncate font-display text-sm font-bold leading-snug text-navy" title={cert.title}>
            {cert.title}
          </h3>
        </div>
      </div>

      {cert.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cert.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-accent/[0.08] px-2 py-0.5 text-[11px] font-medium text-accent">
              {s}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-text-muted">
        Code <span className="font-mono font-semibold text-navy">{cert.verifyCode}</span>
      </p>

      <div className="mt-auto flex items-center gap-2 pt-4">
        {active && (
          <a
            href={`/api/certificats/${cert.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent/30 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/[0.06]"
          >
            <Download size={13} aria-hidden />
            PDF
          </a>
        )}
        <Link
          href={`/certificats/verifier?code=${cert.verifyCode}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy/10 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
        >
          <ExternalLink size={13} aria-hidden />
          Vérifier
        </Link>
      </div>
    </article>
  );
}
