import type { EquivalenceEvidenceType, EquivalenceStatus } from "@da/academy-db/client";
import type { PillTone } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Libellés FR partagés des équivalences (cahier §22.3-22.4). Constantes pures
   (imports UNIQUEMENT de types → effacés à la compilation) → importable côté
   serveur ET client sans embarquer le client Prisma.
   ══════════════════════════════════════════════════════════════════════════ */

export const EVIDENCE_TYPES: EquivalenceEvidenceType[] = [
  "CERTIFICATE",
  "DIPLOMA",
  "PORTFOLIO",
  "EXPERIENCE",
  "TEST",
];

export const EVIDENCE_TYPE_LABEL: Record<EquivalenceEvidenceType, string> = {
  CERTIFICATE: "Certificat",
  DIPLOMA: "Diplôme",
  PORTFOLIO: "Portfolio",
  EXPERIENCE: "Preuve d'expérience",
  TEST: "Résultat de test",
};

/** Indication affichée sous chaque type de preuve (aide au dépôt). */
export const EVIDENCE_TYPE_HINT: Record<EquivalenceEvidenceType, string> = {
  CERTIFICATE: "Attestation ou certificat obtenu ailleurs (organisme, plateforme…).",
  DIPLOMA: "Diplôme ou titre reconnu couvrant ces compétences.",
  PORTFOLIO: "Réalisations personnelles ou professionnelles démontrant la maîtrise.",
  EXPERIENCE: "Expérience professionnelle (poste, missions, durée) à décrire précisément.",
  TEST: "Résultat d'un test ou d'une évaluation externe.",
};

export const EQUIVALENCE_STATUS_LABEL: Record<EquivalenceStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  PARTIAL: "Partielle",
  CONDITIONAL: "Conditionnelle",
  REJECTED: "Refusée",
};

export const EQUIVALENCE_STATUS_TONE: Record<EquivalenceStatus, PillTone> = {
  PENDING: "warning",
  ACCEPTED: "success",
  PARTIAL: "info",
  CONDITIONAL: "violet",
  REJECTED: "danger",
};

/** Ce que chaque décision produit concrètement (affiché à l'apprenant & à l'admin). */
export const EQUIVALENCE_DECISION_EFFECT: Record<
  Exclude<EquivalenceStatus, "PENDING">,
  string
> = {
  ACCEPTED: "Dispense totale — la formation est reconnue comme acquise (accès ouvert, prix déduit dans les parcours).",
  PARTIAL: "Reconnaissance partielle — accès gratuit à la formation pour compléter ce qui manque.",
  CONDITIONAL: "Aucun accès ouvert pour l'instant — l'apprenant doit d'abord remplir la condition (à préciser dans la note), puis redéposer une demande.",
  REJECTED: "Demande refusée — aucun accès accordé (motif communiqué à l'apprenant).",
};

/** Les 4 décisions possibles pour un administrateur (ordre d'affichage). */
export const EQUIVALENCE_DECISIONS: Exclude<EquivalenceStatus, "PENDING">[] = [
  "ACCEPTED",
  "PARTIAL",
  "CONDITIONAL",
  "REJECTED",
];
