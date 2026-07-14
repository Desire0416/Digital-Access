import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getRecommendations } from "@/lib/recommendations";
import { EspaceHeader } from "@/components/espace/parts";
import { EmptyState } from "@/components/EmptyState";
import { RecommendationGrid } from "@/components/RecommendationGrid";

export const metadata: Metadata = { title: "Recommandations" };

export default async function RecommendationsPage() {
  const user = await requireUser("/espace/recommandations");
  const recommendations = await getRecommendations(user.id, { limit: 9 });

  return (
    <div>
      <EspaceHeader
        title="Recommandé pour vous"
        subtitle="Des formations et parcours choisis d'après votre niveau, vos objectifs, vos résultats et vos acquis."
      />

      {recommendations.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={40} className="text-brand-blue-vif/40" />}
          title="Pas encore de recommandation"
          description="Commencez une formation ou ajoutez des favoris : nos suggestions s'affineront au fil de votre progression."
          action={{ label: "Explorer le catalogue", href: "/formations" }}
        />
      ) : (
        <RecommendationGrid recommendations={recommendations} columns={3} />
      )}
    </div>
  );
}
