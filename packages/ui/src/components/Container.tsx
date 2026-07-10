import * as React from "react";
import { cn } from "../lib/cn";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  // « full » = largeur d'application confortable pour les espaces connectés
  // (tableaux de bord, portail) — bien plus large que le site vitrine.
  full: "max-w-[1600px]",
};

/** Conteneur centré avec gouttières responsives. */
export function Container({
  size = "xl",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-5 sm:px-8 lg:px-10", sizes[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
