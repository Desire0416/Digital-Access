import * as React from "react";
import { cn } from "../lib/cn";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Fond alterné : blanc (défaut), gris très léger, ou sombre. */
  tone?: "default" | "muted" | "dark";
  /** Espacement vertical. */
  spacing?: "sm" | "md" | "lg";
}

const tones = {
  default: "bg-surface-primary",
  muted: "bg-surface-secondary",
  dark: "bg-surface-dark text-white",
};

const spacings = {
  sm: "py-14 sm:py-16",
  md: "py-20 sm:py-24",
  lg: "py-24 sm:py-32",
};

/** Section de page — respiration généreuse, fonds alternés (jamais tout blanc). */
export function Section({
  tone = "default",
  spacing = "md",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("relative", tones[tone], spacings[spacing], className)} {...props}>
      {children}
    </section>
  );
}
