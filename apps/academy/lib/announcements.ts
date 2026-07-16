import "server-only";
import { prisma, Prisma } from "@da/academy-db/client";
import { isAdmin } from "./guards";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Annonces de cohorte / formation (cahier §23-§26) — LECTURES.
   Une annonce est pertinente pour un apprenant si elle vise :
     · une COHORTE dont il est membre ACTIVE, ou
     · une FORMATION qu'il a acquise (Enrollment ACTIVE/COMPLETED).
   Le corps est du markdown, rendu par le composant <Markdown> côté affichage.
   ══════════════════════════════════════════════════════════════════════════ */

export type AnnouncementView = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: Date;
  cohortId: string | null;
  cohortName: string | null;
  courseTitle: string | null;
  authorName: string | null;
};

const ANNOUNCEMENT_SELECT = {
  id: true,
  title: true,
  body: true,
  pinned: true,
  createdAt: true,
  cohortId: true,
  cohort: { select: { name: true } },
  course: { select: { title: true } },
  author: { select: { name: true } },
} satisfies Prisma.AnnouncementSelect;

type AnnouncementRow = Prisma.AnnouncementGetPayload<{ select: typeof ANNOUNCEMENT_SELECT }>;

function toView(a: AnnouncementRow): AnnouncementView {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    pinned: a.pinned,
    createdAt: a.createdAt,
    cohortId: a.cohortId,
    cohortName: a.cohort?.name ?? null,
    courseTitle: a.course?.title ?? null,
    authorName: a.author?.name ?? null,
  };
}

const ANNOUNCEMENT_ORDER: Prisma.AnnouncementOrderByWithRelationInput[] = [
  { pinned: "desc" },
  { createdAt: "desc" },
];

/**
 * Annonces pertinentes pour un apprenant, tous canaux confondus (cohortes + formations
 * acquises). On charge d'abord les identifiants d'appartenance (deux requêtes légères)
 * puis on filtre les annonces par ces cibles. Sécurité niveau ligne : le périmètre est
 * strictement dérivé du `userId` fourni.
 */
export async function getMyAnnouncements(
  userId: string,
  opts?: { take?: number },
): Promise<AnnouncementView[]> {
  const [memberships, enrollments] = await Promise.all([
    prisma.cohortMember.findMany({
      where: { userId, status: "ACTIVE" },
      select: { cohortId: true },
    }),
    prisma.enrollment.findMany({
      where: { userId, status: { in: [...ACQUIRED_STATUSES] } },
      select: { courseId: true },
    }),
  ]);

  const cohortIds = memberships.map((m) => m.cohortId);
  const courseIds = enrollments.map((e) => e.courseId);
  if (cohortIds.length === 0 && courseIds.length === 0) return [];

  const or: Prisma.AnnouncementWhereInput[] = [];
  if (cohortIds.length > 0) or.push({ cohortId: { in: cohortIds } });
  if (courseIds.length > 0) or.push({ courseId: { in: courseIds } });

  const rows = await prisma.announcement.findMany({
    where: { OR: or },
    orderBy: ANNOUNCEMENT_ORDER,
    take: opts?.take ?? 5,
    select: ANNOUNCEMENT_SELECT,
  });
  return rows.map(toView);
}

/**
 * Annonces d'une cohorte donnée. Renvoie `null` si l'utilisateur n'a pas le droit de
 * les consulter : ni membre ACTIVE, ni formateur de la cohorte, ni administrateur.
 */
export async function getCohortAnnouncements(
  cohortId: string,
  userId: string,
): Promise<AnnouncementView[] | null> {
  const [membership, instructor, user] = await Promise.all([
    prisma.cohortMember.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      select: { status: true },
    }),
    prisma.cohortInstructor.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      select: { id: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }),
  ]);

  const allowed = membership?.status === "ACTIVE" || !!instructor || isAdmin(user);
  if (!allowed) return null;

  const rows = await prisma.announcement.findMany({
    where: { cohortId },
    orderBy: ANNOUNCEMENT_ORDER,
    select: ANNOUNCEMENT_SELECT,
  });
  return rows.map(toView);
}
