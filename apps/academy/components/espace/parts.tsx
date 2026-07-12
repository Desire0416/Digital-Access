import Link from "next/link";
import { cn, buttonClasses } from "@da/ui";
import { ENROLLMENT_STATUS_LABEL } from "@/lib/site";

/* Petits éléments serveur-compatibles partagés par les pages de l'espace (§16). */

/* ─── En-tête de page ──────────────────────────────────────────────────────── */

export function EspaceHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-text-secondary sm:text-base">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className={buttonClasses({ variant: "outline", size: "sm" })}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

/* ─── Tuile de statistique ─────────────────────────────────────────────────── */

export function StatTile({
  icon,
  value,
  label,
  href,
  accent = "text-brand-blue-royal",
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy/[0.04]", accent)} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-xl font-bold leading-none text-navy">{value}</p>
        <p className="mt-1 truncate text-xs text-text-secondary">{label}</p>
      </div>
    </>
  );
  const base =
    "flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow";
  return href ? (
    <Link href={href} className={cn(base, "hover:shadow-lg")}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

/* ─── Carte de section blanche ─────────────────────────────────────────────── */

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-base font-bold text-navy sm:text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ─── Pastille de statut d'inscription ─────────────────────────────────────── */

const ENROLLMENT_BADGE: Record<string, string> = {
  ACTIVE: "bg-info/10 text-info",
  COMPLETED: "bg-success/10 text-success",
  PAUSED: "bg-warning/10 text-[#B45309]",
  PENDING: "bg-navy/[0.06] text-navy/70",
  FAILED: "bg-error/10 text-error",
  EXPIRED: "bg-navy/[0.06] text-text-muted",
  CANCELLED: "bg-navy/[0.06] text-text-muted",
};

export function EnrollmentBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        ENROLLMENT_BADGE[status] ?? "bg-navy/[0.06] text-navy/70",
      )}
    >
      {ENROLLMENT_STATUS_LABEL[status] ?? status}
    </span>
  );
}
