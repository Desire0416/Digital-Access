import * as React from "react";
import { cn } from "../lib/cn";

export interface LogoProps {
  /** "color" = lockup officiel (fond clair) · "white" = lockup blanc (fond sombre) */
  variant?: "color" | "white";
  /** hauteur du logo en px */
  height?: number;
  className?: string;
}

const SRC: Record<"color" | "white", string> = {
  color: "/Logo_Digital_Access.svg",
  white: "/Logo_Digital_Access_blanc.svg",
};

/**
 * Logo officiel Digital Access (lockup monogramme + wordmark), servi depuis /public.
 * La largeur s'ajuste automatiquement selon le ratio du SVG.
 */
export function Logo({ variant = "color", height = 48, className }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt="Digital Access"
      height={height}
      style={{ height }}
      draggable={false}
      className={cn("w-auto select-none", className)}
    />
  );
}
