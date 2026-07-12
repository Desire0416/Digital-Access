import Link from "next/link";
import { cn, Monogram } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Primitives du back-office Access Academy (cahier §30). Composants serveur,
   brandés DA (dégradé signature, font-display, rounded-xl). Réutilisés par
   toutes les pages /admin.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── En-tête de page ──────────────────────────────────────────────────────── */

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-blue-royal">
            <span className="h-1 w-4 rounded-full bg-gradient-da" aria-hidden />
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ─── Carte de contenu ─────────────────────────────────────────────────────── */

export function AdminCard({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-navy/[0.07] bg-surface-primary shadow-[0_1px_2px_rgba(26,26,46,0.04)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ─── Carte de statistique (optionnellement cliquable) ─────────────────────── */

const STAT_ACCENTS: Record<string, string> = {
  violet: "from-brand-violet to-brand-blue-royal",
  blue: "from-brand-blue-royal to-brand-blue-vif",
  cyan: "from-brand-blue-vif to-brand-cyan",
  gradient: "from-brand-violet to-brand-cyan",
  amber: "from-warning to-[#fbbf24]",
  green: "from-success to-[#34d399]",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "gradient",
  sublabel,
  href,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: keyof typeof STAT_ACCENTS;
  sublabel?: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r opacity-90",
          STAT_ACCENTS[accent] ?? STAT_ACCENTS.gradient,
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-text-secondary">{label}</p>
        {icon && (
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm",
              STAT_ACCENTS[accent] ?? STAT_ACCENTS.gradient,
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-[1.9rem] font-bold leading-none tracking-tight text-navy">{value}</p>
      {sublabel && <p className="mt-1.5 text-xs text-text-muted">{sublabel}</p>}
    </>
  );

  const cls = cn(
    "relative overflow-hidden rounded-2xl border bg-surface-primary p-5 shadow-[0_1px_2px_rgba(26,26,46,0.04)] transition-all",
    highlight ? "border-warning/40 bg-warning/[0.03]" : "border-navy/[0.07]",
    href && "hover:-translate-y-0.5 hover:border-brand-blue-vif/30 hover:shadow-lg",
  );

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ─── Pastille de statut (tons sémantiques) ────────────────────────────────── */

export type PillTone = "neutral" | "success" | "warning" | "danger" | "info" | "violet";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "bg-navy/[0.06] text-text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-[#b45309]",
  danger: "bg-error/10 text-error",
  info: "bg-brand-blue-vif/10 text-brand-blue-royal",
  violet: "bg-brand-violet/10 text-brand-violet",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        PILL_TONES[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </span>
  );
}

/* ─── État vide admin ──────────────────────────────────────────────────────── */

export function AdminEmpty({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-4 grid place-items-center">
        <span className="absolute h-14 w-14 rounded-full bg-gradient-da opacity-[0.08] blur-xl" aria-hidden />
        {icon ?? <Monogram size={38} className="opacity-40 grayscale" />}
      </div>
      <h3 className="font-display text-base font-bold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/* ─── Mapping statut de contenu → libellé + ton ────────────────────────────── */

export const CONTENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  REVIEW: "En revue",
  APPROVED: "Approuvé",
  SCHEDULED: "Programmé",
  PUBLISHED: "Publié",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archivé",
};

export const CONTENT_STATUS_TONE: Record<string, PillTone> = {
  DRAFT: "neutral",
  REVIEW: "warning",
  APPROVED: "info",
  SCHEDULED: "info",
  PUBLISHED: "success",
  SUSPENDED: "danger",
  ARCHIVED: "neutral",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  PARTIAL: "Partiel",
  PAID: "Validé",
  FAILED: "Rejeté",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
  EXPIRED: "Expiré",
};

export const PAYMENT_STATUS_TONE: Record<string, PillTone> = {
  PENDING: "warning",
  PARTIAL: "info",
  PAID: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
  REFUNDED: "violet",
  EXPIRED: "neutral",
};

export const CERTIFICATE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
  EXPIRED: "Expiré",
  REPLACED: "Remplacé",
};

export const CERTIFICATE_STATUS_TONE: Record<string, PillTone> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  REVOKED: "danger",
  EXPIRED: "neutral",
  REPLACED: "neutral",
};

export const PAYMENT_PURPOSE_LABEL: Record<string, string> = {
  COURSE: "Formation",
  CAREER_PATH: "Parcours",
  COHORT: "Cohorte",
  CERTIFICATION: "Certification",
  OTHER: "Autre",
};
