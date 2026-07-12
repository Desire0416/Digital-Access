import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolAdmin, listCoursesForPicker, listCareerPathsForPicker } from "@/lib/admin-queries";
import { SchoolEditor } from "@/components/admin/SchoolEditor";

export const metadata: Metadata = { title: "Édition d'école — Administration" };

export default async function AdminSchoolEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [school, courses, paths] = await Promise.all([
    getSchoolAdmin(id),
    listCoursesForPicker(),
    listCareerPathsForPicker(),
  ]);
  if (!school) notFound();

  return (
    <SchoolEditor
      school={school}
      courses={courses.map((c) => ({ id: c.id, title: c.title, slug: c.slug, level: c.level, status: c.status }))}
      paths={paths.map((p) => ({ id: p.id, title: p.title, slug: p.slug, targetJob: p.targetJob, status: p.status }))}
    />
  );
}
