import { redirect } from "next/navigation";
import { Briefcase, MapPin, Wifi, Building2 } from "lucide-react";
import { GradientText, cn } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getRecommendedOpportunities } from "@/lib/learn-queries";
import { DashboardHeading, EmptyState, ProgressBar } from "@/components/learner-ui";
import { OPPORTUNITY_TYPE_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

export default async function OpportunitesPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard/opportunites");
  const opportunities = await getRecommendedOpportunities(user.id);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Insertion"
        title={<>Opportunités <GradientText>pour vous</GradientText></>}
        description="Offres publiées par les entreprises partenaires, classées par correspondance avec vos compétences."
      />

      {opportunities.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={22} />}
          title="Aucune opportunité pour l'instant"
          message="Les offres de nos entreprises partenaires apparaîtront ici. Continuez à développer vos compétences pour améliorer votre correspondance."
          action={{ href: "/career-paths", label: "Développer mes compétences" }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {opportunities.map((o) => (
            <article key={o.id} className="flex flex-col gap-4 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:flex-row sm:items-center">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand"><Briefcase size={22} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base font-bold text-navy">{o.title}</h2>
                  <span className="rounded-full bg-brand-blue-vif/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-blue-royal">
                    {OPPORTUNITY_TYPE_LABEL[o.type] ?? o.type}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1"><Building2 size={13} /> {o.companyName}</span>
                  {o.location && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {o.location}</span>}
                  {o.remote && <span className="inline-flex items-center gap-1 text-success"><Wifi size={13} /> À distance</span>}
                </div>
                {o.requiredSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.requiredSkills.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-md bg-navy/[0.05] px-2 py-0.5 text-[11px] font-medium text-text-secondary">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full shrink-0 sm:w-40">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-text-secondary">Correspondance</span>
                  <span className={cn("font-bold", o.matchScore >= 60 ? "text-success" : o.matchScore >= 30 ? "text-brand-blue-royal" : "text-text-muted")}>
                    {o.matchScore}%
                  </span>
                </div>
                <ProgressBar value={o.matchScore} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
