import type { Metadata } from "next";
import { listMentorAssignmentsAdmin, listMentorsForPicker, searchLearnersForMentor } from "@/lib/mentor-admin-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { MentorAssignments } from "@/components/admin/MentorAssignments";

export const metadata: Metadata = { title: "Mentorat — Administration" };

export default async function AdminMentoratPage() {
  const [assignments, mentors] = await Promise.all([listMentorAssignmentsAdmin(), listMentorsForPicker()]);

  // Server Action fine passée au client : recherche d'apprenants (requêtes server-only).
  async function searchLearners(q: string) {
    "use server";
    return searchLearnersForMentor(q);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Suivi personnalisé"
        title="Mentorat"
        description="Assignez des apprenants aux mentors pour un suivi personnalisé."
      />
      <MentorAssignments assignments={assignments} mentors={mentors} searchLearners={searchLearners} />
    </div>
  );
}
