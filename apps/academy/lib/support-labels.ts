import type { TicketCategory, TicketPriority, TicketStatus } from "@da/academy-db/client";
import type { PillTone } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Libellés FR partagés du support (cahier §35). Constantes pures (imports
   UNIQUEMENT de types → effacés à la compilation) → importable côté serveur
   ET client sans embarquer le client Prisma. Même pattern que
   equivalence-labels.ts.
   ══════════════════════════════════════════════════════════════════════════ */

/** Ordre d'affichage des catégories dans le formulaire de création. */
export const TICKET_CATEGORIES: TicketCategory[] = [
  "TECHNICAL",
  "PAYMENT",
  "COURSE_CONTENT",
  "CERTIFICATE",
  "ACCOUNT",
  "OTHER",
];

export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> = {
  TECHNICAL: "Problème technique",
  PAYMENT: "Paiement & facturation",
  COURSE_CONTENT: "Contenu de formation",
  CERTIFICATE: "Certificats",
  ACCOUNT: "Compte & connexion",
  OTHER: "Autre",
};

export const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours de traitement",
  WAITING_LEARNER: "En attente de votre réponse",
  RESOLVED: "Résolu",
  CLOSED: "Clôturé",
};

export const TICKET_STATUS_TONE: Record<TicketStatus, PillTone> = {
  OPEN: "info",
  IN_PROGRESS: "violet",
  WAITING_LEARNER: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};
