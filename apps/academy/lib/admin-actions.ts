"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type ContentStatus, type Role, type LessonType, type QuestionType } from "@da/academy-db/client";
import { requireAdminFresh, requireCourseEditor, currentUserFresh, isAdmin, hasRole } from "./guards";
import { createNotification } from "./notify";
import { revokeCertificate, restoreCertificate } from "./certification";

/* ══════════════════════════════════════════════════════════════════════════
   Back-office — MUTATIONS (cahier §30, workflow §31). Chaque mutation passe
   par requireAdminFresh() : les rôles sont RELUS EN BASE, jamais le seul JWT.
   Toute opération sensible est tracée dans AuditLog.
   ══════════════════════════════════════════════════════════════════════════ */

export type AdminActionResult = { ok: true; message?: string } | { ok: false; error: string };

const DENIED: AdminActionResult = { ok: false, error: "Accès réservé aux administrateurs." };
/** Refus lorsque l'acteur n'est ni admin ni formateur propriétaire de la formation (§29.2). */
const NOT_EDITOR: AdminActionResult = { ok: false, error: "Vous n'êtes pas autorisé à modifier cette formation." };

async function audit(actorId: string, action: string, entity: string, entityId: string | null, meta?: object) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entity, entityId, meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined },
    });
  } catch {
    /* le journal ne bloque jamais l'action */
  }
}

/* ─── Workflow de publication (§31) ────────────────────────────────────────── */

/** Transitions autorisées : DRAFT→REVIEW→APPROVED→PUBLISHED→SUSPENDED/ARCHIVED. */
const COURSE_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["REVIEW", "ARCHIVED"],
  REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["PUBLISHED", "SCHEDULED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

const contentStatusSchema = z.enum(["DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "SUSPENDED", "ARCHIVED"]);

export async function setCourseStatus(courseId: string, status: ContentStatus): Promise<AdminActionResult> {
  const parsed = z.object({ courseId: z.string().min(1), status: contentStatusSchema }).safeParse({ courseId, status });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, title: true, slug: true, status: true, publishedAt: true },
  });
  if (!course) return { ok: false, error: "Formation introuvable." };

  const allowed = COURSE_TRANSITIONS[course.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return { ok: false, error: `Transition impossible : ${course.status} → ${parsed.data.status} (workflow de publication).` };
  }

  await prisma.course.update({
    where: { id: course.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === "PUBLISHED" && !course.publishedAt ? { publishedAt: new Date() } : {}),
    },
  });
  await audit(admin.id, "course.status", "Course", course.id, { from: course.status, to: parsed.data.status });

  revalidatePath("/formations");
  revalidatePath(`/formations/${course.slug}`);
  revalidatePath("/admin/formations");
  return { ok: true, message: `Statut de « ${course.title} » : ${parsed.data.status}.` };
}

export async function setCareerPathStatus(careerPathId: string, status: ContentStatus): Promise<AdminActionResult> {
  const parsed = z.object({ id: z.string().min(1), status: contentStatusSchema }).safeParse({ id: careerPathId, status });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const path = await prisma.careerPath.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, title: true, slug: true, status: true },
  });
  if (!path) return { ok: false, error: "Parcours introuvable." };

  const allowed = COURSE_TRANSITIONS[path.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return { ok: false, error: `Transition impossible : ${path.status} → ${parsed.data.status}.` };
  }

  await prisma.careerPath.update({ where: { id: path.id }, data: { status: parsed.data.status } });
  await audit(admin.id, "careerPath.status", "CareerPath", path.id, { from: path.status, to: parsed.data.status });

  revalidatePath("/parcours-metiers");
  revalidatePath(`/parcours-metiers/${path.slug}`);
  revalidatePath("/admin/parcours");
  return { ok: true, message: `Statut de « ${path.title} » : ${parsed.data.status}.` };
}

/* ─── Mise à jour d'une formation (champs fiche §11) ───────────────────────── */

const updateCourseSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug ne peut contenir que des minuscules, chiffres et tirets.")
    .optional(),
  subtitle: z.string().trim().max(240).optional().or(z.literal("")),
  description: z.string().trim().min(10).optional(),
  objectives: z.array(z.string().trim().min(1)).max(20).optional(),
  targetAudience: z.array(z.string().trim().min(1)).max(20).optional(),
  prerequisitesText: z.array(z.string().trim().min(1)).max(20).optional(),
  tools: z.array(z.string().trim().min(1)).max(30).optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  language: z.string().trim().max(8).optional(),
  durationHours: z.number().int().min(0).max(2000).nullable().optional(),
  price: z.number().int().min(0).optional(),
  coverImage: z.string().url().nullable().optional().or(z.literal("")),
  promoVideoUrl: z.string().url().nullable().optional().or(z.literal("")),
  certificateTitle: z.string().trim().max(160).nullable().optional().or(z.literal("")),
  unlockMode: z.enum(["FREE", "SEQUENTIAL"]).optional(),
  featured: z.boolean().optional(),
});

export type UpdateCourseInput = z.input<typeof updateCourseSchema>;

export async function updateCourse(courseId: string, input: UpdateCourseInput): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(courseId);
  const parsed = updateCourseSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { ok: false, error: parsed.success ? "Formation invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const editor = await requireCourseEditor(idParsed.data);
  if (!editor) return NOT_EDITOR;

  const course = await prisma.course.findUnique({ where: { id: idParsed.data }, select: { id: true, slug: true } });
  if (!course) return { ok: false, error: "Formation introuvable." };

  const d = parsed.data;
  // Slug : si modifié, garantir l'unicité (sinon conflit de contrainte).
  let nextSlug: string | undefined;
  if (d.slug !== undefined && d.slug !== course.slug) {
    const taken = await prisma.course.findFirst({ where: { slug: d.slug, NOT: { id: course.id } }, select: { id: true } });
    if (taken) return { ok: false, error: "Ce slug est déjà utilisé par une autre formation." };
    nextSlug = d.slug;
  }
  await prisma.course.update({
    where: { id: course.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(d.subtitle !== undefined ? { subtitle: d.subtitle || null } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.objectives !== undefined ? { objectives: d.objectives } : {}),
      ...(d.targetAudience !== undefined ? { targetAudience: d.targetAudience } : {}),
      ...(d.prerequisitesText !== undefined ? { prerequisitesText: d.prerequisitesText } : {}),
      ...(d.tools !== undefined ? { tools: d.tools } : {}),
      ...(d.level !== undefined ? { level: d.level } : {}),
      ...(d.language !== undefined ? { language: d.language } : {}),
      ...(d.durationHours !== undefined ? { durationHours: d.durationHours } : {}),
      ...(d.price !== undefined ? { price: d.price } : {}),
      ...(d.coverImage !== undefined ? { coverImage: d.coverImage || null } : {}),
      ...(d.promoVideoUrl !== undefined ? { promoVideoUrl: d.promoVideoUrl || null } : {}),
      ...(d.certificateTitle !== undefined ? { certificateTitle: d.certificateTitle || null } : {}),
      ...(d.unlockMode !== undefined ? { unlockMode: d.unlockMode } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
    },
  });
  await audit(editor.id, "course.update", "Course", course.id, { fields: Object.keys(d) });

  revalidatePath(`/formations/${course.slug}`);
  revalidatePath("/admin/formations");
  return { ok: true, message: "Formation mise à jour." };
}

/* ─── Jonction École ↔ Formation (SchoolCourse, §43.1) ─────────────────────── */

const attachSchema = z.object({
  schoolId: z.string().min(1),
  courseId: z.string().min(1),
  isPrimary: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export async function attachCourseToSchool(input: z.infer<typeof attachSchema>): Promise<AdminActionResult> {
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;
  const { schoolId, courseId, isPrimary, isFeatured, position } = parsed.data;

  const [school, course] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } }),
  ]);
  if (!school || !course) return { ok: false, error: "École ou formation introuvable." };

  await prisma.$transaction(async (tx) => {
    // Rattachement principal UNIQUE par formation : on retire l'ancien primary.
    if (isPrimary) {
      await tx.schoolCourse.updateMany({
        where: { courseId, isPrimary: true, NOT: { schoolId } },
        data: { isPrimary: false },
      });
    }
    await tx.schoolCourse.upsert({
      where: { schoolId_courseId: { schoolId, courseId } },
      update: {
        ...(isPrimary !== undefined ? { isPrimary } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(position !== undefined ? { position } : {}),
      },
      create: { schoolId, courseId, isPrimary: isPrimary ?? false, isFeatured: isFeatured ?? false, position: position ?? 0 },
    });
  });
  await audit(admin.id, "schoolCourse.attach", "SchoolCourse", null, { schoolId, courseId, isPrimary: isPrimary ?? false });

  revalidatePath("/ecoles");
  revalidatePath("/admin/ecoles");
  return { ok: true, message: `« ${course.title} » rattachée à ${school.name}.` };
}

export async function detachCourseFromSchool(schoolId: string, courseId: string): Promise<AdminActionResult> {
  const parsed = z.object({ schoolId: z.string().min(1), courseId: z.string().min(1) }).safeParse({ schoolId, courseId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  await prisma.schoolCourse.deleteMany({ where: { schoolId: parsed.data.schoolId, courseId: parsed.data.courseId } });
  await audit(admin.id, "schoolCourse.detach", "SchoolCourse", null, parsed.data);

  revalidatePath("/ecoles");
  revalidatePath("/admin/ecoles");
  return { ok: true, message: "Formation détachée de l'école." };
}

/* ─── Constructeur de parcours (CareerPathCourse, §30.3, §43.2) ────────────── */

const addToPathSchema = z.object({
  careerPathId: z.string().min(1),
  courseId: z.string().min(1),
  phaseId: z.string().min(1).nullable().optional(),
  position: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  prerequisiteCourseId: z.string().min(1).nullable().optional(),
  creditValue: z.number().int().min(0).nullable().optional(),
});

export async function addCourseToPath(input: z.infer<typeof addToPathSchema>): Promise<AdminActionResult> {
  const parsed = addToPathSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;
  const d = parsed.data;

  const [path, course] = await Promise.all([
    prisma.careerPath.findUnique({ where: { id: d.careerPathId }, select: { id: true, title: true, slug: true } }),
    prisma.course.findUnique({ where: { id: d.courseId }, select: { id: true, title: true } }),
  ]);
  if (!path || !course) return { ok: false, error: "Parcours ou formation introuvable." };

  if (d.phaseId) {
    const phase = await prisma.careerPathPhase.findFirst({ where: { id: d.phaseId, careerPathId: path.id }, select: { id: true } });
    if (!phase) return { ok: false, error: "Phase invalide pour ce parcours." };
  }
  if (d.prerequisiteCourseId) {
    if (d.prerequisiteCourseId === d.courseId) return { ok: false, error: "Une formation ne peut pas être son propre prérequis." };
    const prereq = await prisma.careerPathCourse.findUnique({
      where: { careerPathId_courseId: { careerPathId: path.id, courseId: d.prerequisiteCourseId } },
      select: { id: true },
    });
    if (!prereq) return { ok: false, error: "Le prérequis doit être une formation DU parcours." };
  }

  const last = await prisma.careerPathCourse.findFirst({
    where: { careerPathId: path.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.careerPathCourse.upsert({
    where: { careerPathId_courseId: { careerPathId: path.id, courseId: course.id } },
    update: {
      ...(d.phaseId !== undefined ? { phaseId: d.phaseId } : {}),
      ...(d.position !== undefined ? { position: d.position } : {}),
      ...(d.isRequired !== undefined ? { isRequired: d.isRequired } : {}),
      ...(d.prerequisiteCourseId !== undefined ? { prerequisiteCourseId: d.prerequisiteCourseId } : {}),
      ...(d.creditValue !== undefined ? { creditValue: d.creditValue } : {}),
    },
    create: {
      careerPathId: path.id,
      courseId: course.id,
      phaseId: d.phaseId ?? null,
      position: d.position ?? (last ? last.position + 1 : 0),
      isRequired: d.isRequired ?? true,
      prerequisiteCourseId: d.prerequisiteCourseId ?? null,
      creditValue: d.creditValue ?? null,
    },
  });
  await audit(admin.id, "careerPathCourse.add", "CareerPathCourse", null, { careerPathId: path.id, courseId: course.id });

  revalidatePath(`/parcours-metiers/${path.slug}`);
  revalidatePath("/admin/parcours");
  return { ok: true, message: `« ${course.title} » ajoutée au parcours ${path.title}.` };
}

export async function removeCourseFromPath(careerPathId: string, courseId: string): Promise<AdminActionResult> {
  const parsed = z.object({ careerPathId: z.string().min(1), courseId: z.string().min(1) }).safeParse({ careerPathId, courseId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  await prisma.$transaction([
    // La formation retirée ne peut plus servir de prérequis interne.
    prisma.careerPathCourse.updateMany({
      where: { careerPathId: parsed.data.careerPathId, prerequisiteCourseId: parsed.data.courseId },
      data: { prerequisiteCourseId: null },
    }),
    prisma.careerPathCourse.deleteMany({
      where: { careerPathId: parsed.data.careerPathId, courseId: parsed.data.courseId },
    }),
  ]);
  await audit(admin.id, "careerPathCourse.remove", "CareerPathCourse", null, parsed.data);

  revalidatePath("/admin/parcours");
  return { ok: true, message: "Formation retirée du parcours (elle reste intacte au catalogue)." };
}

/** Réordonne les formations d'un parcours (glisser-déposer §30.3). */
export async function reorderPathCourses(careerPathId: string, orderedCourseIds: string[]): Promise<AdminActionResult> {
  const parsed = z
    .object({ careerPathId: z.string().min(1), orderedCourseIds: z.array(z.string().min(1)).min(1).max(100) })
    .safeParse({ careerPathId, orderedCourseIds });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  await prisma.$transaction(
    parsed.data.orderedCourseIds.map((courseId, index) =>
      prisma.careerPathCourse.updateMany({
        where: { careerPathId: parsed.data.careerPathId, courseId },
        data: { position: index },
      }),
    ),
  );
  await audit(admin.id, "careerPathCourse.reorder", "CareerPath", parsed.data.careerPathId);

  revalidatePath("/admin/parcours");
  return { ok: true };
}

/* ─── Phases de parcours (§13.5) ───────────────────────────────────────────── */

const phaseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  order: z.number().int().min(0).optional(),
});

export async function createPhase(careerPathId: string, input: z.infer<typeof phaseSchema>): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(careerPathId);
  const parsed = phaseSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const path = await prisma.careerPath.findUnique({ where: { id: idParsed.data }, select: { id: true } });
  if (!path) return { ok: false, error: "Parcours introuvable." };

  const last = await prisma.careerPathPhase.findFirst({
    where: { careerPathId: path.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.careerPathPhase.create({
    data: {
      careerPathId: path.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      order: parsed.data.order ?? (last ? last.order + 1 : 0),
    },
  });

  revalidatePath("/admin/parcours");
  return { ok: true, message: "Phase créée." };
}

export async function updatePhase(phaseId: string, input: Partial<z.infer<typeof phaseSchema>>): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(phaseId);
  const parsed = phaseSchema.partial().safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const phase = await prisma.careerPathPhase.findUnique({ where: { id: idParsed.data }, select: { id: true } });
  if (!phase) return { ok: false, error: "Phase introuvable." };

  const d = parsed.data;
  await prisma.careerPathPhase.update({
    where: { id: phase.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
    },
  });

  revalidatePath("/admin/parcours");
  return { ok: true, message: "Phase mise à jour." };
}

export async function reorderPhases(careerPathId: string, orderedIds: string[]): Promise<AdminActionResult> {
  const parsed = z
    .object({ careerPathId: z.string().min(1), orderedIds: z.array(z.string().min(1)).min(1).max(100) })
    .safeParse({ careerPathId, orderedIds });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.careerPathPhase.updateMany({ where: { id, careerPathId: parsed.data.careerPathId }, data: { order: index } }),
    ),
  );
  revalidatePath("/admin/parcours");
  return { ok: true };
}

export async function deletePhase(phaseId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(phaseId);
  if (!parsed.success) return { ok: false, error: "Phase invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  // onDelete: SetNull sur CareerPathCourse.phaseId — les formations restent dans le parcours.
  await prisma.careerPathPhase.delete({ where: { id: parsed.data } }).catch(() => null);
  revalidatePath("/admin/parcours");
  return { ok: true, message: "Phase supprimée (les formations restent dans le parcours)." };
}

/* ─── Utilisateurs : rôles + activation (SUPER_ADMIN protégé) ──────────────── */

const rolesSchema = z
  .array(z.enum(["LEARNER", "INSTRUCTOR", "GRADER", "MENTOR", "SCHOOL_MANAGER", "PATH_MANAGER", "ORG_MANAGER", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"]))
  .min(1, "Au moins un rôle est requis.");

export async function setUserRoles(userId: string, roles: Role[]): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(userId);
  const rolesParsed = rolesSchema.safeParse(roles);
  if (!idParsed.success || !rolesParsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const target = await prisma.user.findUnique({ where: { id: idParsed.data }, select: { id: true, name: true, roles: true } });
  if (!target) return { ok: false, error: "Utilisateur introuvable." };

  const actorIsSuper = admin.roles.includes("SUPER_ADMIN");
  const targetIsSuper = target.roles.includes("SUPER_ADMIN");
  const grantsSuper = rolesParsed.data.includes("SUPER_ADMIN");
  // Protection SUPER_ADMIN : seul un super admin peut toucher un super admin
  // ou attribuer/retirer ce rôle.
  if ((targetIsSuper || grantsSuper) && !actorIsSuper) {
    return { ok: false, error: "Seul un super administrateur peut gérer le rôle SUPER_ADMIN." };
  }
  if (target.id === admin.id && targetIsSuper && !grantsSuper) {
    return { ok: false, error: "Vous ne pouvez pas retirer votre propre rôle SUPER_ADMIN." };
  }

  await prisma.user.update({ where: { id: target.id }, data: { roles: [...new Set(rolesParsed.data)] } });
  await audit(admin.id, "user.roles", "User", target.id, { from: target.roles, to: rolesParsed.data });

  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: `Rôles de ${target.name} mis à jour.` };
}

export async function toggleUserActive(userId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(userId);
  if (!parsed.success) return { ok: false, error: "Utilisateur invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const target = await prisma.user.findUnique({
    where: { id: parsed.data },
    select: { id: true, name: true, roles: true, isActive: true },
  });
  if (!target) return { ok: false, error: "Utilisateur introuvable." };
  if (target.id === admin.id) return { ok: false, error: "Vous ne pouvez pas désactiver votre propre compte." };
  if (target.roles.includes("SUPER_ADMIN") && !admin.roles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "Seul un super administrateur peut désactiver un super administrateur." };
  }

  const next = !target.isActive;
  await prisma.user.update({ where: { id: target.id }, data: { isActive: next } });
  await audit(admin.id, next ? "user.activate" : "user.deactivate", "User", target.id);

  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: `${target.name} ${next ? "réactivé(e)" : "désactivé(e)"}.` };
}

/* ─── Certificats : révoquer / restaurer (délégué à certification.ts) ──────── */

export async function revokeCertificateAction(certificateId: string, reason: string): Promise<AdminActionResult> {
  const res = await revokeCertificate(certificateId, reason);
  if (res.ok) revalidatePath("/admin/certificats");
  return res.ok ? { ok: true, message: "Certificat révoqué (tracé au journal d'audit)." } : res;
}

export async function restoreCertificateAction(certificateId: string): Promise<AdminActionResult> {
  const res = await restoreCertificate(certificateId);
  if (res.ok) revalidatePath("/admin/certificats");
  return res.ok ? { ok: true, message: "Certificat restauré." } : res;
}

/* ══════════════════════════════════════════════════════════════════════════
   CONSTRUCTEURS PÉDAGOGIQUES (§30.2-30.4). Création/édition du contenu :
   formations (modules → leçons → évaluations → questions), parcours (phases +
   composition par assemblage de formations existantes), écoles (identité +
   rattachements). Toute mutation revérifie le rôle admin EN BASE.
   ══════════════════════════════════════════════════════════════════════════ */

export type CreateResult = { ok: true; id: string; slug: string; message?: string } | { ok: false; error: string };

const ACCESS_DENIED = "Accès réservé aux administrateurs.";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "sans-titre"
  );
}

async function uniqueSlug(base: string, model: "course" | "careerPath" | "school"): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists =
      model === "course"
        ? await prisma.course.findUnique({ where: { slug }, select: { id: true } })
        : model === "careerPath"
          ? await prisma.careerPath.findUnique({ where: { slug }, select: { id: true } })
          : await prisma.school.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

/* ─── Formation : création rapide (titre → DRAFT) ──────────────────────────── */

export async function createCourse(title: string): Promise<CreateResult> {
  const parsed = z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(160).safeParse(title);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Titre invalide." };
  const user = await currentUserFresh();
  if (!user || !(isAdmin(user) || hasRole(user, ["INSTRUCTOR"]))) return { ok: false, error: "Accès réservé." };

  const slug = await uniqueSlug(slugify(parsed.data), "course");
  const course = await prisma.course.create({
    data: { title: parsed.data, slug, description: "" },
    select: { id: true, slug: true },
  });
  // Le créateur formateur (non-admin) devient formateur propriétaire de la formation (§29.2).
  if (!isAdmin(user)) {
    await prisma.courseInstructor.create({ data: { courseId: course.id, userId: user.id } });
  }
  await audit(user.id, "course.create", "Course", course.id, { title: parsed.data });

  revalidatePath("/admin/formations");
  return { ok: true, id: course.id, slug: course.slug, message: "Formation créée (brouillon)." };
}

/* ─── Soumission à validation (§29.2 / §31) ────────────────────────────────────
   Le formateur propriétaire (ou l'admin) soumet sa formation à la revue. La
   publication reste ensuite réservée à l'admin (setCourseStatus). ────────────── */

export async function submitCourseForReview(courseId: string): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(courseId);
  if (!idParsed.success) return { ok: false, error: "Formation invalide." };
  const editor = await requireCourseEditor(idParsed.data);
  if (!editor) return NOT_EDITOR;

  const course = await prisma.course.findUnique({
    where: { id: idParsed.data },
    select: { id: true, title: true, status: true, _count: { select: { modules: true } } },
  });
  if (!course) return { ok: false, error: "Formation introuvable." };

  // Statuts « re-soumettables ». CHANGES_REQUESTED/REJECTED n'existent pas encore
  // dans l'enum ContentStatus (un rejet ramène la formation en DRAFT) ; on les
  // liste par string pour rester tolérant à une évolution future du workflow.
  const submittable: string[] = ["DRAFT", "CHANGES_REQUESTED", "REJECTED"];
  if (!submittable.includes(course.status)) {
    return { ok: false, error: "Cette formation ne peut pas être soumise dans son état actuel." };
  }

  const lessonCount = await prisma.lesson.count({ where: { module: { courseId: course.id } } });
  if (course._count.modules < 1 || lessonCount < 1) {
    return { ok: false, error: "Ajoutez au moins un module et une leçon avant de soumettre." };
  }

  await prisma.course.update({ where: { id: course.id }, data: { status: "REVIEW" } });
  await audit(editor.id, "course.submit", "Course", course.id, { from: course.status, to: "REVIEW" });

  // Notifie les administrateurs pédagogiques qu'une formation attend validation.
  const admins = await prisma.user.findMany({
    where: { roles: { hasSome: ["ACADEMIC_ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: "SYSTEM",
        title: "Formation à valider",
        message: `« ${course.title} » a été soumise à validation.`,
        link: `/admin/formations/${courseId}`,
      }),
    ),
  );

  revalidatePath("/admin/formations");
  revalidatePath("/formateur/formations");
  revalidatePath(`/formateur/formations/${courseId}`);
  return { ok: true, message: "Formation soumise à validation." };
}

/* ─── Modules (§12.1) ──────────────────────────────────────────────────────── */

const moduleSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court.").max(160),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  objectives: z.array(z.string().trim().min(1)).max(20).optional(),
  durationMinutes: z.number().int().min(0).max(100000).nullable().optional(),
});

export async function createModule(courseId: string, title: string): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(courseId);
  const parsed = z.string().trim().min(2).max(160).safeParse(title);
  if (!idParsed.success || !parsed.success) return { ok: false, error: "Titre de module invalide." };
  const editor = await requireCourseEditor(idParsed.data);
  if (!editor) return NOT_EDITOR;

  const course = await prisma.course.findUnique({ where: { id: idParsed.data }, select: { id: true } });
  if (!course) return { ok: false, error: "Formation introuvable." };

  const last = await prisma.module.findFirst({ where: { courseId: course.id }, orderBy: { order: "desc" }, select: { order: true } });
  await prisma.module.create({ data: { courseId: course.id, title: parsed.data, order: last ? last.order + 1 : 0 } });
  await audit(editor.id, "module.create", "Course", course.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Module ajouté." };
}

export async function updateModule(moduleId: string, input: z.infer<typeof moduleSchema>): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(moduleId);
  const parsed = moduleSchema.partial().safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: parsed.success ? "Module invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const mod = await prisma.module.findUnique({ where: { id: idParsed.data }, select: { id: true, courseId: true } });
  if (!mod) return { ok: false, error: "Module introuvable." };
  const editor = await requireCourseEditor(mod.courseId);
  if (!editor) return NOT_EDITOR;

  const d = parsed.data;
  await prisma.module.update({
    where: { id: mod.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.objectives !== undefined ? { objectives: d.objectives } : {}),
      ...(d.durationMinutes !== undefined ? { durationMinutes: d.durationMinutes } : {}),
    },
  });
  await audit(editor.id, "module.update", "Module", mod.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Module mis à jour." };
}

export async function deleteModule(moduleId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(moduleId);
  if (!parsed.success) return { ok: false, error: "Module invalide." };

  const mod = await prisma.module.findUnique({ where: { id: parsed.data }, select: { courseId: true } });
  if (!mod) return { ok: false, error: "Introuvable." };
  const editor = await requireCourseEditor(mod.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.module.delete({ where: { id: parsed.data } }).catch(() => null);
  await audit(editor.id, "module.delete", "Module", parsed.data);
  revalidatePath("/admin/formations");
  return { ok: true, message: "Module supprimé." };
}

export async function reorderModules(courseId: string, orderedIds: string[]): Promise<AdminActionResult> {
  const parsed = z
    .object({ courseId: z.string().min(1), orderedIds: z.array(z.string().min(1)).min(1).max(200) })
    .safeParse({ courseId, orderedIds });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const editor = await requireCourseEditor(parsed.data.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.module.updateMany({ where: { id, courseId: parsed.data.courseId }, data: { order: index } }),
    ),
  );
  revalidatePath("/admin/formations");
  return { ok: true };
}

/* ─── Leçons (§12.2) ───────────────────────────────────────────────────────── */

const LESSON_TYPES = [
  "VIDEO",
  "TEXT",
  "PDF",
  "AUDIO",
  "PRESENTATION",
  "INTERACTIVE",
  "DEMO",
  "EXTERNAL_LINK",
  "VIRTUAL_CLASS",
  "CASE_STUDY",
  "WORKSHOP",
  "LAB",
] as const;

const lessonSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court.").max(200),
  lessonType: z.enum(LESSON_TYPES).optional(),
  content: z.string().max(100000).nullable().optional().or(z.literal("")),
  videoUrl: z.string().url().nullable().optional().or(z.literal("")),
  externalUrl: z.string().url().nullable().optional().or(z.literal("")),
  durationMinutes: z.number().int().min(0).max(100000).nullable().optional(),
  isPreview: z.boolean().optional(),
  isRequired: z.boolean().optional(),
});

export async function createLesson(moduleId: string, title: string, lessonType?: LessonType): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(moduleId);
  const parsed = z.string().trim().min(2).max(200).safeParse(title);
  if (!idParsed.success || !parsed.success) return { ok: false, error: "Titre de leçon invalide." };

  const mod = await prisma.module.findUnique({ where: { id: idParsed.data }, select: { id: true, courseId: true } });
  if (!mod) return { ok: false, error: "Module introuvable." };
  const editor = await requireCourseEditor(mod.courseId);
  if (!editor) return NOT_EDITOR;

  const last = await prisma.lesson.findFirst({ where: { moduleId: mod.id }, orderBy: { order: "desc" }, select: { order: true } });
  await prisma.lesson.create({
    data: { moduleId: mod.id, title: parsed.data, lessonType: lessonType ?? "TEXT", order: last ? last.order + 1 : 0 },
  });
  await audit(editor.id, "lesson.create", "Module", mod.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Leçon ajoutée." };
}

export async function updateLesson(lessonId: string, input: z.infer<typeof lessonSchema>): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(lessonId);
  const parsed = lessonSchema.partial().safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: parsed.success ? "Leçon invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const lesson = await prisma.lesson.findUnique({ where: { id: idParsed.data }, select: { id: true, module: { select: { courseId: true } } } });
  if (!lesson) return { ok: false, error: "Leçon introuvable." };
  const editor = await requireCourseEditor(lesson.module.courseId);
  if (!editor) return NOT_EDITOR;

  const d = parsed.data;
  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.lessonType !== undefined ? { lessonType: d.lessonType } : {}),
      ...(d.content !== undefined ? { content: d.content || null } : {}),
      ...(d.videoUrl !== undefined ? { videoUrl: d.videoUrl || null } : {}),
      ...(d.externalUrl !== undefined ? { externalUrl: d.externalUrl || null } : {}),
      ...(d.durationMinutes !== undefined ? { durationMinutes: d.durationMinutes } : {}),
      ...(d.isPreview !== undefined ? { isPreview: d.isPreview } : {}),
      ...(d.isRequired !== undefined ? { isRequired: d.isRequired } : {}),
    },
  });
  await audit(editor.id, "lesson.update", "Lesson", lesson.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Leçon mise à jour." };
}

export async function deleteLesson(lessonId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(lessonId);
  if (!parsed.success) return { ok: false, error: "Leçon invalide." };

  const lesson = await prisma.lesson.findUnique({ where: { id: parsed.data }, select: { module: { select: { courseId: true } } } });
  if (!lesson) return { ok: false, error: "Introuvable." };
  const editor = await requireCourseEditor(lesson.module.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.lesson.delete({ where: { id: parsed.data } }).catch(() => null);
  await audit(editor.id, "lesson.delete", "Lesson", parsed.data);
  revalidatePath("/admin/formations");
  return { ok: true, message: "Leçon supprimée." };
}

export async function reorderLessons(moduleId: string, orderedIds: string[]): Promise<AdminActionResult> {
  const parsed = z
    .object({ moduleId: z.string().min(1), orderedIds: z.array(z.string().min(1)).min(1).max(300) })
    .safeParse({ moduleId, orderedIds });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const mod = await prisma.module.findUnique({ where: { id: parsed.data.moduleId }, select: { courseId: true } });
  if (!mod) return { ok: false, error: "Introuvable." };
  const editor = await requireCourseEditor(mod.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.lesson.updateMany({ where: { id, moduleId: parsed.data.moduleId }, data: { order: index } }),
    ),
  );
  revalidatePath("/admin/formations");
  return { ok: true };
}

/* ─── Évaluations de module (§18) ──────────────────────────────────────────── */

const assessmentSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court.").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  type: z.enum(["QUIZ", "ASSIGNMENT", "EXAM"]).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  attemptsAllowed: z.number().int().min(0).max(50).optional(),
  isRequired: z.boolean().optional(),
});

export async function createAssessment(moduleId: string, title: string): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(moduleId);
  const parsed = z.string().trim().min(2).max(200).safeParse(title);
  if (!idParsed.success || !parsed.success) return { ok: false, error: "Titre d'évaluation invalide." };

  const mod = await prisma.module.findUnique({ where: { id: idParsed.data }, select: { id: true, courseId: true } });
  if (!mod) return { ok: false, error: "Module introuvable." };
  const editor = await requireCourseEditor(mod.courseId);
  if (!editor) return NOT_EDITOR;

  const last = await prisma.assessment.findFirst({ where: { moduleId: mod.id }, orderBy: { order: "desc" }, select: { order: true } });
  await prisma.assessment.create({
    data: { courseId: mod.courseId, moduleId: mod.id, title: parsed.data, type: "QUIZ", order: last ? last.order + 1 : 0 },
  });
  await audit(editor.id, "assessment.create", "Module", mod.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Évaluation ajoutée." };
}

export async function updateAssessment(assessmentId: string, input: z.infer<typeof assessmentSchema>): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(assessmentId);
  const parsed = assessmentSchema.partial().safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: parsed.success ? "Évaluation invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const a = await prisma.assessment.findUnique({ where: { id: idParsed.data }, select: { id: true, courseId: true } });
  if (!a) return { ok: false, error: "Évaluation introuvable." };
  const editor = await requireCourseEditor(a.courseId);
  if (!editor) return NOT_EDITOR;

  const d = parsed.data;
  await prisma.assessment.update({
    where: { id: a.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.passingScore !== undefined ? { passingScore: d.passingScore } : {}),
      ...(d.attemptsAllowed !== undefined ? { attemptsAllowed: d.attemptsAllowed } : {}),
      ...(d.isRequired !== undefined ? { isRequired: d.isRequired } : {}),
    },
  });
  await audit(editor.id, "assessment.update", "Assessment", a.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Évaluation mise à jour." };
}

export async function deleteAssessment(assessmentId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(assessmentId);
  if (!parsed.success) return { ok: false, error: "Évaluation invalide." };

  const a = await prisma.assessment.findUnique({ where: { id: parsed.data }, select: { courseId: true } });
  if (!a) return { ok: false, error: "Introuvable." };
  const editor = await requireCourseEditor(a.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.assessment.delete({ where: { id: parsed.data } }).catch(() => null);
  await audit(editor.id, "assessment.delete", "Assessment", parsed.data);
  revalidatePath("/admin/formations");
  return { ok: true, message: "Évaluation supprimée." };
}

/* ─── Questions (§18.3) — encodage correctAnswer strict (§5) ───────────────── */

// options : string[] (choix / ordonnancement) OU { left, right } (appariement).
const matchingOptions = z.object({
  left: z.array(z.string().trim().min(1)).min(2).max(10),
  right: z.array(z.string().trim().min(1)).min(2).max(10),
});
const questionSchema = z
  .object({
    type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING", "ORDERING"]),
    question: z.string().trim().min(1, "Énoncé requis.").max(2000),
    options: z.union([z.array(z.string().trim().min(1)).max(12), matchingOptions]).optional(),
    correctAnswer: z.unknown(),
    explanation: z.string().trim().max(2000).optional().or(z.literal("")),
    points: z.number().int().min(1).max(100).optional(),
  })
  .superRefine((d, ctx) => {
    const arr = Array.isArray(d.options) ? d.options : null;
    switch (d.type) {
      case "TRUE_FALSE": {
        if (typeof d.correctAnswer !== "boolean")
          ctx.addIssue({ code: "custom", message: "Indiquez si l'affirmation est vraie ou fausse.", path: ["correctAnswer"] });
        return;
      }
      case "SHORT_ANSWER": {
        const ok =
          Array.isArray(d.correctAnswer) &&
          d.correctAnswer.length > 0 &&
          d.correctAnswer.every((v) => typeof v === "string" && v.trim().length > 0);
        if (!ok) ctx.addIssue({ code: "custom", message: "Saisissez au moins une réponse acceptée.", path: ["correctAnswer"] });
        return;
      }
      case "MATCHING": {
        const m = d.options && !Array.isArray(d.options) ? d.options : null;
        if (!m || m.left.length < 2 || m.left.length !== m.right.length) {
          ctx.addIssue({ code: "custom", message: "Renseignez au moins deux paires (colonnes de même longueur).", path: ["options"] });
          return;
        }
        const ok =
          Array.isArray(d.correctAnswer) &&
          d.correctAnswer.length === m.left.length &&
          d.correctAnswer.every((n) => typeof n === "number" && n >= 0 && n < m.right.length);
        if (!ok) ctx.addIssue({ code: "custom", message: "Associez chaque élément de gauche à un élément de droite.", path: ["correctAnswer"] });
        return;
      }
      case "ORDERING": {
        if (!arr || arr.length < 2)
          ctx.addIssue({ code: "custom", message: "Saisissez au moins deux éléments à ordonner.", path: ["options"] });
        return; // correctAnswer implicite = ordre de saisie.
      }
      case "SINGLE_CHOICE": {
        if (!arr || arr.length < 2) {
          ctx.addIssue({ code: "custom", message: "Au moins deux options sont requises.", path: ["options"] });
          return;
        }
        if (typeof d.correctAnswer !== "number" || d.correctAnswer < 0 || d.correctAnswer >= arr.length)
          ctx.addIssue({ code: "custom", message: "Sélectionnez la bonne réponse.", path: ["correctAnswer"] });
        return;
      }
      case "MULTIPLE_CHOICE": {
        if (!arr || arr.length < 2) {
          ctx.addIssue({ code: "custom", message: "Au moins deux options sont requises.", path: ["options"] });
          return;
        }
        const ok =
          Array.isArray(d.correctAnswer) &&
          d.correctAnswer.length > 0 &&
          d.correctAnswer.every((n) => typeof n === "number" && n >= 0 && n < arr.length);
        if (!ok) ctx.addIssue({ code: "custom", message: "Cochez au moins une bonne réponse.", path: ["correctAnswer"] });
        return;
      }
    }
  });

export type QuestionInput = z.input<typeof questionSchema>;

/** Normalise l'encodage stocké selon le type (voir contrat §5 / learn-actions). */
function questionData(d: z.infer<typeof questionSchema>) {
  let options: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  let correctAnswer: Prisma.InputJsonValue | typeof Prisma.JsonNull;

  switch (d.type) {
    case "TRUE_FALSE":
      options = Prisma.JsonNull;
      correctAnswer = d.correctAnswer as boolean;
      break;
    case "SHORT_ANSWER":
      options = Prisma.JsonNull;
      // Réponses acceptées, nettoyées.
      correctAnswer = (d.correctAnswer as string[]).map((s) => s.trim()).filter(Boolean);
      break;
    case "MATCHING": {
      const m = d.options as { left: string[]; right: string[] };
      options = { left: m.left, right: m.right };
      correctAnswer = d.correctAnswer as number[];
      break;
    }
    case "ORDERING": {
      const items = (d.options as string[]) ?? [];
      options = items; // ordre d'auteur = ordre correct
      correctAnswer = items.map((_, i) => i); // [0,1,…,n-1] (explicite)
      break;
    }
    default: {
      // SINGLE_CHOICE / MULTIPLE_CHOICE
      options = (d.options as string[]) ?? [];
      correctAnswer = d.correctAnswer as number | number[];
    }
  }

  return {
    type: d.type as QuestionType,
    question: d.question,
    options,
    correctAnswer,
    explanation: d.explanation || null,
    points: d.points ?? 1,
  };
}

export async function createQuestion(assessmentId: string, input: QuestionInput): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(assessmentId);
  const parsed = questionSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: parsed.success ? "Évaluation invalide." : parsed.error.issues[0]?.message ?? "Question invalide." };

  const a = await prisma.assessment.findUnique({ where: { id: idParsed.data }, select: { id: true, courseId: true } });
  if (!a) return { ok: false, error: "Évaluation introuvable." };
  const editor = await requireCourseEditor(a.courseId);
  if (!editor) return NOT_EDITOR;

  const last = await prisma.question.findFirst({ where: { assessmentId: a.id }, orderBy: { order: "desc" }, select: { order: true } });
  await prisma.question.create({ data: { assessmentId: a.id, order: last ? last.order + 1 : 0, ...questionData(parsed.data) } });
  await audit(editor.id, "question.create", "Assessment", a.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Question ajoutée." };
}

export async function updateQuestion(questionId: string, input: QuestionInput): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(questionId);
  const parsed = questionSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: parsed.success ? "Question invalide." : parsed.error.issues[0]?.message ?? "Question invalide." };

  const q = await prisma.question.findUnique({ where: { id: idParsed.data }, select: { id: true, assessment: { select: { courseId: true } } } });
  if (!q) return { ok: false, error: "Question introuvable." };
  const editor = await requireCourseEditor(q.assessment.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.question.update({ where: { id: q.id }, data: questionData(parsed.data) });
  await audit(editor.id, "question.update", "Question", q.id);

  revalidatePath("/admin/formations");
  return { ok: true, message: "Question mise à jour." };
}

export async function deleteQuestion(questionId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(questionId);
  if (!parsed.success) return { ok: false, error: "Question invalide." };

  const q = await prisma.question.findUnique({ where: { id: parsed.data }, select: { assessment: { select: { courseId: true } } } });
  if (!q) return { ok: false, error: "Introuvable." };
  const editor = await requireCourseEditor(q.assessment.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.question.delete({ where: { id: parsed.data } }).catch(() => null);
  await audit(editor.id, "question.delete", "Question", parsed.data);
  revalidatePath("/admin/formations");
  return { ok: true, message: "Question supprimée." };
}

/* ─── Parcours métier : création rapide + fiche (§13) ──────────────────────── */

export async function createCareerPath(title: string, targetJob?: string): Promise<CreateResult> {
  const parsed = z
    .object({ title: z.string().trim().min(3, "Titre trop court.").max(160), targetJob: z.string().trim().max(160).optional() })
    .safeParse({ title, targetJob });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Titre invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: ACCESS_DENIED };

  const slug = await uniqueSlug(slugify(parsed.data.title), "careerPath");
  const path = await prisma.careerPath.create({
    data: { title: parsed.data.title, slug, targetJob: parsed.data.targetJob?.trim() || parsed.data.title, description: "" },
    select: { id: true, slug: true },
  });
  await audit(admin.id, "careerPath.create", "CareerPath", path.id, { title: parsed.data.title });

  revalidatePath("/admin/parcours");
  return { ok: true, id: path.id, slug: path.slug, message: "Parcours créé (brouillon)." };
}

const updatePathSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  subtitle: z.string().optional(), // ignoré (compat) — CareerPath n'a pas de subtitle
  targetJob: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().min(0).optional(),
  missions: z.array(z.string().trim().min(1)).max(30).optional(),
  outcomes: z.array(z.string().trim().min(1)).max(30).optional(),
  entryLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  exitLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  duration: z.string().trim().max(80).nullable().optional().or(z.literal("")),
  rhythm: z.string().trim().max(80).nullable().optional().or(z.literal("")),
  price: z.number().int().min(0).optional(),
  certificationTitle: z.string().trim().max(200).nullable().optional().or(z.literal("")),
  coverImage: z.string().url().nullable().optional().or(z.literal("")),
  featured: z.boolean().optional(),
});

export type UpdatePathInput = z.input<typeof updatePathSchema>;

export async function updateCareerPath(careerPathId: string, input: UpdatePathInput): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(careerPathId);
  const parsed = updatePathSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: parsed.success ? "Parcours invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const path = await prisma.careerPath.findUnique({ where: { id: idParsed.data }, select: { id: true, slug: true } });
  if (!path) return { ok: false, error: "Parcours introuvable." };

  const d = parsed.data;
  await prisma.careerPath.update({
    where: { id: path.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.targetJob !== undefined ? { targetJob: d.targetJob } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.missions !== undefined ? { missions: d.missions } : {}),
      ...(d.outcomes !== undefined ? { outcomes: d.outcomes } : {}),
      ...(d.entryLevel !== undefined ? { entryLevel: d.entryLevel } : {}),
      ...(d.exitLevel !== undefined ? { exitLevel: d.exitLevel } : {}),
      ...(d.duration !== undefined ? { duration: d.duration || null } : {}),
      ...(d.rhythm !== undefined ? { rhythm: d.rhythm || null } : {}),
      ...(d.price !== undefined ? { price: d.price } : {}),
      ...(d.certificationTitle !== undefined ? { certificationTitle: d.certificationTitle || null } : {}),
      ...(d.coverImage !== undefined ? { coverImage: d.coverImage || null } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
    },
  });
  await audit(admin.id, "careerPath.update", "CareerPath", path.id, { fields: Object.keys(d) });

  revalidatePath(`/parcours-metiers/${path.slug}`);
  revalidatePath("/admin/parcours");
  return { ok: true, message: "Parcours mis à jour." };
}

/* ─── Écoles : création + identité (§14) ───────────────────────────────────── */

export async function createSchool(name: string): Promise<CreateResult> {
  const parsed = z.string().trim().min(2, "Nom trop court.").max(120).safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Nom invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: ACCESS_DENIED };

  const slug = await uniqueSlug(slugify(parsed.data), "school");
  const last = await prisma.school.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  const school = await prisma.school.create({
    data: { name: parsed.data, slug, description: "", order: last ? last.order + 1 : 0 },
    select: { id: true, slug: true },
  });
  await audit(admin.id, "school.create", "School", school.id, { name: parsed.data });

  revalidatePath("/admin/ecoles");
  return { ok: true, id: school.id, slug: school.slug, message: "École créée." };
}

const updateSchoolSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().max(200).nullable().optional().or(z.literal("")),
  description: z.string().trim().min(0).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale (#RRGGBB).").optional(),
  icon: z.string().trim().min(1).max(60).optional(),
  coverImage: z.string().url().nullable().optional().or(z.literal("")),
  order: z.number().int().min(0).max(1000).optional(),
});

export type UpdateSchoolInput = z.input<typeof updateSchoolSchema>;

export async function updateSchool(schoolId: string, input: UpdateSchoolInput): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(schoolId);
  const parsed = updateSchoolSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: parsed.success ? "École invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const school = await prisma.school.findUnique({ where: { id: idParsed.data }, select: { id: true, slug: true } });
  if (!school) return { ok: false, error: "École introuvable." };

  const d = parsed.data;
  await prisma.school.update({
    where: { id: school.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline || null } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.color !== undefined ? { color: d.color } : {}),
      ...(d.icon !== undefined ? { icon: d.icon } : {}),
      ...(d.coverImage !== undefined ? { coverImage: d.coverImage || null } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
    },
  });
  await audit(admin.id, "school.update", "School", school.id, { fields: Object.keys(d) });

  revalidatePath("/ecoles");
  revalidatePath(`/ecoles/${school.slug}`);
  revalidatePath("/admin/ecoles");
  return { ok: true, message: "École mise à jour." };
}

/* ─── Jonction École ↔ Parcours (SchoolCareerPath, §43.3) ──────────────────── */

const attachPathSchema = z.object({
  schoolId: z.string().min(1),
  careerPathId: z.string().min(1),
  isPrimary: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export async function attachCareerPathToSchool(input: z.infer<typeof attachPathSchema>): Promise<AdminActionResult> {
  const parsed = attachPathSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;
  const { schoolId, careerPathId, isPrimary, position } = parsed.data;

  const [school, path] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true } }),
    prisma.careerPath.findUnique({ where: { id: careerPathId }, select: { id: true, title: true } }),
  ]);
  if (!school || !path) return { ok: false, error: "École ou parcours introuvable." };

  await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.schoolCareerPath.updateMany({ where: { careerPathId, isPrimary: true, NOT: { schoolId } }, data: { isPrimary: false } });
    }
    await tx.schoolCareerPath.upsert({
      where: { schoolId_careerPathId: { schoolId, careerPathId } },
      update: {
        ...(isPrimary !== undefined ? { isPrimary } : {}),
        ...(position !== undefined ? { position } : {}),
      },
      create: { schoolId, careerPathId, isPrimary: isPrimary ?? false, position: position ?? 0 },
    });
  });
  await audit(admin.id, "schoolCareerPath.attach", "SchoolCareerPath", null, { schoolId, careerPathId });

  revalidatePath("/ecoles");
  revalidatePath("/admin/ecoles");
  return { ok: true, message: `« ${path.title} » rattaché à ${school.name}.` };
}

export async function detachCareerPathFromSchool(schoolId: string, careerPathId: string): Promise<AdminActionResult> {
  const parsed = z.object({ schoolId: z.string().min(1), careerPathId: z.string().min(1) }).safeParse({ schoolId, careerPathId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  await prisma.schoolCareerPath.deleteMany({ where: { schoolId: parsed.data.schoolId, careerPathId: parsed.data.careerPathId } });
  await audit(admin.id, "schoolCareerPath.detach", "SchoolCareerPath", null, parsed.data);

  revalidatePath("/ecoles");
  revalidatePath("/admin/ecoles");
  return { ok: true, message: "Parcours détaché de l'école." };
}
