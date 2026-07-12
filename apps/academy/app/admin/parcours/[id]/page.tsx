import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCareerPathAdmin, listCoursesForPicker } from "@/lib/admin-queries";
import { PathBuilder } from "@/components/admin/PathBuilder";

export const metadata: Metadata = { title: "Constructeur de parcours — Administration" };

export default async function AdminPathBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [path, catalogue] = await Promise.all([getCareerPathAdmin(id), listCoursesForPicker()]);
  if (!path) notFound();

  return (
    <PathBuilder
      path={path}
      catalogue={catalogue.map((c) => ({ id: c.id, title: c.title, slug: c.slug, level: c.level, price: c.price, status: c.status }))}
    />
  );
}
