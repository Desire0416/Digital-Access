"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/academy-db/client";
import { requireAdminFresh, requireCourseEditor } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Compétences (§21) — MUTATIONS.
   · Référentiel `Skill` : réservé aux admins (requireAdminFresh).
   · Rattachements `CourseSkill` : admin OU formateur propriétaire de la
     formation (requireCourseEditor), comme les autres contenus (§29.2).
   ══════════════════════════════════════════════════════════════════════════ */

export type SkillActionResult = { ok: true; message?: string } | { ok: false; error: string };

const DENIED: SkillActionResult = { ok: false, error: "Accès réservé aux administrateurs." };
const NOT_EDITOR: SkillActionResult = { ok: false, error: "Vous n'êtes pas autorisé à modifier cette formation." };

const SKILL_LEVELS = ["DISCOVERY", "BEGINNER", "OPERATIONAL", "ADVANCED", "EXPERT"] as const;

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
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Rend un slug unique dans la table Skill (suffixe -2, -3… si besoin). */
async function uniqueSkillSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "competence";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const existing = await prisma.skill.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/* ─── Référentiel (admin) ──────────────────────────────────────────────────── */

const skillSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(80),
  domain: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type SkillInput = z.input<typeof skillSchema>;

export async function createSkill(input: SkillInput): Promise<SkillActionResult> {
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const base = {
    name: parsed.data.name,
    domain: parsed.data.domain?.trim() || null,
    description: parsed.data.description?.trim() || null,
  };
  const slug = await uniqueSkillSlug(slugify(parsed.data.name));

  // La vérif d'unicité et la création ne sont pas atomiques : sur collision de
  // slug (deux créations concurrentes du même nom), Skill.slug @unique lève P2002.
  // On réessaie une fois avec un suffixe garanti unique, puis on échoue proprement.
  let skill: { id: string; name: string };
  try {
    skill = await prisma.skill.create({ data: { ...base, slug }, select: { id: true, name: true } });
  } catch {
    try {
      skill = await prisma.skill.create({
        data: { ...base, slug: `${slug}-${Date.now().toString(36)}` },
        select: { id: true, name: true },
      });
    } catch {
      return { ok: false, error: "Impossible de créer la compétence. Réessayez." };
    }
  }
  await audit(admin.id, "skill.create", "Skill", skill.id, { name: skill.name });

  revalidatePath("/admin/competences");
  return { ok: true, message: `Compétence « ${skill.name} » créée.` };
}

export async function updateSkill(skillId: string, input: SkillInput): Promise<SkillActionResult> {
  const idParsed = z.string().min(1).safeParse(skillId);
  const parsed = skillSchema.safeParse(input);
  if (!idParsed.success || !parsed.success)
    return { ok: false, error: parsed.success ? "Compétence invalide." : parsed.error.issues[0]?.message ?? "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const skill = await prisma.skill.findUnique({ where: { id: idParsed.data }, select: { id: true } });
  if (!skill) return { ok: false, error: "Compétence introuvable." };

  // Le slug reste stable après création (ne casse pas les liens/instantanés).
  await prisma.skill.update({
    where: { id: skill.id },
    data: {
      name: parsed.data.name,
      domain: parsed.data.domain?.trim() || null,
      description: parsed.data.description?.trim() || null,
    },
  });
  await audit(admin.id, "skill.update", "Skill", skill.id);

  revalidatePath("/admin/competences");
  return { ok: true, message: "Compétence mise à jour." };
}

export async function deleteSkill(skillId: string): Promise<SkillActionResult> {
  const parsed = z.string().min(1).safeParse(skillId);
  if (!parsed.success) return { ok: false, error: "Compétence invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const skill = await prisma.skill.findUnique({
    where: { id: parsed.data },
    select: { id: true, name: true, _count: { select: { courses: true } } },
  });
  if (!skill) return { ok: false, error: "Compétence introuvable." };
  if (skill._count.courses > 0) {
    return {
      ok: false,
      error: `Détachez-la d'abord des ${skill._count.courses} formation(s) qui l'utilisent.`,
    };
  }

  try {
    await prisma.skill.delete({ where: { id: skill.id } });
  } catch {
    return { ok: false, error: "Suppression impossible pour le moment. Réessayez." };
  }
  await audit(admin.id, "skill.delete", "Skill", skill.id, { name: skill.name });

  revalidatePath("/admin/competences");
  return { ok: true, message: "Compétence supprimée." };
}

/* ─── Rattachements CourseSkill (éditeur : admin ou propriétaire) ───────────── */

const courseSkillSchema = z.object({
  courseId: z.string().min(1),
  skillId: z.string().min(1),
  targetLevel: z.enum(SKILL_LEVELS),
  isPrimary: z.boolean(),
});

/** Rattache (ou met à jour) une compétence à une formation. Upsert idempotent. */
export async function setCourseSkill(
  courseId: string,
  skillId: string,
  targetLevel: (typeof SKILL_LEVELS)[number],
  isPrimary: boolean,
): Promise<SkillActionResult> {
  const parsed = courseSkillSchema.safeParse({ courseId, skillId, targetLevel, isPrimary });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const editor = await requireCourseEditor(parsed.data.courseId);
  if (!editor) return NOT_EDITOR;

  const skill = await prisma.skill.findUnique({ where: { id: parsed.data.skillId }, select: { id: true } });
  if (!skill) return { ok: false, error: "Compétence introuvable." };

  await prisma.courseSkill.upsert({
    where: { courseId_skillId: { courseId: parsed.data.courseId, skillId: parsed.data.skillId } },
    create: {
      courseId: parsed.data.courseId,
      skillId: parsed.data.skillId,
      targetLevel: parsed.data.targetLevel,
      isPrimary: parsed.data.isPrimary,
    },
    update: { targetLevel: parsed.data.targetLevel, isPrimary: parsed.data.isPrimary },
  });
  await audit(editor.id, "course.skill.set", "Course", parsed.data.courseId, { skillId: parsed.data.skillId });

  revalidatePath("/admin/formations");
  return { ok: true, message: "Compétence rattachée." };
}

/** Détache une compétence d'une formation. */
export async function removeCourseSkill(courseId: string, skillId: string): Promise<SkillActionResult> {
  const parsed = z.object({ courseId: z.string().min(1), skillId: z.string().min(1) }).safeParse({ courseId, skillId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const editor = await requireCourseEditor(parsed.data.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.courseSkill
    .delete({ where: { courseId_skillId: { courseId: parsed.data.courseId, skillId: parsed.data.skillId } } })
    .catch(() => null);
  await audit(editor.id, "course.skill.remove", "Course", parsed.data.courseId, { skillId: parsed.data.skillId });

  revalidatePath("/admin/formations");
  return { ok: true, message: "Compétence détachée." };
}
