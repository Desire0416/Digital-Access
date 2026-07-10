import type {
  OrganizationType,
  AuditSeverity,
  AuditCategory,
} from "@/lib/crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Types partagés (client + serveur) de l'import de prospect par fichier.
   L'IA renvoie cette structure ; l'utilisateur la relit/corrige dans un
   formulaire ; l'action serveur la re-valide (Zod) avant création en base.
   ══════════════════════════════════════════════════════════════════════════ */

export interface ExtractedOrganization {
  name: string;
  legalName?: string;
  organizationType: OrganizationType;
  sector?: string;
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
}

export interface ExtractedProspectInfo {
  /** Besoin principal observé (souvent = synthèse de l'audit). */
  mainObservedNeed?: string;
  /** faible | moyenne | bonne | avancée */
  digitalMaturity?: string;
  recommendedOffer?: string;
  estimatedPotential?: number;
}

export interface ExtractedFinding {
  title: string;
  category: AuditCategory;
  severity: AuditSeverity;
  description?: string;
  businessImpact?: string;
  userImpact?: string;
  recommendation?: string;
  affectedPageUrl?: string;
  evidenceText?: string;
}

export interface ExtractedAudit {
  reference?: string;
  title: string;
  auditType?: string;
  summary?: string;
  methodology?: string;
  digitalImportanceStatement?: string;
  overallSeverity: AuditSeverity;
  /** Date de l'audit en ISO (YYYY-MM-DD) si détectée. */
  auditDate?: string;
  findings: ExtractedFinding[];
}

export interface ExtractedProspect {
  organization: ExtractedOrganization;
  prospect: ExtractedProspectInfo;
  audit: ExtractedAudit;
}

/** Métadonnées du fichier importé, stocké sur Vercel Blob. */
export interface ImportedDocumentMeta {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/** Réponse de la route d'analyse : données extraites + document stocké. */
export interface ImportAnalysisResult {
  extraction: ExtractedProspect;
  document: ImportedDocumentMeta;
  /** Avertissements non bloquants (ex. peu de constats détectés). */
  warnings?: string[];
}

/** Codes d'erreur d'import remontés à l'UI en français. */
export type ImportErrorCode =
  | "AI_KEY_MISSING"
  | "AI_NO_OUTPUT"
  | "AI_FAILED"
  | "EMPTY_TEXT"
  | "UNSUPPORTED"
  | "EXTRACT_FAILED";
