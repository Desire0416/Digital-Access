"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/academy-db/client";
import { requireCourseEditor } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Prérequis structurés (§22.1) — mutations. Éditeur = admin OU formateur
   propriétaire de la formation (requireCourseEditor), comme les autres contenus.
   ══════════════════════════════════════════════════════════════════════════ */

export type PrereqActionResult = { ok: true; message?: string } | { ok: false; error: string };

const NOT_EDITOR: PrereqActionResult = { ok: false, error: "Vous n'êtes pas autorisé à modifier cette formation." };

const schema = z.object({ courseId: z.string().min(1), requiresCourseId: z.string().min(1) });

export async function addCoursePrerequisite(courseId: string, requiresCourseId: string): Promise<PrereqActionResult> {
  const parsed = schema.safeParse({ courseId, requiresCourseId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  if (parsed.data.courseId === parsed.data.requiresCourseId)
    return { ok: false, error: "Une formation ne peut pas être son propre prérequis." };

  const editor = await requireCourseEditor(parsed.data.courseId);
  if (!editor) return NOT_EDITOR;

  // La formation éditée doit exister — le fast-path admin de requireCourseEditor
  // ne le garantit pas, sinon l'upsert lève un P2003 (FK) hors Server Action.
  const self = await prisma.course.findUnique({ where: { id: parsed.data.courseId }, select: { id: true } });
  if (!self) return { ok: false, error: "Formation introuvable." };

  // Le prérequis doit être une formation PUBLIÉE : cohérent avec le sélecteur et
  // le verrou (publié seulement), et évite de divulguer le titre d'un brouillon
  // via un id arbitraire (même message générique qu'un id inexistant).
  const req = await prisma.course.findUnique({
    where: { id: parsed.data.requiresCourseId },
    select: { id: true, title: true, status: true },
  });
  if (!req || req.status !== "PUBLISHED") return { ok: false, error: "Formation prérequise introuvable ou non publiée." };

  // Anti-cycle direct : la formation requise ne doit pas déjà requérir celle-ci.
  const reverse = await prisma.coursePrerequisite.findUnique({
    where: {
      courseId_requiresCourseId: { courseId: parsed.data.requiresCourseId, requiresCourseId: parsed.data.courseId },
    },
    select: { courseId: true },
  });
  if (reverse) return { ok: false, error: "Cycle de prérequis : cette formation est déjà un prérequis de l'autre." };

  await prisma.coursePrerequisite.upsert({
    where: {
      courseId_requiresCourseId: { courseId: parsed.data.courseId, requiresCourseId: parsed.data.requiresCourseId },
    },
    create: { courseId: parsed.data.courseId, requiresCourseId: parsed.data.requiresCourseId },
    update: {},
  });

  revalidatePath("/admin/formations");
  revalidatePath("/formateur/formations");
  return { ok: true, message: `Prérequis « ${req.title} » ajouté.` };
}

export async function removeCoursePrerequisite(courseId: string, requiresCourseId: string): Promise<PrereqActionResult> {
  const parsed = schema.safeParse({ courseId, requiresCourseId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const editor = await requireCourseEditor(parsed.data.courseId);
  if (!editor) return NOT_EDITOR;

  await prisma.coursePrerequisite
    .delete({
      where: {
        courseId_requiresCourseId: { courseId: parsed.data.courseId, requiresCourseId: parsed.data.requiresCourseId },
      },
    })
    .catch(() => null); // idempotent : déjà retiré

  revalidatePath("/admin/formations");
  revalidatePath("/formateur/formations");
  return { ok: true, message: "Prérequis retiré." };
}
