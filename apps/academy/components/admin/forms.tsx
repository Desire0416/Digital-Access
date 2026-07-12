import * as React from "react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Primitives de formulaire du back-office (champs natifs brandés DA + helpers
   tableau ↔ texte). Partagées par les constructeurs formations / parcours /
   écoles. Présentationnelles : utilisables Server comme Client.
   ══════════════════════════════════════════════════════════════════════════ */

export const inputClass =
  "w-full rounded-xl border border-navy/[0.12] bg-surface-primary px-3.5 py-2.5 text-sm text-navy placeholder:text-text-muted transition-colors focus:border-brand-blue-vif/40 focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25 disabled:cursor-not-allowed disabled:opacity-50";

export const textareaClass = cn(inputClass, "min-h-[96px] resize-y leading-relaxed");

export function FieldLabel({
  label,
  hint,
  htmlFor,
  required,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

/** Convertit un textarea multi-lignes en tableau nettoyé. */
export function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Convertit un tableau en texte multi-lignes pour un textarea. */
export function arrayToLines(value: string[] | null | undefined): string {
  return (value ?? []).join("\n");
}
