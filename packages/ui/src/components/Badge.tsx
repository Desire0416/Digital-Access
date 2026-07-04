import * as React from "react";
import { cn } from "../lib/cn";

export type BadgeVariant =
  | "default"
  | "gradient"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "soft";

const variants: Record<BadgeVariant, string> = {
  default: "bg-navy/[0.06] text-navy",
  gradient: "bg-gradient-da text-white shadow-brand",
  outline: "border border-navy/15 text-navy",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-[#B45309]",
  info: "bg-info/10 text-info",
  soft: "bg-brand-blue-vif/10 text-brand-blue-royal",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** Pastille / tag arrondi. */
export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold leading-none tracking-tight",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
