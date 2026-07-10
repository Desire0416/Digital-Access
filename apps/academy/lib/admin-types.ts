/* ══════════════════════════════════════════════════════════════════════════
   Types du back-office d'administration (Phase 5).
   Toutes les LECTURES sont derrière la garde du layout /admin ; toutes les
   MUTATIONS revérifient le rôle admin (requireAdminUser). Aucune élévation.
   ══════════════════════════════════════════════════════════════════════════ */

export interface AdminStats {
  users: number;
  learners: number;
  instructors: number;
  admins: number;
  schools: number;
  careerPaths: number;
  publishedPaths: number;
  shortCourses: number;
  enrollments: number;
  completions: number;
  submissionsPending: number;
  submissionsValidated: number;
  certificates: number;
  badgesAwarded: number;
  /** Inscriptions par école (pour le graphe). */
  enrollmentsBySchool: { label: string; value: number }[];
  /** Entonnoir des soumissions par statut. */
  submissionFunnel: { label: string; value: number }[];
}

export interface AdminSchoolRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  order: number;
  careerPathCount: number;
  shortCourseCount: number;
}

export interface AdminSchoolEdit {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  icon: string | null;
  color: string | null;
  image: string | null;
  order: number;
  status: string;
}

export interface AdminPathRow {
  id: string;
  title: string;
  slug: string;
  schoolName: string;
  schoolId: string;
  level: string;
  status: string;
  price: number;
  featured: boolean;
  enrollmentCount: number;
  projectCount: number;
}

export interface AdminPathEdit {
  id: string;
  title: string;
  targetJob: string;
  shortDescription: string;
  schoolId: string;
  level: string;
  price: number;
  duration: string | null;
  featured: boolean;
  status: string;
}

export interface AdminShortCourseRow {
  id: string;
  title: string;
  slug: string;
  schoolName: string;
  schoolId: string;
  level: string;
  status: string;
  price: number;
  featured: boolean;
}

export interface AdminShortCourseEdit {
  id: string;
  title: string;
  shortDescription: string;
  schoolId: string;
  level: string;
  price: number;
  duration: string | null;
  courseType: string | null;
  coverImage: string | null;
  featured: boolean;
  status: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  enrollmentCount: number;
}

export interface AdminSubmissionRow {
  id: string;
  learnerName: string;
  projectTitle: string;
  careerPathTitle: string;
  status: string;
  score: number | null;
  reviewerName: string | null;
  submittedAt: string | null;
}

export interface AdminCertificateRow {
  id: string;
  learnerName: string;
  courseTitle: string;
  certificateNumber: string;
  certificateType: string;
  mention: string | null;
  finalScore: number | null;
  status: string;
  issuedAt: string;
}

export interface AdminCouponRow {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

/** Écoles pour les <select> des formulaires parcours/formations. */
export interface SchoolOption {
  id: string;
  name: string;
}
