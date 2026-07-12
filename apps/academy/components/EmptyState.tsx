import Link from "next/link";
import { buttonClasses, cn, Monogram } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   État vide brandé DA — monogramme estompé, message, action optionnelle.
   Composant serveur-compatible, réutilisable partout (catalogue, espace…).
   ══════════════════════════════════════════════════════════════════════════ */

export interface EmptyStateProps {
  /** Icône personnalisée ; à défaut, le monogramme DA estompé. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy/[0.12] bg-surface-secondary/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative mb-5 grid place-items-center">
        <span className="absolute h-16 w-16 rounded-full bg-gradient-da opacity-[0.08] blur-xl" aria-hidden />
        {icon ?? <Monogram size={44} className="opacity-40 grayscale" />}
      </div>
      <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-secondary">{description}</p>}
      {action && (
        <Link href={action.href} className={buttonClasses({ size: "sm", className: "mt-6" })}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
