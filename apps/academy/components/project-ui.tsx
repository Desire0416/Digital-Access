import { cn } from "@da/ui";
import { SUBMISSION_STATUS_LABEL } from "@/lib/learn-labels";

/* Pastille d'état de soumission (server component, sans état) — partagée
   entre la liste des projets, l'espace de travail et la file de relecture. */

const TONE: Record<string, string> = {
  NOT_STARTED: "bg-navy/[0.06] text-text-secondary",
  IN_PROGRESS: "bg-brand-blue-vif/10 text-brand-blue-royal",
  SUBMITTED: "bg-accent/10 text-accent",
  UNDER_REVIEW: "bg-accent/10 text-accent",
  REVISION_REQUESTED: "bg-warning/15 text-warning",
  VALIDATED: "bg-success/10 text-success",
  REJECTED: "bg-error/10 text-error",
  PORTFOLIO_READY: "bg-success/10 text-success",
};

export function SubmissionBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        TONE[status] ?? TONE.NOT_STARTED,
        className,
      )}
    >
      {SUBMISSION_STATUS_LABEL[status] ?? status}
    </span>
  );
}
