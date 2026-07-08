import type { Level } from "./types";

/* ══════════════════════════════════════════════════════════════════════════
   Types de l'espace apprenant : player de leçon, quiz, tableau de bord.
   Le player travaille sur les PARCOURS MÉTIERS (les formations courtes n'ont pas
   encore de leçons seedées). Sécurité : jamais de correctAnswer côté client.
   ══════════════════════════════════════════════════════════════════════════ */

export type QuizType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

/** Question envoyée au client : SANS la bonne réponse ni l'explication. */
export interface QuizQuestionForRunner {
  id: string;
  question: string;
  type: QuizType;
  options: string[];
  points: number;
}

export interface QuizForRunner {
  id: string;
  title: string;
  passingScore: number;
  attemptsAllowed: number; // 0 = illimité
  questions: QuizQuestionForRunner[];
}

/** Résultat d'une soumission (renvoyé après scoring serveur). */
export interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
  perQuestion: {
    questionId: string;
    correct: boolean;
    correctAnswer: number[]; // index(es) de la/des bonne(s) option(s)
    explanation: string | null;
  }[];
}

export interface LessonOutline {
  id: string;
  title: string;
  lessonType: string;
  estimatedDuration: number | null;
  isPreview: boolean;
  hasQuiz: boolean;
  completed: boolean;
}

export interface ModuleOutline {
  id: string;
  title: string;
  description: string | null;
  lessons: LessonOutline[];
}

/** Vue « player » d'un parcours : programme + état d'inscription/progression. */
export interface PlayerCourse {
  id: string;
  slug: string;
  title: string;
  targetJob: string;
  level: Level;
  enrolled: boolean;
  enrollmentStatus: string | null;
  progress: number; // 0..100
  modules: ModuleOutline[];
  totalLessons: number;
  completedLessons: number;
  firstLessonId: string | null;
  resumeLessonId: string | null; // 1re leçon non terminée, sinon 1re leçon
}

/** Leçon détaillée pour l'affichage dans le player. */
export interface PlayerLesson {
  id: string;
  title: string;
  lessonType: string;
  content: string | null;
  videoUrl: string | null;
  estimatedDuration: number | null;
  isPreview: boolean;
  completed: boolean;
  canAccess: boolean; // inscrit OU leçon en accès libre (preview)
  course: { slug: string; title: string; targetJob: string };
  moduleTitle: string;
  quiz: QuizForRunner | null;
  prevLessonId: string | null;
  nextLessonId: string | null;
  positionLabel: string; // ex. « Leçon 3 / 20 »
}

/* ─── Tableau de bord ──────────────────────────────────────────────────────── */

export interface EnrolledCourseCard {
  enrollmentId: string;
  slug: string;
  title: string;
  targetJob: string;
  level: Level;
  coverImage: string | null;
  status: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  resumeLessonId: string | null;
}

export interface DashboardStats {
  enrolled: number;
  completed: number;
  lessonsCompleted: number;
  badges: number;
  certificates: number;
}

export interface DashboardData {
  name: string;
  emailVerified: boolean;
  stats: DashboardStats;
  inProgress: EnrolledCourseCard[];
  completed: EnrolledCourseCard[];
  nextUp: {
    slug: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
  } | null;
  recentBadges: MyBadge[];
}

export interface MyBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  issuedAt: string | null; // ISO ; null = non encore obtenu (verrouillé)
  earned: boolean;
}

export interface MyCertificate {
  id: string;
  title: string;
  certificateType: string;
  certificateNumber: string;
  mention: string | null;
  finalScore: number | null;
  verificationUrl: string | null;
  issuedAt: string;
  skillsValidated: string[];
}

export interface MyPortfolioItem {
  id: string;
  title: string;
  description: string | null;
  toolsUsed: string[];
  skillsUsed: string[];
  images: string[];
  demoUrl: string | null;
  sourceUrl: string | null;
  visibility: string;
  createdAt: string;
}

export interface SkillPassportEntry {
  slug: string;
  name: string;
  category: string;
  fromPaths: string[]; // titres des parcours qui développent cette compétence
  validated: boolean; // présente dans un certificat obtenu
}

export interface OpportunityCard {
  id: string;
  title: string;
  type: string;
  companyName: string;
  location: string | null;
  remote: boolean;
  requiredSkills: string[];
  matchScore: number; // 0..100 : recouvrement avec les compétences de l'apprenant
}
