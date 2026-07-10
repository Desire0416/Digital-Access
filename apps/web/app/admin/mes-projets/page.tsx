import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Clock, CheckCircle2, AlertTriangle, LifeBuoy, ArrowRight } from "lucide-react";
import { currentUser } from "@da/auth/guards";
import { AdminPageHeader, StatCard, EmptyState, StatusPill, PROJECT_STATUS, type Tone } from "@/components/admin/ui";
import { getChefProjetDashboard } from "@/lib/crm-stats-queries";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes projets" };

export default async function ChefProjetHome() {
  const [user, dash] = await Promise.all([currentUser(), getChefProjetDashboard()]);
  const admin = isAdmin(user);

  return (
    <div>
      <AdminPageHeader
        title="Mes projets"
        description={admin ? "Suivi de production de tous les projets." : "Les projets qui vous sont confiés."}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FolderKanban size={20} />} tone="violet" label="Projets" value={dash.total} />
        <StatCard icon={<Clock size={20} />} tone="blue" label="En cours" value={dash.inProgress} />
        <StatCard icon={<AlertTriangle size={20} />} tone="red" label="En retard" value={dash.overdue} />
        <StatCard icon={<LifeBuoy size={20} />} tone="amber" label="Tickets ouverts" value={dash.openTickets} />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-display text-base font-bold text-navy">Projets suivis</h2>
        {dash.projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={22} />}
            title="Aucun projet"
            description="Les projets qui vous seront attribués après conversion d'une opportunité apparaîtront ici."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {dash.projects.map((p) => {
              const meta = PROJECT_STATUS[p.status];
              return (
                <Link
                  key={p.id}
                  href={`/admin/projets/${p.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-bold text-navy">{p.title}</p>
                      {meta && <StatusPill label={meta.label} tone={meta.tone as Tone} />}
                      {p.isOverdue && <StatusPill label="En retard" tone="red" />}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">{p.clientName}</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-navy/[0.06]">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-text-secondary">
                        {p.completedStages}/{p.totalStages} étapes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.openTickets > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B45309]">
                        <LifeBuoy size={13} /> {p.openTickets}
                      </span>
                    )}
                    <CheckCircle2 size={16} className="text-success" style={{ opacity: p.progress === 100 ? 1 : 0.25 }} />
                    <ArrowRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
