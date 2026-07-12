import { CheckCircle2, FileEdit, Send, Clock, AlertTriangle, XCircle } from "lucide-react";

/* Métadonnées d'affichage des statuts de soumission de projet (§41.4).
   Extrait dans un module partagé : un fichier `page.tsx` ne peut exporter que
   les champs de route reconnus par Next — pas de constante métier. */

export type SubmissionMeta = { label: string; badge: string; icon: typeof CheckCircle2 };

export const SUBMISSION_META: Record<string, SubmissionMeta> = {
  DRAFT: { label: "Brouillon", badge: "bg-navy/[0.06] text-navy/70", icon: FileEdit },
  SUBMITTED: { label: "En attente de correction", badge: "bg-info/10 text-info", icon: Send },
  UNDER_REVIEW: { label: "En cours de correction", badge: "bg-info/10 text-info", icon: Clock },
  CHANGES_REQUESTED: { label: "Modifications demandées", badge: "bg-warning/10 text-[#B45309]", icon: AlertTriangle },
  APPROVED: { label: "Validé", badge: "bg-success/10 text-success", icon: CheckCircle2 },
  REJECTED: { label: "Refusé", badge: "bg-error/10 text-error", icon: XCircle },
};

export const NOT_SUBMITTED: SubmissionMeta = { label: "À rendre", badge: "bg-navy/[0.06] text-navy/70", icon: Send };
