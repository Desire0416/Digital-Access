/* ══════════════════════════════════════════════════════════════════════════
   DTO du « brouillon de formation » produit par l'IA à partir d'un document,
   revu/édité par l'admin, puis transformé en CareerPath + Modules + Leçons +
   Quiz. Partagé client/serveur (aucune dépendance serveur ici).

   Le player ne note automatiquement que 3 types de questions ; l'import se
   limite donc à ceux-ci. Les indices corrects sont normalisés en number[]
   (1 élément pour SINGLE_CHOICE / TRUE_FALSE, 1+ pour MULTIPLE_CHOICE).
   ══════════════════════════════════════════════════════════════════════════ */

export type DraftLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type DraftLessonType = "TEXT" | "EXERCISE" | "RESOURCE" | "VIDEO";
export type DraftQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

export const DRAFT_LEVELS: DraftLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
export const DRAFT_LESSON_TYPES: DraftLessonType[] = ["TEXT", "EXERCISE", "RESOURCE", "VIDEO"];
export const DRAFT_QUESTION_TYPES: DraftQuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"];

export const LEVEL_LABEL_FR: Record<DraftLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export const LESSON_TYPE_LABEL_FR: Record<DraftLessonType, string> = {
  TEXT: "Cours",
  EXERCISE: "Travaux pratiques",
  RESOURCE: "Ressource",
  VIDEO: "Vidéo",
};

export interface DraftQuestion {
  question: string;
  type: DraftQuestionType;
  options: string[]; // pour TRUE_FALSE : ["Vrai", "Faux"]
  correctIndexes: number[]; // indices (0-based) des bonnes options
  explanation?: string;
}

export interface DraftLesson {
  title: string;
  type: DraftLessonType;
  content: string; // markdown
  estimatedDuration?: number; // minutes
}

export interface DraftQuiz {
  title: string;
  passingScore: number; // %
  questions: DraftQuestion[];
}

export interface DraftModule {
  title: string;
  summary?: string;
  objectives: string[];
  estimatedDuration?: number; // minutes
  lessons: DraftLesson[];
  quiz: DraftQuiz | null;
}

export interface DraftPath {
  title: string;
  slug: string;
  level: DraftLevel;
  targetJob: string;
  shortDescription: string;
  longDescription: string;
  duration: string; // libellé, ex. « 70 heures »
  estimatedHours: number | null;
  price: number; // FCFA — l'admin fixe (0 par défaut)
  prerequisites: string[];
  objectives: string[];
  outcomes: string[];
  tools: string[];
  certificateTitle: string;
  schoolSlug: string;
  schoolName: string;
  featured: boolean;
  publish: boolean; // true → PUBLISHED, false → DRAFT
}

export interface ImportDraft {
  path: DraftPath;
  modules: DraftModule[];
}

export interface ImportMeta {
  sourceFileName: string;
  model: string;
  moduleCount: number;
  lessonCount: number;
  quizCount: number;
  questionCount: number;
  warnings: string[];
}

export interface ImportAnalysis {
  draft: ImportDraft;
  meta: ImportMeta;
}

/** Compte les statistiques d'un brouillon (affichage + garde). */
export function draftStats(draft: ImportDraft): { modules: number; lessons: number; quizzes: number; questions: number } {
  let lessons = 0;
  let quizzes = 0;
  let questions = 0;
  for (const m of draft.modules) {
    lessons += m.lessons.length;
    if (m.quiz && m.quiz.questions.length > 0) {
      quizzes += 1;
      questions += m.quiz.questions.length;
    }
  }
  return { modules: draft.modules.length, lessons, quizzes, questions };
}
