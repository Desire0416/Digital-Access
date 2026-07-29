import { Info } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Avertissement légal sur la portée des certificats Access Academy.
   Access Academy n'est pas un établissement agréé et ne délivre aucun titre
   reconnu par l'État : ses certificats sont internes et non diplômants.
   Ce texte est normatif — ne pas le reformuler.
   Server Component : aucun état, aucune interactivité.
   ══════════════════════════════════════════════════════════════════════════ */

const DISCLAIMER_TEXT =
  "Les certificats délivrés par Access Academy sont des certificats internes de réussite, non diplômants. Ils attestent du suivi et de la validation d'un parcours de formation professionnelle courte, et ne constituent pas une certification professionnelle reconnue par l'État.";

export interface CertificateDisclaimerProps {
  /** "card" = encart visible ; "inline" = mention discrète en pied de bloc. */
  variant?: "card" | "inline";
  className?: string;
}

export function CertificateDisclaimer({
  variant = "card",
  className,
}: CertificateDisclaimerProps) {
  if (variant === "inline") {
    return (
      <p className={cn("text-xs leading-relaxed text-text-muted", className)}>
        {DISCLAIMER_TEXT}
      </p>
    );
  }

  return (
    <aside
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-navy/[0.08] bg-surface-secondary p-4 sm:gap-4 sm:p-5",
        className,
      )}
    >
      <span
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-royal/10 text-brand-blue-royal sm:h-9 sm:w-9"
        aria-hidden
      >
        <Info size={17} />
      </span>
      <p className="text-sm leading-relaxed text-text-secondary">{DISCLAIMER_TEXT}</p>
    </aside>
  );
}

export default CertificateDisclaimer;
