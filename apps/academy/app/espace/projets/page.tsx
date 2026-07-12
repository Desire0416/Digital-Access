import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, ArrowRight, BookOpen, Route as RouteIcon } from "lucide-react";
import { StaggerGroup, StaggerItem, cn } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getMyProjects } from "@/lib/learn-queries";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader } from "@/components/espace/parts";
import { SUBMISSION_META, NOT_SUBMITTED } from "@/components/submission-meta";

export const metadata: Metadata = { title: "Mes projets" };

export default async function MyProjectsPage() {
  const user = await requireUser("/espace/projets");
  const projects = await getMyProjects(user.id);

  return (
    <div>
      <EspaceHeader
        title="Mes projets"
        subtitle="Les projets pratiques de vos formations et parcours. Déposez vos livrables et suivez la correction."
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={40} className="text-brand-blue-vif/40" />}
          title="Aucun projet accessible"
          description="Les projets pratiques apparaissent ici dès que vous êtes inscrit à une formation qui en propose."
          action={{ label: "Parcourir les formations", href: "/formations" }}
        />
      ) : (
        <StaggerGroup className="grid gap-5 sm:grid-cols-2">
          {projects.map((p) => {
            const sub = p.latestSubmission;
            const meta = sub ? SUBMISSION_META[sub.status] ?? NOT_SUBMITTED : NOT_SUBMITTED;
            const Icon = meta.icon;
            const source = p.course ?? p.careerPath ?? null;
            const isPath = !p.course && !!p.careerPath;
            return (
              <StaggerItem key={p.id}>
                <Link
                  href={`/espace/projets/${p.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-all hover:-translate-y-1 hover:border-brand-blue-vif/40 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand" aria-hidden>
                      <FolderKanban size={20} />
                    </span>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", meta.badge)}>
                      <Icon size={12} aria-hidden />
                      {meta.label}
                    </span>
                  </div>

                  <h2 className="mt-3.5 font-display text-base font-bold leading-snug text-navy group-hover:text-brand-blue-royal">
                    {p.title}
                  </h2>
                  {source && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-text-secondary">
                      {isPath ? <RouteIcon size={12} aria-hidden /> : <BookOpen size={12} aria-hidden />}
                      {source.title}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span>
                      Note min. <span className="font-semibold text-navy">{p.minScore}/100</span>
                    </span>
                    <span>
                      Tentatives{" "}
                      <span className="font-semibold text-navy">
                        {p.attemptsUsed}
                        {p.maxAttempts > 0 ? `/${p.maxAttempts}` : ""}
                      </span>
                    </span>
                    {p.isRequired && <span className="font-semibold text-warning">Obligatoire</span>}
                  </div>

                  {sub?.status === "APPROVED" && sub.score !== null && (
                    <p className="mt-3 text-sm font-bold text-success">Note obtenue : {sub.score}/100</p>
                  )}

                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-blue-royal">
                    {sub ? "Voir le détail" : "Déposer mon travail"}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
