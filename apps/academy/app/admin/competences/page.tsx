import type { Metadata } from "next";
import { getSkillsAdmin } from "@/lib/skill-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { SkillsManager } from "@/components/admin/SkillsManager";

export const metadata: Metadata = { title: "Compétences — Administration" };

/* Server Component : charge le référentiel de compétences complet (§21) puis
   délègue création / édition / suppression au SkillsManager côté client. Route
   gardée par app/admin/layout.tsx (AdminShell + requireRole admin) et par
   getSkillsAdmin (guard admin). */

export default async function AdminSkillsPage() {
  const skills = await getSkillsAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Référentiel"
        title="Compétences"
        description="Le référentiel de compétences (§21) rattaché aux formations, crédité au passeport des apprenants. Chaque compétence acquise devient une preuve vérifiable dans leur profil."
      />
      <SkillsManager skills={skills} />
    </div>
  );
}
