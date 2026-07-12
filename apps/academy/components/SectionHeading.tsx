import { cn, GradientText } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   En-tête de section Access Academy — sur-titre à filet dégradé, titre
   display avec mot en dégradé signature, sous-titre. Serveur-compatible.
   ══════════════════════════════════════════════════════════════════════════ */

export interface SectionHeadingProps {
  /** Sur-titre en capitales (optionnel). */
  eyebrow?: string;
  /** Partie du titre en couleur navy. */
  title: React.ReactNode;
  /** Partie du titre rendue avec le dégradé signature (à la suite du titre). */
  gradient?: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  gradient,
  subtitle,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <span
          className={cn(
            "mb-3 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal",
            align === "center" && "justify-center",
          )}
        >
          <span className="h-px w-7 bg-gradient-da" aria-hidden />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-2xl font-bold leading-[1.15] tracking-tight text-navy sm:text-3xl lg:text-4xl">
        {title}
        {gradient && (
          <>
            {" "}
            <GradientText>{gradient}</GradientText>
          </>
        )}
      </h2>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-text-secondary sm:text-lg">{subtitle}</p>}
    </div>
  );
}
