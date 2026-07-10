import { prisma } from "@da/db/client";
import { staffScope, type AccessScope } from "./access";
import type {
  AssignableUser, CommercialHomeStats, ContactRow, DuplicateMatch,
  OrganizationSummary, ProspectCard, ProspectDetail, ProspectStatus, Priority,
} from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Data layer CRM commercial (LECTURE). Sécurité au niveau ligne : un commercial
   ne voit QUE ses dossiers (assignedToId === lui) ; un admin voit tout. Le scope
   est fourni par staffScope() (defense in depth : le layout garde déjà la route).
   Dates sérialisées en ISO pour franchir la frontière RSC.
   ══════════════════════════════════════════════════════════════════════════ */

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** Fragment `where` de restriction par propriétaire (assignedToId) selon le scope. */
function prospectScopeWhere(scope: AccessScope) {
  return scope.scopeAll ? {} : { assignedToId: scope.user.id };
}

export interface CrmProspectFilters {
  status?: string;
  sector?: string;
  priority?: string;
  assignee?: string; // admin uniquement
  city?: string;
  source?: string;
  maturity?: string;
  search?: string;
}

const contactSelect = {
  id: true, firstName: true, lastName: true, fullName: true, jobTitle: true, department: true,
  email: true, phone: true, whatsapp: true, linkedinUrl: true, isPrimary: true,
  isDecisionMaker: true, influenceLevel: true, preferredChannel: true, notes: true,
} as const;

function mapContact(c: {
  id: string; fullName: string; jobTitle: string | null; department: string | null;
  email: string | null; phone: string | null; whatsapp: string | null; linkedinUrl: string | null;
  isPrimary: boolean; isDecisionMaker: boolean; influenceLevel: string | null;
  preferredChannel: string | null; notes: string | null;
}): ContactRow {
  return {
    id: c.id, fullName: c.fullName, jobTitle: c.jobTitle, department: c.department,
    email: c.email, phone: c.phone, whatsapp: c.whatsapp, linkedinUrl: c.linkedinUrl,
    isPrimary: c.isPrimary, isDecisionMaker: c.isDecisionMaker, influenceLevel: c.influenceLevel,
    preferredChannel: c.preferredChannel, notes: c.notes,
  };
}

function mapOrganization(o: {
  id: string; name: string; slug: string; organizationType: string; sector: string | null;
  city: string | null; country: string | null; lifecycleStage: string; website: string | null;
  email: string | null; phone: string | null; whatsapp: string | null; linkedinUrl: string | null;
  facebookUrl: string | null; instagramUrl: string | null; googleBusinessUrl: string | null;
  description: string | null; owner: { id: string; name: string } | null;
}): OrganizationSummary {
  return {
    id: o.id, name: o.name, slug: o.slug, organizationType: o.organizationType as never,
    sector: o.sector, city: o.city, country: o.country, lifecycleStage: o.lifecycleStage as never,
    website: o.website, email: o.email, phone: o.phone, whatsapp: o.whatsapp, linkedinUrl: o.linkedinUrl,
    facebookUrl: o.facebookUrl, instagramUrl: o.instagramUrl, googleBusinessUrl: o.googleBusinessUrl,
    description: o.description, owner: o.owner,
  };
}

/* ─── Liste des prospects (filtrée + scopée) ────────────────────────────────── */

export async function getProspects(filters: CrmProspectFilters = {}): Promise<ProspectCard[]> {
  const scope = await staffScope();
  const where: Record<string, unknown> = { archivedAt: null, ...prospectScopeWhere(scope) };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  // L'attribution n'est filtrable QUE par un admin (un commercial est déjà scopé).
  if (filters.assignee && scope.scopeAll) where.assignedToId = filters.assignee;
  if (filters.maturity) where.digitalMaturity = filters.maturity;

  const orgFilter: Record<string, unknown> = {};
  if (filters.sector) orgFilter.sector = filters.sector;
  if (filters.city) orgFilter.city = { contains: filters.city, mode: "insensitive" };
  if (filters.search) orgFilter.name = { contains: filters.search, mode: "insensitive" };
  if (Object.keys(orgFilter).length) where.organization = orgFilter;
  if (filters.source) where.source = filters.source;

  const rows = await prisma.prospect.findMany({
    where,
    orderBy: [{ nextActionDate: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true, status: true, priority: true, recommendedOffer: true, digitalMaturity: true,
      estimatedPotential: true, mainObservedNeed: true, nextAction: true, nextActionDate: true,
      lastActivityAt: true, createdAt: true,
      assignedTo: { select: { id: true, name: true } },
      organization: { select: { id: true, name: true, organizationType: true, sector: true, city: true } },
      audits: {
        select: { overallSeverity: true }, orderBy: { createdAt: "desc" }, take: 1,
        where: { archivedAt: null },
      },
      _count: { select: { audits: true } },
    },
  });

  return rows.map((p) => ({
    id: p.id,
    organizationId: p.organization.id,
    organizationName: p.organization.name,
    organizationType: p.organization.organizationType as never,
    sector: p.organization.sector,
    city: p.organization.city,
    status: p.status as ProspectStatus,
    priority: (p.priority as Priority) ?? null,
    assignedTo: p.assignedTo,
    recommendedOffer: p.recommendedOffer,
    digitalMaturity: p.digitalMaturity,
    estimatedPotential: p.estimatedPotential,
    mainObservedNeed: p.mainObservedNeed,
    nextAction: p.nextAction,
    nextActionDate: iso(p.nextActionDate),
    lastActivityAt: iso(p.lastActivityAt),
    lastAuditSeverity: (p.audits[0]?.overallSeverity as never) ?? null,
    auditCount: p._count.audits,
    createdAt: iso(p.createdAt)!,
  }));
}

/* ─── Détail d'un prospect (fiche à onglets) ────────────────────────────────── */

export async function getProspect(id: string): Promise<ProspectDetail | null> {
  const scope = await staffScope();
  const p = await prisma.prospect.findFirst({
    where: { id, ...prospectScopeWhere(scope) },
    select: {
      id: true, status: true, priority: true, source: true, digitalMaturity: true,
      estimatedPotential: true, recommendedOffer: true, mainObservedNeed: true, contactStatus: true,
      nextAction: true, nextActionDate: true, lastActivityAt: true, createdAt: true,
      assignedTo: { select: { id: true, name: true } },
      organization: {
        select: {
          id: true, name: true, slug: true, organizationType: true, sector: true, city: true,
          country: true, lifecycleStage: true, website: true, email: true, phone: true, whatsapp: true,
          linkedinUrl: true, facebookUrl: true, instagramUrl: true, googleBusinessUrl: true, description: true,
          owner: { select: { id: true, name: true } },
          contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], select: contactSelect },
        },
      },
      activities: {
        orderBy: { activityDate: "desc" }, take: 50,
        select: { id: true, type: true, subject: true, notes: true, activityDate: true, createdBy: { select: { name: true } } },
      },
      audits: {
        where: { archivedAt: null }, orderBy: { createdAt: "desc" },
        select: {
          id: true, reference: true, title: true, status: true, version: true, overallSeverity: true,
          auditDate: true, createdAt: true, _count: { select: { findings: true } },
        },
      },
      tasks: {
        where: { status: { in: ["TODO", "IN_PROGRESS", "OVERDUE"] } }, orderBy: { dueDate: "asc" },
        select: { id: true, title: true, type: true, priority: true, status: true, dueDate: true, assignedTo: { select: { name: true } } },
      },
      deals: {
        where: { archivedAt: null }, orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, stage: true, estimatedAmount: true, probability: true, expectedCloseDate: true },
      },
    },
  });
  if (!p) return null;

  return {
    id: p.id,
    status: p.status as never,
    priority: (p.priority as never) ?? null,
    source: p.source,
    digitalMaturity: p.digitalMaturity,
    estimatedPotential: p.estimatedPotential,
    recommendedOffer: p.recommendedOffer,
    mainObservedNeed: p.mainObservedNeed,
    contactStatus: p.contactStatus,
    nextAction: p.nextAction,
    nextActionDate: iso(p.nextActionDate),
    lastActivityAt: iso(p.lastActivityAt),
    createdAt: iso(p.createdAt)!,
    assignedTo: p.assignedTo,
    organization: mapOrganization(p.organization),
    contacts: p.organization.contacts.map(mapContact),
    activities: p.activities.map((a) => ({
      id: a.id, type: a.type as never, subject: a.subject, notes: a.notes,
      activityDate: iso(a.activityDate)!, authorName: a.createdBy?.name ?? null,
    })),
    audits: p.audits.map((a) => ({
      id: a.id, reference: a.reference, title: a.title, status: a.status as never, version: a.version,
      overallSeverity: (a.overallSeverity as never) ?? null, findingCount: a._count.findings,
      auditDate: iso(a.auditDate), createdAt: iso(a.createdAt)!,
    })),
    tasks: p.tasks.map((t) => ({
      id: t.id, title: t.title, type: t.type as never, priority: t.priority as never,
      status: t.status as never, dueDate: iso(t.dueDate), assignedToName: t.assignedTo?.name ?? null,
    })),
    deals: p.deals.map((d) => ({
      id: d.id, title: d.title, stage: d.stage as never, estimatedAmount: d.estimatedAmount,
      probability: d.probability, expectedCloseDate: iso(d.expectedCloseDate),
    })),
  };
}

/* ─── Organisation (fiche) ──────────────────────────────────────────────────── */

export async function getOrganization(id: string): Promise<OrganizationSummary | null> {
  await staffScope();
  const o = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true, name: true, slug: true, organizationType: true, sector: true, city: true, country: true,
      lifecycleStage: true, website: true, email: true, phone: true, whatsapp: true, linkedinUrl: true,
      facebookUrl: true, instagramUrl: true, googleBusinessUrl: true, description: true,
      owner: { select: { id: true, name: true } },
    },
  });
  return o ? mapOrganization(o) : null;
}

/* ─── Commerciaux assignables ───────────────────────────────────────────────── */

export async function getAssignableCommercials(): Promise<AssignableUser[]> {
  await staffScope();
  const users = await prisma.user.findMany({
    where: { roles: { hasSome: ["COMMERCIAL", "ADMIN", "SUPER_ADMIN"] as never }, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, roles: true },
  });
  return users.map((u) => ({ id: u.id, name: u.name, roles: u.roles as string[] }));
}

/** Chefs de projet assignables (CHEF_PROJET + admins). */
export async function getProjectManagers(): Promise<AssignableUser[]> {
  await staffScope();
  const users = await prisma.user.findMany({
    where: { roles: { hasSome: ["CHEF_PROJET", "ADMIN", "SUPER_ADMIN"] as never }, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, roles: true },
  });
  return users.map((u) => ({ id: u.id, name: u.name, roles: u.roles as string[] }));
}

/* ─── Détection de doublons (organisation) ──────────────────────────────────── */

function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function findDuplicateOrganizations(input: {
  name?: string; website?: string; email?: string; phone?: string; whatsapp?: string;
}): Promise<DuplicateMatch[]> {
  await staffScope();
  const or: Record<string, unknown>[] = [];
  const name = (input.name ?? "").trim();
  if (name.length >= 3) or.push({ name: { contains: name, mode: "insensitive" } });
  if (input.email) or.push({ email: { equals: input.email.trim(), mode: "insensitive" } });
  if (input.phone) or.push({ phone: input.phone.trim() });
  if (input.whatsapp) or.push({ whatsapp: input.whatsapp.trim() });
  if (!or.length) return [];

  const rows = await prisma.organization.findMany({
    where: { OR: or, archivedAt: null },
    take: 8,
    select: { id: true, name: true, slug: true, website: true, email: true, phone: true, lifecycleStage: true },
  });

  const targetDomain = domainOf(input.website);
  const seen = new Set<string>();
  const matches: DuplicateMatch[] = [];
  for (const r of rows) {
    let reason = "nom similaire";
    if (input.email && r.email && r.email.toLowerCase() === input.email.trim().toLowerCase()) reason = "même email";
    else if (input.phone && r.phone === input.phone.trim()) reason = "même téléphone";
    else if (targetDomain && domainOf(r.website) === targetDomain) reason = "même site web";
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    matches.push({ id: r.id, name: r.name, slug: r.slug, reason, lifecycleStage: r.lifecycleStage as never });
  }
  // Correspondance de domaine web même si le nom diffère
  if (targetDomain) {
    const byDomain = await prisma.organization.findMany({
      where: { archivedAt: null, website: { contains: targetDomain, mode: "insensitive" } },
      take: 5, select: { id: true, name: true, slug: true, lifecycleStage: true },
    });
    for (const r of byDomain) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      matches.push({ id: r.id, name: r.name, slug: r.slug, reason: "même site web", lifecycleStage: r.lifecycleStage as never });
    }
  }
  return matches.slice(0, 8);
}

/* ─── Tableau de bord commercial (stats scopées) ────────────────────────────── */

export async function getCommercialHomeStats(): Promise<CommercialHomeStats> {
  const scope = await staffScope();
  const pScope = prospectScopeWhere(scope);
  const dealScope = scope.scopeAll ? {} : { assignedToId: scope.user.id };
  const auditScope = scope.scopeAll ? {} : { authorId: scope.user.id };
  const taskScope = scope.scopeAll ? {} : { assignedToId: scope.user.id };

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    assignedProspects, toContact, auditsInProgress, auditsToValidate,
    followUpsToday, followUpsOverdue, openDeals, pipeline, wonDeals,
  ] = await Promise.all([
    prisma.prospect.count({ where: { archivedAt: null, ...pScope } }),
    prisma.prospect.count({ where: { archivedAt: null, status: { in: ["READY_TO_CONTACT", "FOLLOW_UP_REQUIRED"] }, ...pScope } }),
    prisma.audit.count({ where: { archivedAt: null, status: { in: ["IN_PROGRESS", "DRAFT"] }, ...auditScope } }),
    prisma.audit.count({ where: { archivedAt: null, status: "TO_VALIDATE", ...auditScope } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lte: endOfToday }, ...taskScope } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS", "OVERDUE"] }, dueDate: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }, ...taskScope } }),
    prisma.deal.count({ where: { archivedAt: null, stage: { notIn: ["WON", "LOST"] }, ...dealScope } }),
    prisma.deal.aggregate({ _sum: { estimatedAmount: true }, where: { archivedAt: null, stage: { notIn: ["WON", "LOST"] }, ...dealScope } }),
    prisma.deal.count({ where: { archivedAt: null, stage: "WON", ...dealScope } }),
  ]);

  return {
    assignedProspects, toContact, auditsInProgress, auditsToValidate,
    followUpsToday, followUpsOverdue, openDeals,
    pipelineValue: pipeline._sum.estimatedAmount ?? 0, wonDeals,
  };
}
