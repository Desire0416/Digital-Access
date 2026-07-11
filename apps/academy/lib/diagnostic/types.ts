/* Types du diagnostic de maturité numérique (test IA avant formation). */

export type DiagLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

/** Contexte de la formation passé à l'IA pour cibler le diagnostic. */
export interface DiagnosticContext {
  slug: string;
  title: string;
  level: string; // niveau propre de la formation
  targetJob: string;
  shortDescription: string;
  objectives: string[];
  outcomes: string[];
  prerequisites: string[];
  tools: string[];
  skills: string[];
  moduleTitles: string[]; // ordonnés
}

/** Une question du diagnostic (options ordonnées débutant → avancé). */
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

/** Résultat du diagnostic produit par l'IA. */
export interface DiagResult {
  recommendedLevel: DiagLevel;
  levelLabel: string; // « Débutant » | « Intermédiaire » | « Avancé »
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
