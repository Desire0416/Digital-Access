import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseAdmin, listSchoolsAdmin } from "@/lib/admin-queries";
import { CourseBuilder } from "@/components/admin/CourseBuilder";

export const metadata: Metadata = { title: "Constructeur de formation — Administration" };

export default async function AdminCourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, schools] = await Promise.all([getCourseAdmin(id), listSchoolsAdmin()]);
  if (!course) notFound();

  return (
    <CourseBuilder
      course={course}
      schools={schools.map((s) => ({ id: s.id, name: s.name, color: s.color }))}
    />
  );
}
