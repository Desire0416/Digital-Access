import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCohortAdmin, listCohortTargetsForPicker, searchCohortUsers } from "@/lib/cohort-admin-queries";
import { CohortEditor } from "@/components/admin/CohortEditor";

export const metadata: Metadata = { title: "Édition de cohorte — Administration" };

export default async function AdminCohortEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cohort, targets] = await Promise.all([getCohortAdmin(id), listCohortTargetsForPicker()]);
  if (!cohort) notFound();

  // Server Action fine passée au client : recherche d'utilisateurs (server-only côté requêtes).
  async function searchUsers(q: string) {
    "use server";
    return searchCohortUsers(q);
  }

  return <CohortEditor cohort={cohort} targets={targets} searchUsers={searchUsers} />;
}
