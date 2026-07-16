"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type CohortStatus } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";
import { createNotification } from "./notify";
import { enrollMemberIntoCohortTx } from "./cohort-enroll";

/* ══════════════════════════════════════════════════════════════════════════
   Cohortes — MUTATIONS back-office (cahier §23). Chaque mutation passe par
   requireAdminFresh() : les rôles sont RELUS EN BASE, jamais le seul JWT. Toute
   opération sensible est tracée dans AuditLog. Fichier découplé de
   admin-actions.ts (helpers réécrits localement).
   ══════════════════════════════════════════════════════════════════════════ */

export type AdminActionResult = { ok: true; message?: string } | { ok: false; error: string };
export type CreateResult = { ok: true; id: string; slug: string; message?: string } | { ok: false; error: string };

const ACCESS_DENIED = "Accès réservé aux administrateurs.";
const DENIED: AdminActionResult = { ok: false, error: ACCESS_DENIED };

async function audit(actorId: string, action: string, entity: string, entityId: string | null, meta?: object) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entity, entityId, meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined },
    });
  } catch {
    /* le journal ne bloque jamais l'action */
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "cohorte"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.cohort.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

const cohortTypeSchema = z.enum(["AUTONOMOUS", "GUIDED", "INTENSIVE", "ENTERPRISE", "HYBRID", "VIRTUAL_CLASS"]);
const cohortStatusSchema = z.enum(["DRAFT", "OPEN", "RUNNING", "COMPLETED", "CANCELLED"]);

/* ─── Création rapide (nom → DRAFT) ────────────────────────────────────────── */

export async function createCohort(name: string): Promise<CreateResult> {
  const parsed = z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120).safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Nom invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: ACCESS_DENIED };

  const slug = await uniqueSlug(slugify(parsed.data));
  const cohort = await prisma.cohort.create({
    data: { name: parsed.data, slug, status: "DRAFT", type: "GUIDED", startDate: new Date() },
    select: { id: true, slug: true },
  });
  await audit(admin.id, "cohort.create", "Cohort", cohort.id, { name: parsed.data });

  revalidatePath("/admin/cohortes");
  return { ok: true, id: cohort.id, slug: cohort.slug, message: "Cohorte créée (brouillon)." };
}

/* ─── Mise à jour de la fiche (§23.2) ──────────────────────────────────────── */

const updateCohortSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
  rules: z.string().trim().max(10000).optional().or(z.literal("")),
  rhythm: z.string().trim().max(120).optional().or(z.literal("")),
  coverImage: z.string().url().nullable().optional().or(z.literal("")),
  type: cohortTypeSchema.optional(),
  status: cohortStatusSchema.optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  enrollmentDeadline: z.coerce.date().optional().nullable(),
  capacity: z.number().int().min(0).nullable().optional(),
  price: z.number().int().min(0).nullable().optional(),
  courseId: z.string().min(1).nullable().optional(),
  careerPathId: z.string().min(1).nullable().optional(),
  schoolId: z.string().min(1).nullable().optional(),
});

export type UpdateCohortInput = z.input<typeof updateCohortSchema>;

export async function updateCohort(cohortId: string, input: UpdateCohortInput): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(cohortId);
  const parsed = updateCohortSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { ok: false, error: parsed.success ? "Cohorte invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const cohort = await prisma.cohort.findUnique({
    where: { id: idParsed.data },
    select: { id: true, courseId: true, careerPathId: true },
  });
  if (!cohort) return { ok: false, error: "Cohorte introuvable." };

  const d = parsed.data;

  // Cible pédagogique : EXACTEMENT une formation OU un parcours. On raisonne sur
  // l'état RÉSULTANT (valeur fournie sinon valeur actuelle) pour autoriser le
  // basculement (mettre l'un à null en fournissant l'autre).
  const nextCourseId = d.courseId !== undefined ? d.courseId : cohort.courseId;
  const nextPathId = d.careerPathId !== undefined ? d.careerPathId : cohort.careerPathId;
  if (nextCourseId && nextPathId) {
    return { ok: false, error: "Choisissez une formation OU un parcours." };
  }

  // Vérifie l'existence des cibles nouvellement fournies (évite une erreur FK brute).
  if (d.courseId) {
    const c = await prisma.course.findUnique({ where: { id: d.courseId }, select: { id: true } });
    if (!c) return { ok: false, error: "Formation cible introuvable." };
  }
  if (d.careerPathId) {
    const p = await prisma.careerPath.findUnique({ where: { id: d.careerPathId }, select: { id: true } });
    if (!p) return { ok: false, error: "Parcours cible introuvable." };
  }
  if (d.schoolId) {
    const s = await prisma.school.findUnique({ where: { id: d.schoolId }, select: { id: true } });
    if (!s) return { ok: false, error: "École introuvable." };
  }

  await prisma.cohort.update({
    where: { id: cohort.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.rules !== undefined ? { rules: d.rules || null } : {}),
      ...(d.rhythm !== undefined ? { rhythm: d.rhythm || null } : {}),
      ...(d.coverImage !== undefined ? { coverImage: d.coverImage || null } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      // startDate est requis en base : on ne l'écrit jamais à null (on ignore null/undefined).
      ...(d.startDate != null ? { startDate: d.startDate } : {}),
      ...(d.endDate !== undefined ? { endDate: d.endDate } : {}),
      ...(d.enrollmentDeadline !== undefined ? { enrollmentDeadline: d.enrollmentDeadline } : {}),
      ...(d.capacity !== undefined ? { capacity: d.capacity } : {}),
      ...(d.price !== undefined ? { price: d.price } : {}),
      ...(d.courseId !== undefined ? { courseId: d.courseId } : {}),
      ...(d.careerPathId !== undefined ? { careerPathId: d.careerPathId } : {}),
      ...(d.schoolId !== undefined ? { schoolId: d.schoolId } : {}),
    },
  });
  await audit(admin.id, "cohort.update", "Cohort", cohort.id, { fields: Object.keys(d) });

  revalidatePath("/admin/cohortes");
  revalidatePath(`/admin/cohortes/${cohort.id}`);
  revalidatePath("/espace/cohortes");
  return { ok: true, message: "Cohorte mise à jour." };
}

/* ─── Statut (workflow §23) ────────────────────────────────────────────────── */

export async function setCohortStatus(cohortId: string, status: CohortStatus): Promise<AdminActionResult> {
  const parsed = z.object({ cohortId: z.string().min(1), status: cohortStatusSchema }).safeParse({ cohortId, status });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const cohort = await prisma.cohort.findUnique({
    where: { id: parsed.data.cohortId },
    select: { id: true, name: true, status: true },
  });
  if (!cohort) return { ok: false, error: "Cohorte introuvable." };

  await prisma.cohort.update({ where: { id: cohort.id }, data: { status: parsed.data.status } });
  await audit(admin.id, "cohort.status", "Cohort", cohort.id, { from: cohort.status, to: parsed.data.status });

  revalidatePath("/admin/cohortes");
  revalidatePath(`/admin/cohortes/${cohort.id}`);
  revalidatePath("/espace/cohortes");
  return { ok: true, message: `Statut de « ${cohort.name} » : ${parsed.data.status}.` };
}

/* ─── Suppression (cascade schéma sur membres/intervenants/événements/annonces) ── */

export async function deleteCohort(cohortId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(cohortId);
  if (!parsed.success) return { ok: false, error: "Cohorte invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const cohort = await prisma.cohort.findUnique({ where: { id: parsed.data }, select: { id: true, name: true } });
  if (!cohort) return { ok: false, error: "Cohorte introuvable." };

  try {
    await prisma.cohort.delete({ where: { id: cohort.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "Impossible de supprimer cette cohorte pour le moment." };
    }
    throw err;
  }
  await audit(admin.id, "cohort.delete", "Cohort", cohort.id, { name: cohort.name });

  revalidatePath("/admin/cohortes");
  revalidatePath("/espace/cohortes");
  return { ok: true, message: `Cohorte « ${cohort.name} » supprimée.` };
}

/* ─── Intervenants (CohortInstructor) ──────────────────────────────────────── */

export async function addCohortInstructor(cohortId: string, userId: string, roleLabel?: string): Promise<AdminActionResult> {
  const parsed = z
    .object({
      cohortId: z.string().min(1),
      userId: z.string().min(1),
      roleLabel: z.string().trim().min(1).max(80).optional(),
    })
    .safeParse({ cohortId, userId, roleLabel });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const [cohort, user] = await Promise.all([
    prisma.cohort.findUnique({ where: { id: parsed.data.cohortId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true, name: true } }),
  ]);
  if (!cohort) return { ok: false, error: "Cohorte introuvable." };
  if (!user) return { ok: false, error: "Utilisateur introuvable." };

  await prisma.cohortInstructor.upsert({
    where: { cohortId_userId: { cohortId: cohort.id, userId: user.id } },
    update: { ...(parsed.data.roleLabel !== undefined ? { roleLabel: parsed.data.roleLabel } : {}) },
    create: {
      cohortId: cohort.id,
      userId: user.id,
      ...(parsed.data.roleLabel !== undefined ? { roleLabel: parsed.data.roleLabel } : {}),
    },
  });
  await audit(admin.id, "cohort.instructor.add", "Cohort", cohort.id, { userId: user.id, roleLabel: parsed.data.roleLabel });

  revalidatePath(`/admin/cohortes/${cohort.id}`);
  return { ok: true, message: `${user.name} ajouté(e) comme intervenant.` };
}

export async function removeCohortInstructor(cohortInstructorId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(cohortInstructorId);
  if (!parsed.success) return { ok: false, error: "Intervenant invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const ci = await prisma.cohortInstructor.findUnique({ where: { id: parsed.data }, select: { id: true, cohortId: true } });
  if (!ci) return { ok: false, error: "Intervenant introuvable." };

  await prisma.cohortInstructor.delete({ where: { id: ci.id } }).catch(() => null);
  await audit(admin.id, "cohort.instructor.remove", "Cohort", ci.cohortId, { cohortInstructorId: ci.id });

  revalidatePath(`/admin/cohortes/${ci.cohortId}`);
  return { ok: true, message: "Intervenant retiré." };
}

/* ─── Membres (CohortMember + inscription pédagogique via helper partagé) ───── */

export async function addCohortMemberAdmin(cohortId: string, userId: string): Promise<AdminActionResult> {
  const parsed = z.object({ cohortId: z.string().min(1), userId: z.string().min(1) }).safeParse({ cohortId, userId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const [cohort, user] = await Promise.all([
    prisma.cohort.findUnique({
      where: { id: parsed.data.cohortId },
      select: { id: true, name: true, courseId: true, careerPathId: true },
    }),
    prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true, name: true } }),
  ]);
  if (!cohort) return { ok: false, error: "Cohorte introuvable." };
  if (!user) return { ok: false, error: "Utilisateur introuvable." };

  try {
    await prisma.$transaction(async (tx) => {
      await enrollMemberIntoCohortTx(tx, {
        cohort: { id: cohort.id, courseId: cohort.courseId, careerPathId: cohort.careerPathId },
        userId: user.id,
        accessType: "MANUAL",
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `${user.name} est déjà membre de cette cohorte.` };
    }
    throw err;
  }

  await audit(admin.id, "cohort.member.add", "Cohort", cohort.id, { userId: user.id, accessType: "MANUAL" });
  await createNotification({
    userId: user.id,
    type: "COHORT",
    title: "Ajout à une cohorte",
    message: `Vous avez été ajouté(e) à la cohorte « ${cohort.name} ».`,
    link: `/espace/cohortes/${cohort.id}`,
  });

  revalidatePath("/admin/cohortes");
  revalidatePath(`/admin/cohortes/${cohort.id}`);
  revalidatePath("/espace/cohortes");
  return { ok: true, message: `${user.name} ajouté(e) à la cohorte.` };
}

export async function removeCohortMember(cohortMemberId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(cohortMemberId);
  if (!parsed.success) return { ok: false, error: "Membre invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const member = await prisma.cohortMember.findUnique({
    where: { id: parsed.data },
    select: { id: true, cohortId: true, status: true },
  });
  if (!member) return { ok: false, error: "Membre introuvable." };

  // Retrait de la cohorte SANS supprimer l'inscription pédagogique sous-jacente.
  await prisma.cohortMember.update({ where: { id: member.id }, data: { status: "WITHDRAWN" } });
  await audit(admin.id, "cohort.member.remove", "Cohort", member.cohortId, { cohortMemberId: member.id, from: member.status });

  revalidatePath("/admin/cohortes");
  revalidatePath(`/admin/cohortes/${member.cohortId}`);
  revalidatePath("/espace/cohortes");
  return { ok: true, message: "Membre retiré de la cohorte (accès pédagogique conservé)." };
}
