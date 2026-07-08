import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, ExternalLink, Code2 } from "lucide-react";
import { GradientText } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getMyPortfolio } from "@/lib/learn-queries";
import { DashboardHeading, EmptyState } from "@/components/learner-ui";

export const dynamic = "force-dynamic";

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: "Privé",
  PUBLIC: "Public",
  LINK_ONLY: "Sur lien",
  COMPANIES_ONLY: "Entreprises",
};

export default async function PortfolioPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard/portfolio");
  const items = await getMyPortfolio(user.id);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Employabilité"
        title={<>Mon <GradientText>portfolio</GradientText></>}
        description="Les projets professionnels que vous avez réalisés — votre meilleure preuve auprès des recruteurs."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={22} />}
          title="Votre portfolio est vide"
          message="Réalisez et validez les projets de vos parcours : les livrables éligibles viendront enrichir automatiquement votre portfolio."
          action={{ href: "/career-paths", label: "Découvrir les parcours à projets" }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((it) => (
            <article key={it.id} className="flex flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
              {it.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.images[0]} alt={it.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="grid aspect-video w-full place-items-center bg-gradient-da/10 text-brand-violet"><FolderKanban size={32} /></div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-navy">{it.title}</h2>
                  <span className="shrink-0 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                    {VISIBILITY_LABEL[it.visibility] ?? it.visibility}
                  </span>
                </div>
                {it.description && <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">{it.description}</p>}
                {it.toolsUsed.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {it.toolsUsed.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-md bg-brand-blue-vif/10 px-2 py-0.5 text-[11px] font-medium text-brand-blue-royal">{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex items-center gap-3 pt-4">
                  {it.demoUrl && (
                    <Link href={it.demoUrl} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet">
                      <ExternalLink size={14} /> Démo
                    </Link>
                  )}
                  {it.sourceUrl && (
                    <Link href={it.sourceUrl} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:text-brand-violet">
                      <Code2 size={14} /> Code
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
