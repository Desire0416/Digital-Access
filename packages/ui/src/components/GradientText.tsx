import * as React from "react";
import { cn } from "../lib/cn";

/** Texte au dégradé signature violet→cyan. */
export function GradientText({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("text-gradient-da", className)} {...props}>
      {children}
    </span>
  );
}
