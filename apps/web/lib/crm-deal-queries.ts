import { prisma } from "@da/db/client";
import { staffScope, type AccessScope } from "./access";
import type { DealCard, DealDetail, DealPipelineStats } from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Data layer Opportunités (Deal) — LECTURE. Un commercial voit uniquement les
   opportunités qui lui sont attribuées ; un admin voit tout.
   ══════════════════════════════════════════════════════════════════════════ */

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

function dealScopeWhere(scope: AccessScope) {
  return scope.scopeAll ? {} : { assignedToId: scope.user.id };
}

export interface CrmDealFilters {
  stage?: string;
  assignee?: string;
  search?: string;
}

export async function getDeals(filters: CrmDealFilters = {}): Promise<DealCard[]> {
  const scope = await staffScope();
  const where: Record<string, unknown> = { archivedAt: null, ...dealScopeWhere(scope) };
  if (filters.stage) where.stage = filters.stage;
  if (filters.assignee && scope.scopeAll) where.assignedToId = filters.assignee;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { organization: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
    if (!scope.scopeAll) {
      where.AND = [{ assignedToId: scope.user.id }];
    }
  }

  const rows = await prisma.deal.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, stage: true, estimatedAmount: true, probability: true,
      expectedCloseDate: true, recommendedOffer: true, updatedAt: true,
      assignedTo: { select: { id: true, name: true } },
      organization: { select: { id: true, name: true } },
      prospect: { select: { id: true } },
      _count: { select: { quotes: true } },
    },
  });

  return rows.map((d) => ({
    id: d.id, title: d.title, stage: d.stage as never,
    estimatedAmount: d.estimatedAmount, probability: d.probability,
    expectedCloseDate: iso(d.expectedCloseDate), assignedTo: d.assignedTo,
    organizationId: d.organization.id, organizationName: d.organization.name,
    prospectId: d.prospect?.id ?? null, recommendedOffer: d.recommendedOffer,
    quoteCount: d._count.quotes, updatedAt: iso(d.updatedAt)!,
  }));
}

export async function getDeal(id: string): Promise<DealDetail | null> {
  const scope = await staffScope();
  const d = await prisma.deal.findFirst({
    where: { id, ...dealScopeWhere(scope) },
    select: {
      id: true, title: true, description: true, stage: true, estimatedAmount: true, currency: true,
      probability: true, expectedCloseDate: true, recommendedOffer: true, identifiedNeed: true,
      competitors: true, lossReason: true, wonAt: true, lostAt: true, conversionStatus: true, createdAt: true,
      assignedTo: { select: { id: true, name: true } },
      organization: {
        select: {
          id: true, name: true,
          contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], select: { id: true, fullName: true } },
        },
      },
      prospect: { select: { id: true } },
      primaryContact: { select: { id: true, fullName: true } },
      project: { select: { id: true } },
      activities: {
        orderBy: { activityDate: "desc" }, take: 50,
        select: { id: true, type: true, subject: true, notes: true, activityDate: true, createdBy: { select: { name: true } } },
      },
      quotes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, title: true, status: true, total: true, sentAt: true, acceptedAt: true, createdAt: true },
      },
    },
  });
  if (!d) return null;

  return {
    id: d.id, title: d.title, description: d.description, stage: d.stage as never,
    estimatedAmount: d.estimatedAmount, currency: d.currency, probability: d.probability,
    expectedCloseDate: iso(d.expectedCloseDate), recommendedOffer: d.recommendedOffer,
    identifiedNeed: d.identifiedNeed, competitors: d.competitors, lossReason: d.lossReason,
    wonAt: iso(d.wonAt), lostAt: iso(d.lostAt), conversionStatus: d.conversionStatus as never,
    createdAt: iso(d.createdAt)!, assignedTo: d.assignedTo,
    organization: { id: d.organization.id, name: d.organization.name },
    prospectId: d.prospect?.id ?? null, primaryContact: d.primaryContact,
    contacts: d.organization.contacts.map((c) => ({ id: c.id, fullName: c.fullName })),
    projectId: d.project?.id ?? null,
    activities: d.activities.map((a) => ({
      id: a.id, type: a.type as never, subject: a.subject, notes: a.notes,
      activityDate: iso(a.activityDate)!, authorName: a.createdBy?.name ?? null,
    })),
    quotes: d.quotes.map((q) => ({
      id: q.id, number: q.number, title: q.title, status: q.status as never, total: q.total,
      sentAt: iso(q.sentAt), acceptedAt: iso(q.acceptedAt), createdAt: iso(q.createdAt)!,
    })),
  };
}

export async function getDealPipelineStats(): Promise<DealPipelineStats> {
  const scope = await staffScope();
  const base = dealScopeWhere(scope);
  const openWhere = { archivedAt: null, stage: { notIn: ["WON", "LOST"] as never }, ...base };

  const [openCount, openAgg, openForWeight, wonAgg, lostCount] = await Promise.all([
    prisma.deal.count({ where: openWhere }),
    prisma.deal.aggregate({ _sum: { estimatedAmount: true }, where: openWhere }),
    prisma.deal.findMany({ where: openWhere, select: { estimatedAmount: true, probability: true } }),
    prisma.deal.aggregate({ _sum: { estimatedAmount: true }, _count: true, where: { archivedAt: null, stage: "WON", ...base } }),
    prisma.deal.count({ where: { archivedAt: null, stage: "LOST", ...base } }),
  ]);

  const weightedValue = openForWeight.reduce((sum, d) => sum + Math.round((d.estimatedAmount ?? 0) * ((d.probability ?? 0) / 100)), 0);

  return {
    openCount,
    pipelineValue: openAgg._sum?.estimatedAmount ?? 0,
    weightedValue,
    wonCount: wonAgg._count,
    wonValue: wonAgg._sum?.estimatedAmount ?? 0,
    lostCount,
  };
}
