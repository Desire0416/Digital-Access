import { prisma } from "@da/db/client";
import { staffScope } from "./access";
import {
  DEAL_KANBAN_STAGES, DEAL_STAGE_LABEL, PROSPECT_STATUS_LABEL,
} from "./crm-types";
import type {
  CommercialDashboard, DashCommercialRow, ChefProjetDashboard, PmProjectRow,
  DealStage, ProspectStatus,
} from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Rapports & tableaux de bord CRM. Scopés : l'admin voit toute l'équipe, un
   commercial ses propres chiffres. Agrégation en mémoire (échelle CRM modérée).
   ══════════════════════════════════════════════════════════════════════════ */

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export async function getCommercialDashboard(): Promise<CommercialDashboard> {
  const scope = await staffScope();
  const pWhere = scope.scopeAll ? {} : { assignedToId: scope.user.id };
  const dWhere = scope.scopeAll ? {} : { assignedToId: scope.user.id };
  const aWhere = scope.scopeAll ? {} : { authorId: scope.user.id };
  const qWhere = scope.scopeAll ? {} : { deal: { assignedToId: scope.user.id } };

  const [prospects, deals, auditsSent, quotes] = await Promise.all([
    prisma.prospect.findMany({ where: { archivedAt: null, ...pWhere }, select: { status: true, assignedTo: { select: { id: true, name: true } } } }),
    prisma.deal.findMany({ where: { archivedAt: null, ...dWhere }, select: { stage: true, estimatedAmount: true, probability: true, wonAt: true, assignedTo: { select: { id: true, name: true } } } }),
    prisma.audit.count({ where: { archivedAt: null, status: "SENT", ...aWhere } }),
    prisma.quote.findMany({ where: qWhere, select: { status: true } }),
  ]);

  const isOpen = (s: string) => s !== "WON" && s !== "LOST";
  const openDeals = deals.filter((d) => isOpen(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "WON");
  const lostDeals = deals.filter((d) => d.stage === "LOST");
  const won = wonDeals.length;
  const lost = lostDeals.length;

  const kpis = {
    prospects: prospects.length,
    auditsSent,
    openDeals: openDeals.length,
    pipelineValue: openDeals.reduce((s, d) => s + (d.estimatedAmount ?? 0), 0),
    weightedValue: openDeals.reduce((s, d) => s + Math.round((d.estimatedAmount ?? 0) * ((d.probability ?? 0) / 100)), 0),
    quotesSent: quotes.filter((q) => q.status !== "DRAFT").length,
    won,
    wonValue: wonDeals.reduce((s, d) => s + (d.estimatedAmount ?? 0), 0),
    lost,
    conversionRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0,
  };

  // Entonnoir par étape.
  const funnel = DEAL_KANBAN_STAGES.map((stage) => {
    const rows = deals.filter((d) => d.stage === stage);
    return { stage: stage as DealStage, label: DEAL_STAGE_LABEL[stage], count: rows.length, value: rows.reduce((s, d) => s + (d.estimatedAmount ?? 0), 0) };
  }).filter((f) => f.count > 0);

  // Prospects par statut.
  const statusCounts = new Map<string, number>();
  for (const p of prospects) statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);
  const prospectsByStatus = [...statusCounts.entries()]
    .map(([status, count]) => ({ status: status as ProspectStatus, label: PROSPECT_STATUS_LABEL[status as ProspectStatus], count }))
    .sort((a, b) => b.count - a.count);

  // Gagnés par mois (6 derniers mois).
  const now = new Date();
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const rows = wonDeals.filter((w) => {
      if (!w.wonAt) return false;
      const wd = new Date(w.wonAt);
      return `${wd.getFullYear()}-${wd.getMonth()}` === key;
    });
    return { label: MONTHS_FR[d.getMonth()], wonCount: rows.length, wonValue: rows.reduce((s, r) => s + (r.estimatedAmount ?? 0), 0) };
  });

  // Performance par commercial (admin uniquement).
  let byCommercial: DashCommercialRow[] = [];
  if (scope.scopeAll) {
    const map = new Map<string, DashCommercialRow>();
    const ensure = (id: string | null, name: string | null) => {
      const key = id ?? "none";
      if (!map.has(key)) map.set(key, { id: key, name: name ?? "Non attribué", prospects: 0, openDeals: 0, won: 0, wonValue: 0, conversionRate: 0 });
      return map.get(key)!;
    };
    for (const p of prospects) ensure(p.assignedTo?.id ?? null, p.assignedTo?.name ?? null).prospects++;
    const lostByRep = new Map<string, number>();
    for (const d of deals) {
      const row = ensure(d.assignedTo?.id ?? null, d.assignedTo?.name ?? null);
      if (isOpen(d.stage)) row.openDeals++;
      else if (d.stage === "WON") { row.won++; row.wonValue += d.estimatedAmount ?? 0; }
      else if (d.stage === "LOST") lostByRep.set(row.id, (lostByRep.get(row.id) ?? 0) + 1);
    }
    byCommercial = [...map.values()].map((r) => {
      const l = lostByRep.get(r.id) ?? 0;
      return { ...r, conversionRate: r.won + l > 0 ? Math.round((r.won / (r.won + l)) * 100) : 0 };
    }).sort((a, b) => b.wonValue - a.wonValue || b.won - a.won);
  }

  return { scopeAll: scope.scopeAll, kpis, funnel, prospectsByStatus, monthly, byCommercial };
}

export async function getChefProjetDashboard(): Promise<ChefProjetDashboard> {
  const scope = await staffScope();
  const where = scope.scopeAll ? { deletedAt: null } : { deletedAt: null, projectManagerId: scope.user.id };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true, title: true, slug: true, status: true, endDate: true,
      client: { select: { name: true } },
      stages: { select: { status: true } },
      _count: { select: { tickets: true } },
    },
  });

  const now = new Date();
  const openTicketsAgg = await prisma.ticket.count({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] }, project: scope.scopeAll ? { deletedAt: null } : { projectManagerId: scope.user.id } },
  });

  const rows: PmProjectRow[] = projects.map((p) => {
    const total = p.stages.length;
    const completed = p.stages.filter((s) => s.status === "COMPLETED").length;
    const isOverdue = !!p.endDate && p.endDate < now && p.status !== "DELIVERED" && p.status !== "ARCHIVED";
    return {
      id: p.id, title: p.title, slug: p.slug, status: p.status, clientName: p.client.name,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0, totalStages: total, completedStages: completed,
      endDate: iso(p.endDate), isOverdue, openTickets: p._count.tickets,
    };
  });

  return {
    total: rows.length,
    inProgress: rows.filter((r) => r.status === "IN_PROGRESS").length,
    delivered: rows.filter((r) => r.status === "DELIVERED").length,
    overdue: rows.filter((r) => r.isOverdue).length,
    openTickets: openTicketsAgg,
    projects: rows,
  };
}
