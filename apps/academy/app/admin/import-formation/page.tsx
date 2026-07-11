import type { Metadata } from "next";
import { prisma } from "@da/db/client";
import { AdminPageHeader } from "@/components/admin/ui";
import { ImportFormationForm } from "./ImportFormationForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Importer une formation — Administration",
  robots: { index: false, follow: false },
};

export default async function ImportFormationPage() {
  const schools = await prisma.school.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <>
      <AdminPageHeader
        title="Importer une formation"
        description="Déposez un document pédagogique (Word, PDF, Markdown ou texte). L'IA en extrait la formation complète — modules, leçons, progression et quiz notés — que vous pouvez relire, ajuster, puis publier en un clic."
      />
      <ImportFormationForm schools={schools} />
    </>
  );
}
