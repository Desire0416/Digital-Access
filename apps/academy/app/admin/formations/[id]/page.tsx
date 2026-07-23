import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseAdmin, listSchoolsAdmin, getCourseEnrollmentsAdmin } from "@/lib/admin-queries";
import { getSkillOptions } from "@/lib/skill-queries";
import { getCoursePrerequisiteOptions } from "@/lib/prerequisite-queries";
import { CourseBuilder } from "@/components/admin/CourseBuilder";

export const metadata: Metadata = { title: "Constructeur de formation — Administration" };

export default async function AdminCourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, schools, skillOptions, prerequisiteOptions, enrollments] = await Promise.all([
    getCourseAdmin(id),
    listSchoolsAdmin(),
    getSkillOptions(),
    getCoursePrerequisiteOptions(id),
    getCourseEnrollmentsAdmin(id),
  ]);
  if (!course) notFound();

  return (
    <CourseBuilder
      course={course}
      schools={schools.map((s) => ({ id: s.id, name: s.name, color: s.color }))}
      skillOptions={skillOptions}
      prerequisiteOptions={prerequisiteOptions}
      enrollments={enrollments}
    />
  );
}
