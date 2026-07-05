/** Types du studio instructeur (création/édition de cours). */

export type CourseStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type ChapterType = "VIDEO" | "TEXT" | "QUIZ" | "EXERCISE" | "ASSIGNMENT";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface StudioCourseListItem {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  coverImage: string | null;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  category: string;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  chapterCount: number;
  reviewNote: string | null;
  updatedAt: string; // ISO
}

export interface InstructorStats {
  totalCourses: number;
  published: number;
  inReview: number;
  drafts: number;
  totalStudents: number;
  avgRating: number;
  revenue: number; // FCFA — paiements COURSE COMPLETED sur ses cours
}

export interface InstructorDashboard {
  stats: InstructorStats;
  courses: StudioCourseListItem[];
}

export interface StudioQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string | null;
  position: number;
}

export interface StudioQuiz {
  id: string;
  passingScore: number;
  maxAttempts: number | null;
  questions: StudioQuizQuestion[];
}

export interface StudioChapter {
  id: string;
  title: string;
  type: ChapterType;
  content: string | null;
  videoUrl: string | null;
  videoDuration: number;
  isPreview: boolean;
  position: number;
  resources: { label: string; url: string }[];
  quiz: StudioQuiz | null;
}

export interface StudioModule {
  id: string;
  title: string;
  position: number;
  chapters: StudioChapter[];
}

export interface StudioCourseEdit {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  coverImage: string | null;
  price: number;
  isFree: boolean;
  level: CourseLevel;
  language: string;
  status: CourseStatus;
  categoryId: string;
  objectives: string[];
  prerequisites: string[];
  reviewNote: string | null;
  chapterCount: number;
  modules: StudioModule[];
  /** L'utilisateur courant est-il admin (peut valider/publier) ? */
  isAdmin: boolean;
}

export interface AdminCourseItem {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  level: CourseLevel;
  category: string;
  price: number;
  isFree: boolean;
  chapterCount: number;
  enrollmentCount: number;
  instructor: { name: string; email: string; avatar: string | null };
  submittedAt: string; // ISO (updatedAt)
  reviewNote: string | null;
}
