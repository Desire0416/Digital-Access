import type { Metadata } from "next";
import { requireUser } from "@/lib/guards";
import { getLearnerCompetences } from "@/lib/skill-queries";
import { EspaceHeader } from "@/components/espace/parts";
import { CompetenceProfile } from "@/components/espace/CompetenceProfile";

export const metadata: Metadata = { title: "Mes compétences" };

export default async function CompetencesPage() {
  const user = await requireUser("/espace/competences");
  const data = await getLearnerCompetences(user.id);

  return (
    <div>
      <EspaceHeader
        title="Mes compétences"
        subtitle="Votre passeport de compétences — acquises par vos formations validées, prêtes à être présentées à un employeur."
      />
      <CompetenceProfile data={data} />
    </div>
  );
}
