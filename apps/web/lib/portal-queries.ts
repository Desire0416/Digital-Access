import { prisma } from "@da/db/client";

/* ────────────────────────────── Types ──────────────────────────────────────── */

export type ProjectStatus =
  | "PENDING" | "IN_PROGRESS" | "REVIEW" | "DELIVERED" | "MAINTENANCE" | "ARCHIVED";
export type StageStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type MaintenancePlan = "BASIC" | "STANDARD" | "PREMIUM";

export interface InvoiceLineItem {
  label: string;
  quantity: number;
  unitPrice: number;
}

export interface StageItem {
  id: string;
  name: string;
  description: string | null;
  status: StageStatus;
  position: number;
  deliverables: string[];
  completedAt: string | null;
}

export interface ProjectMessageItem {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; isTeam: boolean };
}

export interface InvoiceMini {
  id: string;
  number: string;
  total: number;
  status: InvoiceStatus;
  dueDate: string | null;
}

export interface ProjectListItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  totalStages: number;
  completedStages: number;
  currentStage: string | null;
  progress: number; // 0–100
}

export interface ProjectDetail extends ProjectListItem {
  description: string;
  budget: number | null;
  liveUrl: string | null;
  stages: StageItem[];
  messages: ProjectMessageItem[];
  invoices: InvoiceMini[];
  maintenance: { plan: MaintenancePlan } | null;
}

export interface InvoiceDetail {
  id: string;
  number: string;
  items: InvoiceLineItem[];
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  projectTitle: string | null;
  client: { name: string; email: string; phone: string | null; location: string | null };
}

export interface MaintenanceItem {
  id: string;
  plan: MaintenancePlan;
  services: string[];
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  monthlyAmount: number;
  projectTitle: string;
  projectSlug: string;
}

export interface TicketItem {
  id: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  messageCount: number;
  projectTitle: string | null;
}

export interface TicketMessageItem {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; isTeam: boolean };
}

export interface TicketDetail {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  projectTitle: string | null;
  messages: TicketMessageItem[];
}

export interface ClientDashboard {
  user: { name: string; email: string };
  stats: { activeProjects: number; openTickets: number; unpaidTotal: number };
  projects: ProjectListItem[];
  upcomingInvoice: InvoiceMini | null;
  recentMessages: (ProjectMessageItem & { projectTitle: string; projectId: string })[];
}

/* ────────────────────────────── Helpers ────────────────────────────────────── */

function projectProgress(stages: { status: string }[]): {
  total: number;
  completed: number;
  progress: number;
} {
  const total = stages.length;
  const completed = stages.filter((s) => s.status === "COMPLETED").length;
  return { total, completed, progress: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

const projectListSelect = {
  id: true,
  title: true,
  slug: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
  stages: { orderBy: { position: "asc" }, select: { status: true, name: true, position: true } },
} as const;

function toListItem(p: {
  id: string; title: string; slug: string; type: string; status: string;
  startDate: Date | null; endDate: Date | null;
  stages: { status: string; name: string; position: number }[];
}): ProjectListItem {
  const { total, completed, progress } = projectProgress(p.stages);
  const current = p.stages.find((s) => s.status === "IN_PROGRESS") ?? p.stages.find((s) => s.status === "PENDING");
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    type: p.type,
    status: p.status as ProjectStatus,
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    totalStages: total,
    completedStages: completed,
    currentStage: current?.name ?? null,
    progress,
  };
}

/* ────────────────────────────── Dashboard ──────────────────────────────────── */

export async function getClientDashboard(userId: string): Promise<ClientDashboard | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) return null;

  const projects = await prisma.project.findMany({
    where: { clientId: userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: projectListSelect,
  });
  const list = projects.map(toListItem);

  const [openTickets, unpaid, upcoming, recent] = await Promise.all([
    prisma.ticket.count({ where: { clientId: userId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.invoice.aggregate({
      where: { clientId: userId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { total: true },
    }),
    prisma.invoice.findFirst({
      where: { clientId: userId, status: { in: ["SENT", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      select: { id: true, number: true, total: true, status: true, dueDate: true },
    }),
    prisma.projectMessage.findMany({
      where: { project: { clientId: userId } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true, content: true, createdAt: true, userId: true,
        user: { select: { name: true } },
        project: { select: { id: true, title: true, clientId: true } },
      },
    }),
  ]);

  return {
    user,
    stats: {
      activeProjects: list.filter((p) => !["DELIVERED", "ARCHIVED"].includes(p.status)).length,
      openTickets,
      unpaidTotal: unpaid._sum.total ?? 0,
    },
    projects: list,
    upcomingInvoice: upcoming
      ? { id: upcoming.id, number: upcoming.number, total: upcoming.total, status: upcoming.status as InvoiceStatus, dueDate: upcoming.dueDate?.toISOString() ?? null }
      : null,
    recentMessages: recent.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      author: { name: m.user.name, isTeam: m.userId !== m.project.clientId },
      projectTitle: m.project.title,
      projectId: m.project.id,
    })),
  };
}

/* ────────────────────────────── Projets ────────────────────────────────────── */

export async function getClientProjects(userId: string): Promise<ProjectListItem[]> {
  const projects = await prisma.project.findMany({
    where: { clientId: userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: projectListSelect,
  });
  return projects.map(toListItem);
}

export async function getProjectDetail(userId: string, projectId: string): Promise<ProjectDetail | null> {
  const p = await prisma.project.findFirst({
    where: { id: projectId, clientId: userId, deletedAt: null },
    select: {
      ...projectListSelect,
      description: true,
      budget: true,
      liveUrl: true,
      clientId: true,
      stages: {
        orderBy: { position: "asc" },
        select: { id: true, name: true, description: true, status: true, position: true, deliverables: true, completedAt: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, content: true, createdAt: true, userId: true, user: { select: { name: true } } },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, total: true, status: true, dueDate: true },
      },
      contract: { select: { plan: true } },
    },
  });
  if (!p) return null;

  const base = toListItem({
    id: p.id, title: p.title, slug: p.slug, type: p.type, status: p.status,
    startDate: p.startDate, endDate: p.endDate,
    stages: p.stages.map((s) => ({ status: s.status, name: s.name, position: s.position })),
  });

  return {
    ...base,
    description: p.description,
    budget: p.budget,
    liveUrl: p.liveUrl,
    stages: p.stages.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      status: s.status as StageStatus,
      position: s.position,
      deliverables: s.deliverables,
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
    messages: p.messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      author: { name: m.user.name, isTeam: m.userId !== p.clientId },
    })),
    invoices: p.invoices.map((i) => ({
      id: i.id, number: i.number, total: i.total, status: i.status as InvoiceStatus, dueDate: i.dueDate?.toISOString() ?? null,
    })),
    maintenance: p.contract ? { plan: p.contract.plan as MaintenancePlan } : null,
  };
}

/* ────────────────────────────── Factures ───────────────────────────────────── */

export async function getClientInvoices(userId: string): Promise<(InvoiceMini & { projectTitle: string | null; createdAt: string })[]> {
  const invoices = await prisma.invoice.findMany({
    where: { clientId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, number: true, total: true, status: true, dueDate: true, createdAt: true,
      project: { select: { title: true } },
    },
  });
  return invoices.map((i) => ({
    id: i.id, number: i.number, total: i.total, status: i.status as InvoiceStatus,
    dueDate: i.dueDate?.toISOString() ?? null, createdAt: i.createdAt.toISOString(),
    projectTitle: i.project?.title ?? null,
  }));
}

export async function getInvoiceDetail(userId: string, invoiceId: string): Promise<InvoiceDetail | null> {
  const i = await prisma.invoice.findFirst({
    where: { id: invoiceId, clientId: userId },
    select: {
      id: true, number: true, items: true, amount: true, tax: true, total: true,
      status: true, dueDate: true, paidAt: true, createdAt: true,
      project: { select: { title: true } },
      client: { select: { name: true, email: true, phone: true, location: true } },
    },
  });
  if (!i) return null;
  return {
    id: i.id,
    number: i.number,
    items: (i.items as InvoiceLineItem[] | null) ?? [],
    amount: i.amount,
    tax: i.tax,
    total: i.total,
    status: i.status as InvoiceStatus,
    dueDate: i.dueDate?.toISOString() ?? null,
    paidAt: i.paidAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    projectTitle: i.project?.title ?? null,
    client: i.client,
  };
}

/* ────────────────────────────── Maintenance ────────────────────────────────── */

export async function getClientMaintenance(userId: string): Promise<MaintenanceItem[]> {
  const contracts = await prisma.maintenanceContract.findMany({
    where: { clientId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, plan: true, services: true, startDate: true, endDate: true,
      autoRenew: true, monthlyAmount: true,
      project: { select: { title: true, slug: true } },
    },
  });
  return contracts.map((c) => ({
    id: c.id,
    plan: c.plan as MaintenancePlan,
    services: c.services,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    autoRenew: c.autoRenew,
    monthlyAmount: c.monthlyAmount,
    projectTitle: c.project.title,
    projectSlug: c.project.slug,
  }));
}

/* ────────────────────────────── Support ────────────────────────────────────── */

export async function getClientTickets(userId: string): Promise<TicketItem[]> {
  const tickets = await prisma.ticket.findMany({
    where: { clientId: userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, priority: true, status: true, createdAt: true,
      project: { select: { title: true } },
      _count: { select: { messages: true } },
    },
  });
  return tickets.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority as TicketPriority,
    status: t.status as TicketStatus,
    createdAt: t.createdAt.toISOString(),
    messageCount: t._count.messages,
    projectTitle: t.project?.title ?? null,
  }));
}

export async function getTicketDetail(userId: string, ticketId: string): Promise<TicketDetail | null> {
  const t = await prisma.ticket.findFirst({
    where: { id: ticketId, clientId: userId },
    select: {
      id: true, title: true, description: true, priority: true, status: true, createdAt: true,
      clientId: true,
      project: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, content: true, createdAt: true, userId: true, user: { select: { name: true } } },
      },
    },
  });
  if (!t) return null;
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority as TicketPriority,
    status: t.status as TicketStatus,
    createdAt: t.createdAt.toISOString(),
    projectTitle: t.project?.title ?? null,
    messages: t.messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      author: { name: m.user.name, isTeam: m.userId !== t.clientId },
    })),
  };
}

/** Options de projet pour le formulaire de ticket (le client rattache un ticket à un projet). */
export async function getClientProjectOptions(userId: string): Promise<{ id: string; title: string }[]> {
  return prisma.project.findMany({
    where: { clientId: userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
}
