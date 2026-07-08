import { redirect } from "next/navigation";
import { Medal, Lock } from "lucide-react";
import { GradientText, cn } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getMyBadges } from "@/lib/learn-queries";
import { DashboardHeading, EmptyState } from "@/components/learner-ui";
import { BADGE_CATEGORY_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard/badges");
  const badges = await getMyBadges(user.id);

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Reconnaissance"
        title={<>Mes <GradientText>badges</GradientText></>}
        description="Les badges attestent d'une compétence ou d'une réalisation, obtenus par preuve au fil de vos projets."
      />

      {badges.length === 0 ? (
        <EmptyState icon={<Medal size={22} />} title="Aucun badge disponible" message="Les badges apparaîtront ici au fur et à mesure de votre progression." />
      ) : (
        <>
          <section>
            <h2 className="mb-4 font-display text-lg font-bold text-navy">Obtenus · {earned.length}</h2>
            {earned.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {earned.map((b) => (
                  <div key={b.id} className="flex flex-col items-center rounded-2xl border border-accent/25 bg-accent/[0.05] p-6 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-accent to-brand-violet text-white shadow-brand">
                      <Medal size={28} />
                    </span>
                    <p className="mt-4 font-display text-base font-bold text-navy">{b.name}</p>
                    <span className="mt-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                      {BADGE_CATEGORY_LABEL[b.category] ?? b.category}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{b.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-navy/15 bg-surface-secondary/50 p-6 text-center text-sm text-text-secondary">
                Vous n'avez pas encore de badge — validez des projets pour en débloquer.
              </p>
            )}
          </section>

          {locked.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-navy">À débloquer</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locked.map((b) => (
                  <div key={b.id} className={cn("flex flex-col items-center rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 text-center opacity-80")}>
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-navy/[0.06] text-text-muted">
                      <Lock size={24} />
                    </span>
                    <p className="mt-4 font-display text-base font-bold text-navy">{b.name}</p>
                    <span className="mt-1 rounded-full bg-navy/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-text-muted">
                      {BADGE_CATEGORY_LABEL[b.category] ?? b.category}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{b.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
