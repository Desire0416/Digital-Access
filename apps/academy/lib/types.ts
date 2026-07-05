/**
 * Types de domaine d'Access Academy — contrat entre la couche de données
 * (lib/queries.ts, lib/actions.ts) et les pages/composants.
 */

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ChapterType = "VIDEO" | "TEXT" | "QUIZ" | "EXERCISE" | "ASSIGNMENT";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  courseCount: number;
}

export interface CourseCardData {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  coverImage: string | null;
  price: number; // FCFA
  isFree: boolean;
  level: CourseLevel;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  durationMinutes: number;
  chapterCount: number;
  category: { name: string; slug: string; color: string | null; icon: string | null };
  instructor: { name: string; avatar: string | null };
}

export interface ChapterMeta {
  id: string;
  title: string;
  type: ChapterType;
  position: number;
  isPreview: boolean;
  videoDuration: number; // secondes
}

export interface ModuleWithChapters {
  id: string;
  title: string;
  position: number;
  chapters: ChapterMeta[];
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string; // ISO
  user: { name: string; avatar: string | null };
}

export interface CourseDetailData extends CourseCardData {
  description: string;
  objectives: string[];
  prerequisites: string[];
  language: string;
  publishedAt: string | null; // ISO
  instructorBio: string | null;
  modules: ModuleWithChapters[];
  reviews: ReviewItem[];
}

export interface EnrollmentInfo {
  id: string;
  progress: number; // 0–100
  completedAt: string | null;
  completedChapterIds: string[];
  quizScores: Record<string, number>; // chapterId → meilleur score
}

export interface QuizQuestionData {
  id: string;
  question: string;
  options: string[];
  /** Indices des bonnes réponses — utilisés pour le feedback immédiat ;
   *  la notation OFFICIELLE reste côté serveur (submitQuiz). */
  correctAnswers: number[];
  explanation: string | null;
  position: number;
  multiple: boolean; // QCM (plusieurs réponses) vs QCU
}

export interface QuizData {
  id: string;
  passingScore: number; // %
  maxAttempts: number | null;
  timeLimit: number | null; // secondes
  questions: QuizQuestionData[];
}

export interface PlayerChapter extends ChapterMeta {
  /** null si non inscrit et chapitre non-preview (contenu verrouillé) */
  content: string | null;
  videoUrl: string | null;
  resources: { label: string; url: string }[];
  quiz: QuizData | null;
  locked: boolean;
}

export interface PlayerModule {
  id: string;
  title: string;
  position: number;
  chapters: PlayerChapter[];
}

export interface PlayerData {
  course: {
    id: string;
    title: string;
    slug: string;
    isFree: boolean;
    instructor: { name: string; avatar: string | null };
  };
  modules: PlayerModule[];
  /** Chapitres aplatis dans l'ordre pédagogique (module.position, chapter.position) */
  flatChapters: PlayerChapter[];
  enrollment: EnrollmentInfo | null;
}

export interface DashboardEnrollment {
  course: CourseCardData;
  progress: number;
  completedAt: string | null;
  enrolledAt: string;
  /** Prochain chapitre non complété (reprise de lecture) */
  nextChapterId: string | null;
  completedChapters: number;
}

export interface DashboardData {
  user: { name: string; email: string; streak: number; xp: number };
  enrollments: DashboardEnrollment[];
  stats: {
    inProgress: number;
    completed: number;
    chaptersCompleted: number;
    minutesLearned: number;
  };
}
