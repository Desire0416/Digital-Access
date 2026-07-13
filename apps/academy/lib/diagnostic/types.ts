/* Types du test de positionnement IA d'une formation (cahier §22.2).
   Passé AVANT de démarrer : l'IA génère des questions ciblées, évalue le
   candidat, et rend un VERDICT d'orientation. */

export type DiagLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

/** Verdict de positionnement (§22.2). */
export type DiagVerdict = "DIRECT_ACCESS" | "PREPARATORY" | "ORIENTATION" | "DISPENSATION";

/** Contexte de la formation passé à l'IA pour cibler le test. */
export interface DiagnosticContext {
  slug: string;
  title: string;
  level: string; // niveau propre de la formation
  subtitle: string;
  objectives: string[];
  prerequisites: string[];
  tools: string[];
  skills: string[];
  moduleTitles: string[]; // ordonnés
}

/** Une question du test (options ordonnées débutant → avancé). */
export interface DiagQuestion {
  id: string;
  question: string;
  dimension: string; // ex. « Expérience », « Concepts », « Pratique »
  options: string[];
}

/** Une réponse de l'apprenant : index de l'option choisie. */
export interface DiagAnswer {
  id: string;
  choice: number;
}

/** Résultat du test produit par l'IA. */
export interface DiagResult {
  recommendedLevel: DiagLevel;
  levelLabel: string; // « Débutant » | « Intermédiaire » | « Avancé »
  verdict: DiagVerdict;
  score: number; // 0-100
  confidence: string; // « élevée » | « moyenne » | « à confirmer »
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string; // comment aborder CETTE formation
  startingPoint: string; // ex. « Commencez au Module 1 » / « Démarrez au Module 4 »
}

export const LEVEL_LABEL: Record<DiagLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export const VERDICT_LABEL: Record<DiagVerdict, string> = {
  DIRECT_ACCESS: "Accès direct",
  PREPARATORY: "Préparation conseillée",
  ORIENTATION: "Réorientation suggérée",
  DISPENSATION: "Niveau avancé — dispense possible",
};
