import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCareerPathForEdit, getSchoolOptions } from "@/lib/admin-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { PathEditForm } from "@/components/admin/PathEditForm";

export const dynamic = "force-dynamic";

export default async function EditCareerPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [path, schools] = await Promise.all([getCareerPathForEdit(id), getSchoolOptions()]);

  if (!path) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/parcours"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          <ArrowLeft size={15} /> Retour aux parcours
        </Link>
      </div>

      <AdminPageHeader
        title={path.title}
        description="Modifiez les informations, le rattachement et la mise en avant de ce parcours métier."
      />

      <PathEditForm path={path} schools={schools} />
    </>
  );
}
