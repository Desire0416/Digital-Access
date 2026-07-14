import "server-only";
import {
  prisma,
  type EquivalenceEvidenceType,
  type EquivalenceStatus,
  type EnrollmentStatus,
} from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Équivalences / reconnaissance des acquis (cahier §22.3-22.4) — LECTURES.
   L'apprenant dépose une preuve pour faire reconnaître une formation ; un
   administrateur valide (acceptée / partielle / conditionnelle / refusée).
   INVARIANT : le dépôt ne donne jamais accès — cf. equivalence-actions.ts.
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES]; // ["ACTIVE","COMPLETED"]

export interface MyEquivalence {
  id: string;
  courseTitle: string;
  courseSlug: string;
  evidenceType: EquivalenceEvidenceType;
  description: string;
  proofUrl: string | null;
  proofLink: string | null;
  status: EquivalenceStatus;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

/** Demandes d'équivalence de l'apprenant (les plus récentes d'abord). */
export async function getMyEquivalences(userId: string): Promise<MyEquivalence[]> {
  const rows = await prisma.equivalenceRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      evidenceType: true,
      description: true,
      proofUrl: true,
      proofLink: true,
      status: true,
      reviewNote: true,
      createdAt: true,
      reviewedAt: true,
      course: { select: { title: true, slug: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    courseTitle: r.course.title,
    courseSlug: r.course.slug,
    evidenceType: r.evidenceType,
    description: r.description,
    proofUrl: r.proofUrl,
    proofLink: r.proofLink,
    status: r.status,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
  }));
}

export type EquivalenceEligibilityReason =
  | "OK"
  | "NOT_LOGGED"
  | "NOT_VERIFIED"
  | "ALREADY_ACQUIRED"
  | "PENDING"
  | "UNAVAILABLE";

export interface EquivalenceEligibility {
  /** true → afficher le bouton « faire reconnaître une équivalence ». */
  canRequest: boolean;
  reason: EquivalenceEligibilityReason;
  /** une demande est déjà en attente pour cette formation. */
  pending: boolean;
  /** statut de la dernière demande (pour informer l'apprenant). */
  lastStatus: EquivalenceStatus | null;
}

/**
 * Détermine si l'apprenant peut déposer une demande d'équivalence pour cette
 * formation. Ne lit QUE les données de l'utilisateur courant (non gardé admin).
 * `userId` null (visiteur) → NOT_LOGGED. La formation doit être disponible ;
 * un accès déjà acquis ou une demande en attente ferme le dépôt.
 */
export async function getEquivalenceEligibility(
  userId: string | null,
  courseId: string,
  opts?: { emailVerified?: boolean },
): Promise<EquivalenceEligibility> {
  if (!userId) return { canRequest: false, reason: "NOT_LOGGED", pending: false, lastStatus: null };

  const [enrollment, last] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    }),
    prisma.equivalenceRequest.findFirst({
      where: { userId, courseId },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
  ]);

  const pending = last?.status === "PENDING";
  const lastStatus = last?.status ?? null;

  if (enrollment && ACQUIRED.includes(enrollment.status))
    return { canRequest: false, reason: "ALREADY_ACQUIRED", pending, lastStatus };
  if (pending) return { canRequest: false, reason: "PENDING", pending: true, lastStatus };
  if (opts && opts.emailVerified === false)
    return { canRequest: false, reason: "NOT_VERIFIED", pending: false, lastStatus };

  return { canRequest: true, reason: "OK", pending: false, lastStatus };
}

/* ─── Back-office (gardé admin) ─────────────────────────────────────────────── */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) throw new Error("FORBIDDEN");
  return admin;
}

/** Compteur pour la pastille de la barre latérale admin. */
export async function countPendingEquivalences(): Promise<number> {
  const admin = await requireAdminFresh();
  if (!admin) return 0;
  return prisma.equivalenceRequest.count({ where: { status: "PENDING" } });
}

export interface AdminEquivalence {
  id: string;
  learnerName: string;
  learnerEmail: string;
  courseTitle: string;
  courseSlug: string;
  evidenceType: EquivalenceEvidenceType;
  description: string;
  proofUrl: string | null;
  proofLink: string | null;
  status: EquivalenceStatus;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedByName: string | null;
}

/** File d'équivalences pour l'administration (filtre de statut optionnel). */
export async function listEquivalencesAdmin(
  filters: { status?: EquivalenceStatus } = {},
): Promise<AdminEquivalence[]> {
  await guard();
  const rows = await prisma.equivalenceRequest.findMany({
    where: filters.status ? { status: filters.status } : {},
    // En attente d'abord, puis les plus récentes.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      evidenceType: true,
      description: true,
      proofUrl: true,
      proofLink: true,
      status: true,
      reviewNote: true,
      createdAt: true,
      reviewedAt: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true, slug: true } },
      reviewedBy: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    learnerName: r.user.name,
    learnerEmail: r.user.email,
    courseTitle: r.course.title,
    courseSlug: r.course.slug,
    evidenceType: r.evidenceType,
    description: r.description,
    proofUrl: r.proofUrl,
    proofLink: r.proofLink,
    status: r.status,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
    reviewedByName: r.reviewedBy?.name ?? null,
  }));
}
