import { prisma } from "@da/db/client";
import { currentUser, hasRole, type SessionUser } from "@da/auth/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Data layer — CRM Admin Digital Access (lecture).
   Toutes les fonctions exigent le rôle ADMIN / SUPER_ADMIN (defense in depth :
   le layout /admin garde déjà la route, mais chaque requête re-vérifie).
   Les dates sont sérialisées en ISO pour traverser la frontière RSC.
   ══════════════════════════════════════════════════════════════════════════ */

export type LeadStatus =
  | "NEW" | "CONTACTED" | "QUOTE_SENT" | "NEGOTIATION" | "WON" | "LOST";
export type ProjectStatus =
  | "PENDING" | "IN_PROGRESS" | "REVIEW" | "DELIVERED" | "MAINTENANCE" | "ARCHIVED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ProjectType =
  | "SITE_VITRINE" | "SITE_INSTITUTIONNEL" | "ELEARNING" | "REFONTE" | "MAINTENANCE" | "OTHER";

/** Garde partagée — lève si l'appelant n'est pas admin. Retourne l'admin courant. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser();
  if (!hasRole(user, "ADMIN", "SUPER_ADMIN")) {
    throw new Error("Accès refusé — réservé à l'administration.");
  }
  return user!;
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/* ─────────────────────────────── Dashboard ─────────────────────────────── */

export interface DashboardData {
  kpis: {
    leadsTotal: number;
    leadsNew: number;
    activeProjects: number;
    revenueCollected: number;
    revenueOutstanding: number;
    openTickets: number;
    wonRate: number; // % leads gagnés / (gagnés+perdus)
    clients: number;
  };
  revenueByMonth: { month: string; value: number }[]; // 6 derniers mois
  leadsByStatus: { status: LeadStatus; count: number }[];
  projectsByStatus: { status: ProjectStatus; count: number }[];
  recentLeads: {
    id: string; name: string; company: string | null; projectType: ProjectType;
    status: LeadStatus; createdAt: string;
  }[];
  recentTickets: {
    id: string; title: string; priority: TicketPriority; status: TicketStatus;
    clientName: string; createdAt: string;
  }[];
}

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();

  const [leads, projects, invoices, openTickets, clients, recentLeadsRaw, recentTicketsRaw] =
    await Promise.all([
      prisma.lead.findMany({
        where: { deletedAt: null },
        select: { status: true, createdAt: true },
      }),
      prisma.project.findMany({
        where: { deletedAt: null },
        select: { status: true },
      }),
      prisma.invoice.findMany({
        select: { total: true, status: true, paidAt: true, createdAt: true },
      }),
      prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.user.count({ where: { roles: { has: "CLIENT" }, deletedAt: null } }),
      prisma.lead.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, company: true, projectType: true, status: true, createdAt: true },
      }),
      prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, title: true, priority: true, status: true, createdAt: true,
          client: { select: { name: true } },
        },
      }),
    ]);

  // KPIs
  const leadsNew = leads.filter((l) => l.status === "NEW").length;
  const won = leads.filter((l) => l.status === "WON").length;
  const lost = leads.filter((l) => l.status === "LOST").length;
  const activeProjects = projects.filter((p) =>
    ["PENDING", "IN_PROGRESS", "REVIEW"].includes(p.status),
  ).length;
  const revenueCollected = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0);
  const revenueOutstanding = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.total, 0);

  // Revenus encaissés par mois (6 derniers)
  const now = new Date();
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS_FR[d.getMonth()]!, value: 0 });
  }
  for (const inv of invoices) {
    if (inv.status !== "PAID") continue;
    const when = inv.paidAt ?? inv.createdAt;
    const key = `${when.getFullYear()}-${when.getMonth()}`;
    const b = buckets.find((x) => x.key === key);
    if (b) b.value += inv.total;
  }

  const leadStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST"];
  const projectStatuses: ProjectStatus[] = ["PENDING", "IN_PROGRESS", "REVIEW", "DELIVERED", "MAINTENANCE", "ARCHIVED"];

  return {
    kpis: {
      leadsTotal: leads.length,
      leadsNew,
      activeProjects,
      revenueCollected,
      revenueOutstanding,
      openTickets,
      wonRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0,
      clients,
    },
    revenueByMonth: buckets.map((b) => ({ month: b.label, value: b.value })),
    leadsByStatus: leadStatuses.map((status) => ({
      status,
      count: leads.filter((l) => l.status === status).length,
    })),
    projectsByStatus: projectStatuses
      .map((status) => ({ status, count: projects.filter((p) => p.status === status).length }))
      .filter((s) => s.count > 0),
    recentLeads: recentLeadsRaw.map((l) => ({
      id: l.id, name: l.name, company: l.company, projectType: l.projectType as ProjectType,
      status: l.status as LeadStatus, createdAt: iso(l.createdAt)!,
    })),
    recentTickets: recentTicketsRaw.map((t) => ({
      id: t.id, title: t.title, priority: t.priority as TicketPriority,
      status: t.status as TicketStatus, clientName: t.client.name, createdAt: iso(t.createdAt)!,
    })),
  };
}

/* ─────────────────────────────────── Leads ─────────────────────────────── */

export interface LeadCard {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  projectType: ProjectType;
  budget: string | null;
  status: LeadStatus;
  source: string | null;
  assignee: { id: string; name: string } | null;
  createdAt: string;
}

export async function getLeads(): Promise<LeadCard[]> {
  await requireAdmin();
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, phone: true, company: true,
      projectType: true, budget: true, status: true, source: true, createdAt: true,
      assignee: { select: { id: true, name: true } },
    },
  });
  return leads.map((l) => ({
    id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company,
    projectType: l.projectType as ProjectType, budget: l.budget,
    status: l.status as LeadStatus, source: l.source,
    assignee: l.assignee ? { id: l.assignee.id, name: l.assignee.name } : null,
    createdAt: iso(l.createdAt)!,
  }));
}

export interface LeadDetail extends LeadCard {
  message: string;
  timeline: string | null;
  notes: string | null;
  documents: string[];
  updatedAt: string;
  convertedProjectId: string | null;
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  await requireAdmin();
  const l = await prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true } },
    },
  });
  if (!l) return null;
  return {
    id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company,
    projectType: l.projectType as ProjectType, budget: l.budget,
    status: l.status as LeadStatus, source: l.source,
    assignee: l.assignee ? { id: l.assignee.id, name: l.assignee.name } : null,
    createdAt: iso(l.createdAt)!, updatedAt: iso(l.updatedAt)!,
    message: l.message, timeline: l.timeline, notes: l.notes,
    documents: l.documents, convertedProjectId: l.project?.id ?? null,
  };
}

/** Admins/super-admins — cibles d'assignation d'un lead. */
export async function getAssignableAdmins(): Promise<{ id: string; name: string }[]> {
  await requireAdmin();
  const admins = await prisma.user.findMany({
    where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] }, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return admins;
}

/* ────────────────────────────────── Projets ────────────────────────────── */

export interface ProjectRow {
  id: string;
  title: string;
  slug: string;
  type: ProjectType;
  status: ProjectStatus;
  budget: number | null;
  client: { id: string; name: string; email: string };
  progress: number;
  totalStages: number;
  completedStages: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export async function getAdminProjects(): Promise<ProjectRow[]> {
  await requireAdmin();
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, type: true, status: true, budget: true,
      startDate: true, endDate: true, createdAt: true,
      client: { select: { id: true, name: true, email: true } },
      stages: { select: { status: true } },
    },
  });
  return projects.map((p) => {
    const total = p.stages.length;
    const done = p.stages.filter((s) => s.status === "COMPLETED").length;
    return {
      id: p.id, title: p.title, slug: p.slug, type: p.type as ProjectType,
      status: p.status as ProjectStatus, budget: p.budget,
      client: p.client,
      totalStages: total, completedStages: done,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      startDate: iso(p.startDate), endDate: iso(p.endDate), createdAt: iso(p.createdAt)!,
    };
  });
}

export interface AdminStage {
  id: string; name: string; description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"; position: number;
  deliverables: string[]; completedAt: string | null;
}
export interface AdminProjectMessage {
  id: string; content: string; createdAt: string;
  author: { name: string; isTeam: boolean };
}
export interface AdminProjectInvoice {
  id: string; number: string; total: number; status: InvoiceStatus; dueDate: string | null;
}
export interface AdminProjectDetail extends ProjectRow {
  description: string;
  liveUrl: string | null;
  stages: AdminStage[];
  messages: AdminProjectMessage[];
  invoices: AdminProjectInvoice[];
}

export async function getAdminProject(id: string): Promise<AdminProjectDetail | null> {
  await requireAdmin();
  const p = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { id: true, name: true, email: true } },
      stages: { orderBy: { position: "asc" } },
      invoices: { orderBy: { createdAt: "desc" }, select: { id: true, number: true, total: true, status: true, dueDate: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, roles: true } } },
      },
    },
  });
  if (!p) return null;
  const total = p.stages.length;
  const done = p.stages.filter((s) => s.status === "COMPLETED").length;
  return {
    id: p.id, title: p.title, slug: p.slug, type: p.type as ProjectType,
    status: p.status as ProjectStatus, budget: p.budget,
    client: p.client, description: p.description, liveUrl: p.liveUrl,
    totalStages: total, completedStages: done,
    progress: total > 0 ? Math.round((done / total) * 100) : 0,
    startDate: iso(p.startDate), endDate: iso(p.endDate), createdAt: iso(p.createdAt)!,
    stages: p.stages.map((s) => ({
      id: s.id, name: s.name, description: s.description,
      status: s.status as AdminStage["status"], position: s.position,
      deliverables: s.deliverables, completedAt: iso(s.completedAt),
    })),
    invoices: p.invoices.map((i) => ({
      id: i.id, number: i.number, total: i.total, status: i.status as InvoiceStatus, dueDate: iso(i.dueDate),
    })),
    messages: p.messages.map((m) => ({
      id: m.id, content: m.content, createdAt: iso(m.createdAt)!,
      author: { name: m.user.name, isTeam: m.user.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN") },
    })),
  };
}

/* ───────────────────────────────── Factures ────────────────────────────── */

export interface InvoiceLineItem { label: string; quantity: number; unitPrice: number }

export interface InvoiceRow {
  id: string; number: string; total: number; status: InvoiceStatus;
  clientName: string; projectTitle: string | null;
  dueDate: string | null; createdAt: string;
}

export async function getAdminInvoices(): Promise<InvoiceRow[]> {
  await requireAdmin();
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, number: true, total: true, status: true, dueDate: true, createdAt: true,
      client: { select: { name: true } },
      project: { select: { title: true } },
    },
  });
  return invoices.map((i) => ({
    id: i.id, number: i.number, total: i.total, status: i.status as InvoiceStatus,
    clientName: i.client.name, projectTitle: i.project?.title ?? null,
    dueDate: iso(i.dueDate), createdAt: iso(i.createdAt)!,
  }));
}

export interface AdminInvoiceDetail {
  id: string; number: string; items: InvoiceLineItem[];
  amount: number; tax: number; total: number; status: InvoiceStatus;
  dueDate: string | null; paidAt: string | null; createdAt: string;
  client: { id: string; name: string; email: string };
  project: { id: string; title: string } | null;
}

export async function getAdminInvoice(id: string): Promise<AdminInvoiceDetail | null> {
  await requireAdmin();
  const i = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true } },
    },
  });
  if (!i) return null;
  return {
    id: i.id, number: i.number, items: (i.items as unknown as InvoiceLineItem[]) ?? [],
    amount: i.amount, tax: i.tax, total: i.total, status: i.status as InvoiceStatus,
    dueDate: iso(i.dueDate), paidAt: iso(i.paidAt), createdAt: iso(i.createdAt)!,
    client: i.client, project: i.project,
  };
}

/** Clients (rôle CLIENT) — cibles de facturation / projets. */
export async function getClients(): Promise<{ id: string; name: string; email: string }[]> {
  await requireAdmin();
  return prisma.user.findMany({
    where: { roles: { has: "CLIENT" }, deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

/* ───────────────────────────────── Tickets ─────────────────────────────── */

export interface TicketRow {
  id: string; title: string; priority: TicketPriority; status: TicketStatus;
  clientName: string; projectTitle: string | null; messageCount: number;
  createdAt: string; updatedAt: string;
}

export async function getAdminTickets(): Promise<TicketRow[]> {
  await requireAdmin();
  const tickets = await prisma.ticket.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true, title: true, priority: true, status: true, createdAt: true, updatedAt: true,
      client: { select: { name: true } },
      project: { select: { title: true } },
      _count: { select: { messages: true } },
    },
  });
  return tickets.map((t) => ({
    id: t.id, title: t.title, priority: t.priority as TicketPriority, status: t.status as TicketStatus,
    clientName: t.client.name, projectTitle: t.project?.title ?? null, messageCount: t._count.messages,
    createdAt: iso(t.createdAt)!, updatedAt: iso(t.updatedAt)!,
  }));
}

export interface TicketDetail {
  id: string; title: string; description: string;
  priority: TicketPriority; status: TicketStatus;
  client: { id: string; name: string; email: string };
  projectTitle: string | null;
  createdAt: string;
  messages: { id: string; content: string; createdAt: string; author: { name: string; isTeam: boolean } }[];
}

export async function getAdminTicket(id: string): Promise<TicketDetail | null> {
  await requireAdmin();
  const t = await prisma.ticket.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      project: { select: { title: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, roles: true } } } },
    },
  });
  if (!t) return null;
  return {
    id: t.id, title: t.title, description: t.description,
    priority: t.priority as TicketPriority, status: t.status as TicketStatus,
    client: t.client, projectTitle: t.project?.title ?? null, createdAt: iso(t.createdAt)!,
    messages: t.messages.map((m) => ({
      id: m.id, content: m.content, createdAt: iso(m.createdAt)!,
      author: { name: m.user.name, isTeam: m.user.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN") },
    })),
  };
}

/* ─────────────────────────────────── Blog ──────────────────────────────── */

export interface BlogRow {
  id: string; title: string; slug: string; category: string | null;
  status: BlogStatus; readMinutes: number; authorName: string;
  publishedAt: string | null; updatedAt: string;
}

export async function getAdminBlogPosts(): Promise<BlogRow[]> {
  await requireAdmin();
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, slug: true, category: true, status: true, readMinutes: true,
      publishedAt: true, updatedAt: true, author: { select: { name: true } },
    },
  });
  return posts.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, category: p.category,
    status: p.status as BlogStatus, readMinutes: p.readMinutes, authorName: p.author.name,
    publishedAt: iso(p.publishedAt), updatedAt: iso(p.updatedAt)!,
  }));
}

export interface BlogPostDetail {
  id: string; title: string; slug: string; excerpt: string; content: string;
  coverImage: string | null; category: string | null; tags: string[];
  status: BlogStatus; readMinutes: number; publishedAt: string | null;
}

export async function getAdminBlogPost(id: string): Promise<BlogPostDetail | null> {
  await requireAdmin();
  const p = await prisma.blogPost.findUnique({ where: { id } });
  if (!p) return null;
  return {
    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
    coverImage: p.coverImage, category: p.category, tags: p.tags,
    status: p.status as BlogStatus, readMinutes: p.readMinutes, publishedAt: iso(p.publishedAt),
  };
}

/* ──────────────────────────────── Portfolio ────────────────────────────── */

export interface PortfolioRow {
  id: string; title: string; slug: string; client: string; type: string;
  category: string; featured: boolean; technologies: string[]; createdAt: string;
}

export async function getAdminPortfolio(): Promise<PortfolioRow[]> {
  await requireAdmin();
  const items = await prisma.portfolioProject.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, client: true, type: true,
      category: true, featured: true, technologies: true, createdAt: true,
    },
  });
  return items.map((p) => ({ ...p, createdAt: iso(p.createdAt)! }));
}

export interface PortfolioDetail {
  id: string; title: string; slug: string; description: string; client: string;
  type: string; category: string; year: number; url: string | null;
  coverImage: string | null; images: string[];
  technologies: string[]; featured: boolean; testimonial: string | null;
}

export async function getAdminPortfolioItem(id: string): Promise<PortfolioDetail | null> {
  await requireAdmin();
  const p = await prisma.portfolioProject.findUnique({ where: { id } });
  if (!p) return null;
  return {
    id: p.id, title: p.title, slug: p.slug, description: p.description, client: p.client,
    type: p.type, category: p.category, year: p.year, url: p.url,
    coverImage: p.coverImage, images: p.images,
    technologies: p.technologies, featured: p.featured, testimonial: p.testimonial,
  };
}

/* ────────────────────────────── Utilisateurs ───────────────────────────── */

export interface UserRow {
  id: string; name: string; email: string; avatar: string | null;
  roles: string[]; isActive: boolean; emailVerified: boolean;
  phone: string | null; location: string | null; createdAt: string;
}

export async function getAdminUsers(): Promise<UserRow[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, avatar: true, roles: true, isActive: true,
      emailVerified: true, phone: true, location: true, createdAt: true,
    },
  });
  return users.map((u) => ({
    id: u.id, name: u.name, email: u.email, avatar: u.avatar, roles: u.roles,
    isActive: u.isActive, emailVerified: Boolean(u.emailVerified),
    phone: u.phone, location: u.location, createdAt: iso(u.createdAt)!,
  }));
}
