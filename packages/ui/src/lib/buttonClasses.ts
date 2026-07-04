import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "white";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-da text-white shadow-brand hover:-translate-y-0.5 hover:shadow-brand-lg active:translate-y-0 active:scale-[0.98]",
  secondary:
    "bg-navy text-white hover:bg-navy/90 hover:-translate-y-0.5 active:scale-[0.98]",
  outline:
    "border-2 border-navy/15 bg-surface-primary/40 text-navy hover:border-brand-blue-vif/60 hover:text-brand-blue-royal hover:-translate-y-0.5 active:scale-[0.98]",
  ghost: "text-navy hover:bg-navy/[0.06] active:scale-[0.98]",
  white:
    "bg-white text-navy shadow-sm hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
};

export function buttonClasses(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = "primary", size = "md", className } = opts ?? {};
  return cn(base, variants[variant], sizes[size], className);
}
