import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCourseEditor } from "@/lib/guards";
import { getCourseForEditor } from "@/lib/admin-queries";
import { getSkillOptions } from "@/lib/skill-queries";
import { CourseBuilder } from "@/components/admin/CourseBuilder";

export const metadata: Metadata = { title: "Éditer une formation — Studio formateur" };

/* Éditeur de formation pour le formateur (§29.2). requireCourseEditor autorise
   l'admin OU le formateur assigné (CourseInstructor) — la lecture qui suit
   (getCourseForEditor) n'est donc PAS re-gardée admin. Le formateur édite le
   contenu et soumet à validation : il ne publie pas et ne gère pas les écoles. */

export default async function FormateurCourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const editor = await requireCourseEditor(id);
  if (!editor) notFound();

  const [course, skillOptions] = await Promise.all([getCourseForEditor(id), getSkillOptions()]);
  if (!course) notFound();

  return (
    <CourseBuilder
      course={course}
      schools={[]}
      skillOptions={skillOptions}
      canManageSchools={false}
      canPublish={false}
      backHref="/formateur/formations"
      backLabel="Mes formations"
    />
  );
}
