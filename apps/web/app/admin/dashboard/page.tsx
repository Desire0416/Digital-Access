import Link from "next/link";
import {
  Target,
  FolderKanban,
  Wallet,
  LifeBuoy,
  Coins,
  TrendingUp,
  UsersRound,
  ArrowUpRight,
  Inbox,
  Sparkles,
} from "lucide-react";
import { formatFCFA, formatDate } from "@da/ui";
import { getDashboardData } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  StatCard,
  StatusPill,
  EmptyState,
  toneColor,
  LEAD_STATUS,
  PROJECT_STATUS,
  TICKET_STATUS,
  TICKET_PRIORITY,
  PROJECT_TYPE,
} from "@/components/admin/ui";
import { BarChart, FunnelBars, DonutChart } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

/* Carte de panneau réutilisable (graphes + listes). */
function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg sm:p-6 ${className ?? ""}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-navy">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs font-medium text-text-muted">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function AdminDashboardPage() {
  const {
    kpis,
    revenueByMonth,
    leadsByStatus,
    projectsByStatus,
    recentLeads,
    recentTickets,
  } = await getDashboardData();

  /* ── Données dérivées pour les graphes ── */
  const revenueData = revenueByMonth.map((m) => ({ label: m.month, value: m.value }));

  const funnelData = leadsByStatus.map((l) => ({
    label: LEAD_STATUS[l.status]?.label ?? l.status,
    value: l.count,
    tint: toneColor(LEAD_STATUS[l.status]?.tone ?? "slate"),
  }));

  const donutData = projectsByStatus.map((p) => ({
    label: PROJECT_STATUS[p.status]?.label ?? p.status,
    value: p.count,
    color: toneColor(PROJECT_STATUS[p.status]?.tone ?? "slate"),
  }));

  return (
    <>
      <AdminPageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité Digital Access."
      />

      {/* ─────────────── KPI — rangée 1 ─────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Target size={20} />}
          label="Leads"
          value={kpis.leadsTotal}
          hint={`${kpis.leadsNew} nouveau${kpis.leadsNew > 1 ? "x" : ""}`}
          tone="blue"
        />
        <StatCard
          icon={<FolderKanban size={20} />}
          label="Projets actifs"
          value={kpis.activeProjects}
          hint="En cours"
          tone="violet"
        />
        <StatCard
          icon={<Wallet size={20} />}
          label="CA encaissé"
          value={formatFCFA(kpis.revenueCollected)}
          hint="Factures payées"
          tone="green"
        />
        <StatCard
          icon={<LifeBuoy size={20} />}
          label="Tickets ouverts"
          value={kpis.openTickets}
          hint="À traiter"
          tone={kpis.openTickets > 0 ? "amber" : "slate"}
        />
      </div>

      {/* ─────────────── KPI — rangée 2 ─────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Coins size={20} />}
          label="CA en attente"
          value={formatFCFA(kpis.revenueOutstanding)}
          hint="Non réglé"
          tone={kpis.revenueOutstanding > 0 ? "amber" : "slate"}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Taux de conversion"
          value={`${kpis.wonRate}%`}
          hint="Leads gagnés"
          tone="cyan"
        />
        <StatCard
          icon={<UsersRound size={20} />}
          label="Clients"
          value={kpis.clients}
          hint="Comptes actifs"
          tone="violet"
        />
      </div>

      {/* ─────────────── Graphes ─────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Revenus encaissés" subtitle="6 derniers mois">
          <BarChart data={revenueData} format="fcfa" />
        </Panel>

        <Panel title="Pipeline commercial" subtitle="Répartition des leads par statut">
          {funnelData.some((d) => d.value > 0) ? (
            <FunnelBars data={funnelData} />
          ) : (
            <div className="grid h-[200px] place-items-center">
              <p className="text-sm text-text-muted">Aucun lead pour le moment.</p>
            </div>
          )}
        </Panel>
      </div>

      {/* ─────────────── Projets par statut ─────────────── */}
      <div className="mt-6">
        <Panel title="Projets par statut" subtitle="Portefeuille de projets en cours et livrés">
          {donutData.length > 0 ? (
            <DonutChart data={donutData} centerLabel="projets" />
          ) : (
            <div className="grid h-40 place-items-center">
              <p className="text-sm text-text-muted">Aucun projet enregistré.</p>
            </div>
          )}
        </Panel>
      </div>

      {/* ─────────────── Listes ─────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Derniers leads */}
        <Panel
          title="Derniers leads"
          subtitle="Nouvelles demandes entrantes"
          action={
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
            >
              Tout voir
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          {recentLeads.length > 0 ? (
            <ul className="-my-1 divide-y divide-navy/[0.06]">
              {recentLeads.map((lead) => {
                const s = LEAD_STATUS[lead.status] ?? { label: lead.status, tone: "slate" as const };
                return (
                  <li key={lead.id}>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-secondary"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{lead.name}</p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {lead.company ? `${lead.company} · ` : ""}
                          {PROJECT_TYPE[lead.projectType] ?? lead.projectType}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusPill label={s.label} tone={s.tone} />
                        <span className="text-[11px] font-medium text-text-muted">
                          {formatDate(lead.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<Sparkles size={20} />}
              title="Aucun lead récent"
              description="Les nouvelles demandes de devis et de contact apparaîtront ici."
            />
          )}
        </Panel>

        {/* Tickets récents */}
        <Panel
          title="Tickets récents"
          subtitle="Demandes de support à suivre"
          action={
            <Link
              href="/admin/tickets"
              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
            >
              Tout voir
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          {recentTickets.length > 0 ? (
            <ul className="-my-1 divide-y divide-navy/[0.06]">
              {recentTickets.map((ticket) => {
                const st = TICKET_STATUS[ticket.status] ?? { label: ticket.status, tone: "slate" as const };
                const pr = TICKET_PRIORITY[ticket.priority] ?? { label: ticket.priority, tone: "slate" as const };
                return (
                  <li key={ticket.id}>
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-secondary"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{ticket.title}</p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {ticket.clientName} · {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusPill label={st.label} tone={st.tone} />
                        <StatusPill label={pr.label} tone={pr.tone} dot={false} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<Inbox size={20} />}
              title="Aucun ticket récent"
              description="Les tickets de support ouverts par vos clients s'afficheront ici."
            />
          )}
        </Panel>
      </div>
    </>
  );
}
