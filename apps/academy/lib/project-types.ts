import type { Level } from "./types";

/* ══════════════════════════════════════════════════════════════════════════
   Types du moteur de projets & certification (Phase 4).
   Principe CDC : « pas de certification sans projet, pas d'employabilité sans
   preuve ». Un apprenant dépose une soumission (liens + images + déclaration IA),
   un relecteur (formateur/reviewer/admin) l'évalue à la grille ; une validation
   décerne un badge par preuve, enrichit le portfolio et peut délivrer le certificat.
   ══════════════════════════════════════════════════════════════════════════ */

export type SubmissionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "VALIDATED"
  | "REJECTED"
  | "PORTFOLIO_READY";

export interface SubmissionLink {
  label: string;
  url: string;
}
export interface SubmissionFile {
  url: string;
  name: string;
}
export interface RubricCriterion {
  label: string;
  points: number;
  description?: string;
}

/** Carte de projet dans la liste apprenant. */
export interface ProjectCard {
  id: string;
  slug: string;
  title: string;
  projectType: string;
  level: Level;
  careerPathTitle: string;
  careerPathSlug: string;
  isPortfolioEligible: boolean;
  requiresSubmission: boolean;
  estimatedDuration: number | null;
  /** Statut de MA soumission (NOT_STARTED si aucune). */
  status: SubmissionStatus;
  score: number | null;
}

/** Ma soumission pour un projet. */
export interface MySubmission {
  id: string;
  status: SubmissionStatus;
  links: SubmissionLink[];
  files: SubmissionFile[];
  comment: string | null;
  aiDeclaration: string | null;
  score: number | null;
  feedback: string | null;
  version: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerName: string | null;
}

/** Espace de travail d'un projet (brief + grille + ma soumission). */
export interface ProjectWorkspace {
  id: string;
  slug: string;
  title: string;
  projectType: string;
  level: Level;
  context: string | null;
  problem: string | null;
  mission: string | null;
  objectives: string[];
  deliverables: string[];
  constraints: string[];
  estimatedDuration: number | null;
  requiresDefense: boolean;
  isPortfolioEligible: boolean;
  careerPathTitle: string;
  careerPathSlug: string;
  rubric: { title: string; totalPoints: number; passingScore: number; criteria: RubricCriterion[] } | null;
  enrolled: boolean;
  submission: MySubmission | null;
}

/** Élément de la file de relecture. */
export interface ReviewQueueItem {
  submissionId: string;
  projectTitle: string;
  projectSlug: string;
  projectType: string;
  careerPathTitle: string;
  learnerName: string;
  status: SubmissionStatus;
  version: number;
  submittedAt: string | null;
}

/** Détail d'une soumission côté relecteur. */
export interface ReviewDetail {
  submissionId: string;
  status: SubmissionStatus;
  links: SubmissionLink[];
  files: SubmissionFile[];
  comment: string | null;
  aiDeclaration: string | null;
  score: number | null;
  feedback: string | null;
  version: number;
  submittedAt: string | null;
  learner: { id: string; name: string; email: string | null };
  project: {
    title: string;
    slug: string;
    projectType: string;
    context: string | null;
    problem: string | null;
    mission: string | null;
    objectives: string[];
    deliverables: string[];
    careerPathTitle: string;
  };
  rubric: { title: string; totalPoints: number; passingScore: number; criteria: RubricCriterion[] } | null;
}

/** Données publiques de vérification d'un certificat (/verify/[code]). */
export interface PublicCertificate {
  valid: boolean;
  learnerName: string;
  courseTitle: string;
  certificateType: string;
  mention: string | null;
  finalScore: number | null;
  issuedAt: string;
  certificateNumber: string;
  skillsValidated: string[];
  status: string; // ACTIVE / REVOKED / …
}
