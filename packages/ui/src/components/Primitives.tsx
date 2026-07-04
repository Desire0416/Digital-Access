import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/cn";

/** Filet dégradé décoratif (rappel du logo). */
export function Divider({ className }: { className?: string }) {
  return (
    <span className={cn("block h-px w-12 rounded-full bg-gradient-da", className)} />
  );
}

/** Pastille icône en dégradé — pour les cards services/features. */
export function IconBadge({
  children,
  className,
  tone = "gradient",
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "gradient" | "soft" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    gradient: "bg-gradient-da text-white shadow-brand",
    soft: "bg-brand-blue-vif/10 text-brand-blue-royal",
    dark: "bg-navy text-white",
  };
  const sizes = {
    sm: "h-10 w-10 rounded-lg",
    md: "h-12 w-12 rounded-xl",
    lg: "h-14 w-14 rounded-2xl",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Avatar avec repli sur initiales. */
export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={cn("h-10 w-10 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-da text-sm font-bold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Étoiles de notation. */
export function StarRating({
  rating,
  className,
  size = 16,
}: {
  rating: number;
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(rating)
              ? "fill-warning text-warning"
              : "fill-navy/10 text-navy/10"
          }
        />
      ))}
    </span>
  );
}
