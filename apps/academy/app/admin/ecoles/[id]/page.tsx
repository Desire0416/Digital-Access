import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSchoolForEdit } from "@/lib/admin-queries";
import { AdminPageHeader, StatusPill, COURSE_STATUS } from "@/components/admin/ui";
import { SchoolEditForm } from "@/components/admin/SchoolEditForm";

export const dynamic = "force-dynamic";

export default async function AdminSchoolEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchoolForEdit(id);
  if (!school) notFound();

  const st = COURSE_STATUS[school.status] ?? { label: school.status, tone: "slate" as const };

  return (
    <>
      <Link
        href="/admin/ecoles"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
      >
        <ArrowLeft size={16} />
        Retour aux écoles
      </Link>

      <AdminPageHeader
        title={school.name}
        description={<span className="font-mono text-xs">/{school.slug}</span>}
      >
        <StatusPill label={st.label} tone={st.tone} />
      </AdminPageHeader>

      <SchoolEditForm school={school} />
    </>
  );
}
