import * as React from "react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Primitives partagées du back-office (server-safe : pas de "use client").
   ══════════════════════════════════════════════════════════════════════════ */

export type Tone = "violet" | "blue" | "cyan" | "green" | "amber" | "red" | "slate";

const TONE_CLASSES: Record<Tone, string> = {
  violet: "bg-brand-violet/10 text-brand-violet",
  blue: "bg-brand-blue-royal/10 text-brand-blue-royal",
  cyan: "bg-brand-cyan/15 text-[#0891a6]",
  green: "bg-success/10 text-success",
  amber: "bg-warning/15 text-[#B45309]",
  red: "bg-error/10 text-error",
  slate: "bg-navy/[0.06] text-text-secondary",
};

const TONE_DOT: Record<Tone, string> = {
  violet: "#5b3fa8",
  blue: "#2b5cc6",
  cyan: "#00bcd4",
  green: "#059669",
  amber: "#f59e0b",
  red: "#dc2626",
  slate: "#9ca3af",
};

export function toneColor(tone: Tone): string {
  return TONE_DOT[tone];
}

/** Pastille de statut brandée. */
export function StatusPill({
  label,
  tone,
  dot = true,
  className,
}: {
  label: string;
  tone: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE_DOT[tone] }} />
      )}
      {label}
    </span>
  );
}

/* ─────────────────────── Dictionnaires de statuts ──────────────────────── */

export const LEAD_STATUS: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: "Nouveau", tone: "blue" },
  CONTACTED: { label: "Contacté", tone: "cyan" },
  QUOTE_SENT: { label: "Devis envoyé", tone: "violet" },
  NEGOTIATION: { label: "Négociation", tone: "amber" },
  WON: { label: "Gagné", tone: "green" },
  LOST: { label: "Perdu", tone: "red" },
};

export const PROJECT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "En attente", tone: "amber" },
  IN_PROGRESS: { label: "En cours", tone: "blue" },
  REVIEW: { label: "En révision", tone: "violet" },
  DELIVERED: { label: "Livré", tone: "green" },
  MAINTENANCE: { label: "Maintenance", tone: "cyan" },
  ARCHIVED: { label: "Archivé", tone: "slate" },
};

export const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Brouillon", tone: "slate" },
  SENT: { label: "Envoyée", tone: "amber" },
  PAID: { label: "Payée", tone: "green" },
  OVERDUE: { label: "En retard", tone: "red" },
  CANCELLED: { label: "Annulée", tone: "slate" },
};

export const TICKET_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Ouvert", tone: "blue" },
  IN_PROGRESS: { label: "En cours", tone: "amber" },
  RESOLVED: { label: "Résolu", tone: "green" },
  CLOSED: { label: "Fermé", tone: "slate" },
};

export const TICKET_PRIORITY: Record<string, { label: string; tone: Tone }> = {
  LOW: { label: "Basse", tone: "slate" },
  MEDIUM: { label: "Moyenne", tone: "blue" },
  HIGH: { label: "Haute", tone: "amber" },
  URGENT: { label: "Urgente", tone: "red" },
};

export const BLOG_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Brouillon", tone: "slate" },
  PUBLISHED: { label: "Publié", tone: "green" },
  ARCHIVED: { label: "Archivé", tone: "amber" },
};

export const PROJECT_TYPE: Record<string, string> = {
  SITE_VITRINE: "Site vitrine",
  SITE_INSTITUTIONNEL: "Site institutionnel",
  ELEARNING: "E-learning",
  REFONTE: "Refonte",
  MAINTENANCE: "Maintenance",
  OTHER: "Autre",
};

/* ────────────────────────────── En-tête de page ────────────────────────── */

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

/* ─────────────────────────────────── KPI ───────────────────────────────── */

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "violet",
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl",
            TONE_CLASSES[tone],
          )}
        >
          {icon}
        </span>
        {hint && <span className="text-xs font-medium text-text-muted">{hint}</span>}
      </div>
      <p className="mt-4 font-display text-2xl font-extrabold text-navy sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-text-secondary">{label}</p>
    </div>
  );
}

/* ─────────────────────────────── État vide ─────────────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-primary/60 p-12 text-center">
      {icon && (
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white">
          {icon}
        </span>
      )}
      <p className="mt-4 font-display text-lg font-bold text-navy">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">{description}</p>
      )}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
