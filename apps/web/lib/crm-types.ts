/**
 * Types partagés et libellés FR du CRM commercial (module pur, réutilisable
 * côté serveur ET client). Les `*_TONES` mappent chaque statut vers une tonalité
 * de `StatusPill` (@/components/admin/ui). Les tuples `*_VALUES` servent aux
 * schémas Zod des Server Actions.
 */

export type Tone = "violet" | "blue" | "cyan" | "green" | "amber" | "red" | "slate";

/* ─── Priorité ──────────────────────────────────────────────────────────────── */
export const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITY_VALUES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute", URGENT: "Urgente",
};
export const PRIORITY_TONE: Record<Priority, Tone> = {
  LOW: "slate", MEDIUM: "blue", HIGH: "amber", URGENT: "red",
};

/* ─── Type d'organisation ───────────────────────────────────────────────────── */
export const ORG_TYPE_VALUES = [
  "COMPANY", "SCHOOL", "UNIVERSITY", "FIRM", "CLINIC", "NGO",
  "ASSOCIATION", "PUBLIC_INSTITUTION", "PROFESSIONAL", "OTHER",
] as const;
export type OrganizationType = (typeof ORG_TYPE_VALUES)[number];
export const ORG_TYPE_LABEL: Record<OrganizationType, string> = {
  COMPANY: "Entreprise", SCHOOL: "École", UNIVERSITY: "Université", FIRM: "Cabinet",
  CLINIC: "Clinique", NGO: "ONG", ASSOCIATION: "Association",
  PUBLIC_INSTITUTION: "Institution", PROFESSIONAL: "Particulier professionnel", OTHER: "Autre",
};

/* ─── Cycle de vie ──────────────────────────────────────────────────────────── */
export const LIFECYCLE_VALUES = [
  "PROSPECT", "LEAD", "OPPORTUNITY", "CLIENT", "PARTNER", "FORMER_CLIENT", "ARCHIVED",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_VALUES)[number];
export const LIFECYCLE_LABEL: Record<LifecycleStage, string> = {
  PROSPECT: "Prospect", LEAD: "Lead", OPPORTUNITY: "Opportunité", CLIENT: "Client",
  PARTNER: "Partenaire", FORMER_CLIENT: "Ancien client", ARCHIVED: "Archivé",
};
export const LIFECYCLE_TONE: Record<LifecycleStage, Tone> = {
  PROSPECT: "slate", LEAD: "blue", OPPORTUNITY: "violet", CLIENT: "green",
  PARTNER: "cyan", FORMER_CLIENT: "amber", ARCHIVED: "slate",
};

/* ─── Statut prospect ───────────────────────────────────────────────────────── */
export const PROSPECT_STATUS_VALUES = [
  "TO_ANALYZE", "AUDIT_IN_PROGRESS", "AUDIT_COMPLETED", "READY_TO_CONTACT", "CONTACTED",
  "FOLLOW_UP_REQUIRED", "ENGAGED", "QUALIFIED", "CONVERTED_TO_OPPORTUNITY",
  "NOT_INTERESTED", "UNREACHABLE", "POSTPONED", "ARCHIVED",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUS_VALUES)[number];
export const PROSPECT_STATUS_LABEL: Record<ProspectStatus, string> = {
  TO_ANALYZE: "À analyser", AUDIT_IN_PROGRESS: "Audit en cours", AUDIT_COMPLETED: "Audit terminé",
  READY_TO_CONTACT: "Prêt à contacter", CONTACTED: "Contacté", FOLLOW_UP_REQUIRED: "À relancer",
  ENGAGED: "Échange engagé", QUALIFIED: "Qualifié", CONVERTED_TO_OPPORTUNITY: "Converti",
  NOT_INTERESTED: "Non intéressé", UNREACHABLE: "Injoignable", POSTPONED: "Reporté", ARCHIVED: "Archivé",
};
export const PROSPECT_STATUS_TONE: Record<ProspectStatus, Tone> = {
  TO_ANALYZE: "slate", AUDIT_IN_PROGRESS: "blue", AUDIT_COMPLETED: "cyan",
  READY_TO_CONTACT: "violet", CONTACTED: "blue", FOLLOW_UP_REQUIRED: "amber",
  ENGAGED: "cyan", QUALIFIED: "green", CONVERTED_TO_OPPORTUNITY: "green",
  NOT_INTERESTED: "red", UNREACHABLE: "slate", POSTPONED: "amber", ARCHIVED: "slate",
};
/** Colonnes du Kanban prospects (dans l'ordre ; hors POSTPONED/ARCHIVED). */
export const PROSPECT_KANBAN_STAGES: ProspectStatus[] = [
  "TO_ANALYZE", "AUDIT_IN_PROGRESS", "AUDIT_COMPLETED", "READY_TO_CONTACT", "CONTACTED",
  "FOLLOW_UP_REQUIRED", "ENGAGED", "QUALIFIED", "CONVERTED_TO_OPPORTUNITY", "NOT_INTERESTED", "UNREACHABLE",
];

/* ─── Statut / gravité / catégorie d'audit ──────────────────────────────────── */
export const AUDIT_STATUS_VALUES = [
  "DRAFT", "IN_PROGRESS", "INTERNAL_REVIEW", "TO_VALIDATE", "VALIDATED",
  "READY_TO_SEND", "SENT", "OUTDATED", "ARCHIVED",
] as const;
export type AuditStatus = (typeof AUDIT_STATUS_VALUES)[number];
export const AUDIT_STATUS_LABEL: Record<AuditStatus, string> = {
  DRAFT: "Brouillon", IN_PROGRESS: "En cours", INTERNAL_REVIEW: "Revue interne", TO_VALIDATE: "À valider",
  VALIDATED: "Validé", READY_TO_SEND: "Prêt à envoyer", SENT: "Envoyé", OUTDATED: "Obsolète", ARCHIVED: "Archivé",
};
export const AUDIT_STATUS_TONE: Record<AuditStatus, Tone> = {
  DRAFT: "slate", IN_PROGRESS: "blue", INTERNAL_REVIEW: "cyan", TO_VALIDATE: "amber",
  VALIDATED: "green", READY_TO_SEND: "violet", SENT: "green", OUTDATED: "red", ARCHIVED: "slate",
};

export const AUDIT_SEVERITY_VALUES = ["LOW", "MODERATE", "MAJOR", "CRITICAL"] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITY_VALUES)[number];
export const AUDIT_SEVERITY_LABEL: Record<AuditSeverity, string> = {
  LOW: "Faible", MODERATE: "Modérée", MAJOR: "Majeure", CRITICAL: "Critique",
};
export const AUDIT_SEVERITY_TONE: Record<AuditSeverity, Tone> = {
  LOW: "slate", MODERATE: "blue", MAJOR: "amber", CRITICAL: "red",
};

export const AUDIT_CATEGORY_VALUES = [
  "SECURITY", "PERFORMANCE", "UX", "MOBILE", "SEO", "CONTENT", "INSTITUTIONAL_IMAGE",
  "CONVERSION", "ACCESSIBILITY", "COMPLIANCE", "MAINTENANCE", "DIGITAL_STRATEGY",
  "ECOMMERCE", "ENROLLMENT", "SUPPORT", "INFRASTRUCTURE",
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORY_VALUES)[number];
export const AUDIT_CATEGORY_LABEL: Record<AuditCategory, string> = {
  SECURITY: "Sécurité", PERFORMANCE: "Performance", UX: "Expérience utilisateur", MOBILE: "Mobile",
  SEO: "Référencement (SEO)", CONTENT: "Contenu", INSTITUTIONAL_IMAGE: "Image institutionnelle",
  CONVERSION: "Conversion", ACCESSIBILITY: "Accessibilité", COMPLIANCE: "Conformité",
  MAINTENANCE: "Maintenance", DIGITAL_STRATEGY: "Stratégie digitale", ECOMMERCE: "E-commerce",
  ENROLLMENT: "Inscriptions", SUPPORT: "Support", INFRASTRUCTURE: "Infrastructure",
};

export const DOC_TYPE_VALUES = [
  "INTERNAL_REPORT", "CLIENT_REPORT", "PDF", "DOCX", "SCREENSHOT", "EVIDENCE", "PRESENTATION", "OTHER",
] as const;
export type AuditDocType = (typeof DOC_TYPE_VALUES)[number];
export const DOC_TYPE_LABEL: Record<AuditDocType, string> = {
  INTERNAL_REPORT: "Rapport interne", CLIENT_REPORT: "Rapport client", PDF: "PDF", DOCX: "Word",
  SCREENSHOT: "Capture", EVIDENCE: "Preuve", PRESENTATION: "Présentation", OTHER: "Autre",
};

export const DOC_VISIBILITY_VALUES = [
  "INTERNAL_ONLY", "COMMERCIAL_TEAM", "CLIENT_SHAREABLE", "SHARED_WITH_CLIENT",
] as const;
export type DocVisibility = (typeof DOC_VISIBILITY_VALUES)[number];
export const DOC_VISIBILITY_LABEL: Record<DocVisibility, string> = {
  INTERNAL_ONLY: "Interne uniquement", COMMERCIAL_TEAM: "Équipe commerciale",
  CLIENT_SHAREABLE: "Partageable au client", SHARED_WITH_CLIENT: "Partagé avec le client",
};

/* ─── Activités ─────────────────────────────────────────────────────────────── */
export const ACTIVITY_TYPE_VALUES = [
  "NOTE", "CALL", "EMAIL", "WHATSAPP", "MEETING", "DOCUMENT_SENT", "AUDIT_SENT",
  "RESPONSE_RECEIVED", "FOLLOW_UP", "STATUS_CHANGE", "QUOTE_SENT", "PAYMENT_RECEIVED", "OTHER",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPE_VALUES)[number];
export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  NOTE: "Note", CALL: "Appel", EMAIL: "Email", WHATSAPP: "WhatsApp", MEETING: "Réunion",
  DOCUMENT_SENT: "Document envoyé", AUDIT_SENT: "Audit envoyé", RESPONSE_RECEIVED: "Réponse reçue",
  FOLLOW_UP: "Relance", STATUS_CHANGE: "Changement de statut", QUOTE_SENT: "Devis envoyé",
  PAYMENT_RECEIVED: "Paiement reçu", OTHER: "Autre",
};

/* ─── Tâches ────────────────────────────────────────────────────────────────── */
export const TASK_STATUS_VALUES = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"] as const;
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "À faire", IN_PROGRESS: "En cours", COMPLETED: "Terminée", CANCELLED: "Annulée", OVERDUE: "En retard",
};
export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = {
  TODO: "slate", IN_PROGRESS: "blue", COMPLETED: "green", CANCELLED: "slate", OVERDUE: "red",
};
export const TASK_TYPE_VALUES = [
  "CALL", "EMAIL", "WHATSAPP", "MEETING", "FOLLOW_UP", "AUDIT", "QUOTE", "ADMIN", "OTHER",
] as const;
export type TaskType = (typeof TASK_TYPE_VALUES)[number];
export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  CALL: "Appel", EMAIL: "Email", WHATSAPP: "WhatsApp", MEETING: "Réunion", FOLLOW_UP: "Relance",
  AUDIT: "Audit", QUOTE: "Devis", ADMIN: "Administratif", OTHER: "Autre",
};

/* ─── Opportunités (Deal) ───────────────────────────────────────────────────── */
export const DEAL_STAGE_VALUES = [
  "TO_QUALIFY", "NEED_CONFIRMED", "MEETING_SCHEDULED", "SOLUTION_PREPARATION", "PROPOSAL_SENT",
  "QUOTE_SENT", "NEGOTIATION", "VERBAL_AGREEMENT", "DEPOSIT_PENDING", "WON", "LOST", "POSTPONED", "ON_HOLD",
] as const;
export type DealStage = (typeof DEAL_STAGE_VALUES)[number];
export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  TO_QUALIFY: "À qualifier", NEED_CONFIRMED: "Besoin confirmé", MEETING_SCHEDULED: "Rendez-vous",
  SOLUTION_PREPARATION: "Solution en préparation", PROPOSAL_SENT: "Proposition envoyée",
  QUOTE_SENT: "Devis envoyé", NEGOTIATION: "Négociation", VERBAL_AGREEMENT: "Accord verbal",
  DEPOSIT_PENDING: "Acompte attendu", WON: "Gagné", LOST: "Perdu", POSTPONED: "Reporté", ON_HOLD: "En attente",
};
export const DEAL_STAGE_TONE: Record<DealStage, Tone> = {
  TO_QUALIFY: "slate", NEED_CONFIRMED: "blue", MEETING_SCHEDULED: "blue", SOLUTION_PREPARATION: "cyan",
  PROPOSAL_SENT: "cyan", QUOTE_SENT: "violet", NEGOTIATION: "amber", VERBAL_AGREEMENT: "green",
  DEPOSIT_PENDING: "amber", WON: "green", LOST: "red", POSTPONED: "slate", ON_HOLD: "slate",
};
/** Colonnes du Kanban opportunités (hors POSTPONED/ON_HOLD, gérés en filtre). */
export const DEAL_KANBAN_STAGES: DealStage[] = [
  "TO_QUALIFY", "NEED_CONFIRMED", "MEETING_SCHEDULED", "SOLUTION_PREPARATION", "PROPOSAL_SENT",
  "QUOTE_SENT", "NEGOTIATION", "VERBAL_AGREEMENT", "DEPOSIT_PENDING", "WON", "LOST",
];

export const DEAL_CONVERSION_VALUES = ["NOT_REQUESTED", "PENDING", "VALIDATED", "REJECTED"] as const;
export type DealConversionStatus = (typeof DEAL_CONVERSION_VALUES)[number];
export const DEAL_CONVERSION_LABEL: Record<DealConversionStatus, string> = {
  NOT_REQUESTED: "—", PENDING: "Conversion demandée", VALIDATED: "Conversion validée", REJECTED: "Conversion refusée",
};

/* ─── Devis ─────────────────────────────────────────────────────────────────── */
export const QUOTE_STATUS_VALUES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUS_VALUES)[number];
export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  DRAFT: "Brouillon", SENT: "Envoyé", ACCEPTED: "Accepté", REJECTED: "Refusé", EXPIRED: "Expiré",
};
export const QUOTE_STATUS_TONE: Record<QuoteStatus, Tone> = {
  DRAFT: "slate", SENT: "blue", ACCEPTED: "green", REJECTED: "red", EXPIRED: "amber",
};

/** Texte standard « Nécessité du numérique à notre ère » (modifiable par audit). */
export const DIGITAL_IMPORTANCE_STATEMENT =
  "À notre ère, le numérique constitue souvent le premier point de contact entre une organisation et son public. Avant un appel, une visite ou une prise de rendez-vous, les utilisateurs recherchent généralement des informations en ligne. La qualité, la sécurité et la clarté de cette présence numérique influencent directement la confiance, la crédibilité, la visibilité et la conversion.";

/* ═══════════════════════════ DTO (sérialisés RSC) ═══════════════════════════ */

export interface AssignableUser {
  id: string;
  name: string;
  roles: string[];
}

export interface ContactRow {
  id: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedinUrl: string | null;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  influenceLevel: string | null;
  preferredChannel: string | null;
  notes: string | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  sector: string | null;
  city: string | null;
  country: string | null;
  lifecycleStage: LifecycleStage;
  website: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  googleBusinessUrl: string | null;
  description: string | null;
  owner: { id: string; name: string } | null;
}

export interface ProspectCard {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  sector: string | null;
  city: string | null;
  status: ProspectStatus;
  priority: Priority | null;
  assignedTo: { id: string; name: string } | null;
  recommendedOffer: string | null;
  digitalMaturity: string | null;
  estimatedPotential: number | null;
  mainObservedNeed: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  lastActivityAt: string | null;
  lastAuditSeverity: AuditSeverity | null;
  auditCount: number;
  createdAt: string;
}

export interface ProspectActivityItem {
  id: string;
  type: ActivityType;
  subject: string | null;
  notes: string | null;
  activityDate: string;
  authorName: string | null;
}

export interface ProspectAuditItem {
  id: string;
  reference: string;
  title: string;
  status: AuditStatus;
  version: number;
  overallSeverity: AuditSeverity | null;
  findingCount: number;
  auditDate: string | null;
  createdAt: string;
}

export interface ProspectTaskItem {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  assignedToName: string | null;
}

export interface ProspectDealItem {
  id: string;
  title: string;
  stage: DealStage;
  estimatedAmount: number | null;
  probability: number | null;
  expectedCloseDate: string | null;
}

export interface ProspectDetail {
  id: string;
  status: ProspectStatus;
  priority: Priority | null;
  source: string | null;
  digitalMaturity: string | null;
  estimatedPotential: number | null;
  recommendedOffer: string | null;
  mainObservedNeed: string | null;
  contactStatus: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  organization: OrganizationSummary;
  contacts: ContactRow[];
  activities: ProspectActivityItem[];
  audits: ProspectAuditItem[];
  tasks: ProspectTaskItem[];
  deals: ProspectDealItem[];
}

/** Doublon potentiel détecté à la création d'une organisation/prospect. */
export interface DuplicateMatch {
  id: string;
  name: string;
  slug: string;
  reason: string; // « nom similaire », « même site web », « même email »…
  lifecycleStage: LifecycleStage;
}

export interface CommercialHomeStats {
  assignedProspects: number;
  toContact: number;
  auditsInProgress: number;
  auditsToValidate: number;
  followUpsToday: number;
  followUpsOverdue: number;
  openDeals: number;
  pipelineValue: number;
  wonDeals: number;
}

/* ─── Audits ────────────────────────────────────────────────────────────────── */

/** Statuts d'audit où l'auteur peut encore éditer (avant soumission). */
export const AUDIT_EDITABLE_STATUSES: AuditStatus[] = ["DRAFT", "IN_PROGRESS", "INTERNAL_REVIEW"];

export interface AuditFindingItem {
  id: string;
  title: string;
  category: AuditCategory;
  description: string | null;
  severity: AuditSeverity;
  businessImpact: string | null;
  userImpact: string | null;
  securityImpact: string | null;
  evidenceText: string | null;
  evidenceUrl: string | null;
  affectedPageUrl: string | null;
  recommendation: string | null;
  priorityOrder: number;
  isPublic: boolean;
}

export interface AuditDocumentItem {
  id: string;
  documentType: AuditDocType;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  size: number | null;
  version: number;
  visibility: DocVisibility;
  uploadedByName: string | null;
  createdAt: string;
}

export interface AuditContactOption {
  id: string;
  fullName: string;
}

export interface AuditDetail {
  id: string;
  reference: string;
  title: string;
  auditType: string | null;
  version: number;
  status: AuditStatus;
  overallSeverity: AuditSeverity | null;
  summary: string | null;
  methodology: string | null;
  digitalImportanceStatement: string | null;
  auditDate: string | null;
  lastVerifiedAt: string | null;
  reviewNote: string | null;
  internalNotes: string | null;
  validatedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  /** Dérivé du statut : l'auteur peut modifier le contenu. */
  editable: boolean;
  organization: { id: string; name: string };
  prospectId: string | null;
  author: { id: string; name: string } | null;
  validatedByName: string | null;
  sentByName: string | null;
  recipientContact: { id: string; fullName: string } | null;
  contacts: AuditContactOption[];
  findings: AuditFindingItem[];
  documents: AuditDocumentItem[];
}

export interface AuditListRow {
  id: string;
  reference: string;
  title: string;
  status: AuditStatus;
  overallSeverity: AuditSeverity | null;
  findingCount: number;
  organizationName: string;
  prospectId: string | null;
  authorName: string | null;
  auditDate: string | null;
  updatedAt: string;
}
