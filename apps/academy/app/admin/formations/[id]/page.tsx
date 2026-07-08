import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getShortCourseForEdit, getSchoolOptions } from "@/lib/admin-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { ShortCourseEditForm } from "@/components/admin/ShortCourseEditForm";

export const dynamic = "force-dynamic";

export default async function EditShortCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, schools] = await Promise.all([getShortCourseForEdit(id), getSchoolOptions()]);

  if (!course) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/formations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          <ArrowLeft size={15} /> Retour aux formations
        </Link>
      </div>

      <AdminPageHeader
        title={course.title}
        description="Modifiez les informations, le rattachement et la mise en avant de cette formation courte."
      />

      <ShortCourseEditForm course={course} schools={schools} />
    </>
  );
}
