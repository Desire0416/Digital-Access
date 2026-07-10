import { prisma } from "@da/db/client";
import { staffScope, type AccessScope } from "./access";
import type { TaskRow, TaskContext, TaskCounts, TaskType, Priority, TaskStatus } from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Data layer Tâches & relances (LECTURE). Un commercial voit les tâches qui lui
   sont assignées OU qu'il a créées ; un admin voit tout. « En retard » est
   DÉRIVÉ (statut ouvert + échéance passée), pas stocké.
   ══════════════════════════════════════════════════════════════════════════ */

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const OPEN_STATUSES = ["TODO", "IN_PROGRESS", "OVERDUE"] as const;

function taskScopeWhere(scope: AccessScope) {
  if (scope.scopeAll) return {};
  return { OR: [{ assignedToId: scope.user.id }, { createdById: scope.user.id }] };
}

export interface CrmTaskFilters {
  view?: "today" | "overdue" | "week" | "open" | "all";
  status?: string;
  priority?: string;
  assignee?: string;
}

const taskSelect = {
  id: true, title: true, description: true, type: true, priority: true, status: true,
  dueDate: true, reminderAt: true, completedAt: true, createdAt: true,
  assignedTo: { select: { id: true, name: true } },
  createdBy: { select: { name: true } },
  prospect: { select: { id: true, organization: { select: { name: true } } } },
  deal: { select: { id: true, title: true } },
  lead: { select: { id: true, name: true, company: true } },
  project: { select: { id: true, title: true } },
  organization: { select: { id: true, name: true } },
} as const;

type TaskRecord = {
  id: string; title: string; description: string | null; type: string; priority: string; status: string;
  dueDate: Date | null; reminderAt: Date | null; completedAt: Date | null; createdAt: Date;
  assignedTo: { id: string; name: string } | null; createdBy: { name: string } | null;
  prospect: { id: string; organization: { name: string } } | null;
  deal: { id: string; title: string } | null;
  lead: { id: string; name: string; company: string | null } | null;
  project: { id: string; title: string } | null;
  organization: { id: string; name: string } | null;
};

function contextOf(t: TaskRecord): TaskContext {
  if (t.prospect) return { kind: "prospect", id: t.prospect.id, label: t.prospect.organization.name, href: `/admin/prospects/${t.prospect.id}` };
  if (t.lead) return { kind: "lead", id: t.lead.id, label: t.lead.company || t.lead.name, href: `/admin/leads/${t.lead.id}` };
  if (t.project) return { kind: "project", id: t.project.id, label: t.project.title, href: `/admin/projets/${t.project.id}` };
  if (t.deal) return { kind: "deal", id: t.deal.id, label: t.deal.title, href: null };
  if (t.organization) return { kind: "organization", id: t.organization.id, label: t.organization.name, href: null };
  return { kind: "none", id: null, label: null, href: null };
}

function mapTask(t: TaskRecord, startOfToday: Date): TaskRow {
  const open = OPEN_STATUSES.includes(t.status as never);
  const isOverdue = open && !!t.dueDate && t.dueDate < startOfToday;
  return {
    id: t.id, title: t.title, description: t.description, type: t.type as TaskType,
    priority: t.priority as Priority, status: t.status as TaskStatus,
    dueDate: iso(t.dueDate), reminderAt: iso(t.reminderAt), completedAt: iso(t.completedAt),
    assignedTo: t.assignedTo, createdByName: t.createdBy?.name ?? null,
    isOverdue, context: contextOf(t), createdAt: iso(t.createdAt)!,
  };
}

export async function getTasks(filters: CrmTaskFilters = {}): Promise<TaskRow[]> {
  const scope = await staffScope();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 3600 * 1000);

  const where: Record<string, unknown> = { ...taskScopeWhere(scope) };
  const view = filters.view ?? "open";

  if (view === "today") {
    where.status = { in: [...OPEN_STATUSES] };
    where.dueDate = { gte: startOfToday, lte: endOfToday };
  } else if (view === "overdue") {
    where.status = { in: [...OPEN_STATUSES] };
    where.dueDate = { lt: startOfToday };
  } else if (view === "week") {
    where.status = { in: [...OPEN_STATUSES] };
    where.dueDate = { gte: startOfToday, lte: endOfWeek };
  } else if (view === "open") {
    where.status = { in: [...OPEN_STATUSES] };
  }
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignee && scope.scopeAll) where.assignedToId = filters.assignee;

  const rows = (await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    select: taskSelect,
  })) as TaskRecord[];

  return rows.map((t) => mapTask(t, startOfToday));
}

export async function getTaskCounts(): Promise<TaskCounts> {
  const scope = await staffScope();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 3600 * 1000);
  const open = { status: { in: [...OPEN_STATUSES] }, ...taskScopeWhere(scope) };

  const [today, overdue, week, openCount] = await Promise.all([
    prisma.task.count({ where: { ...open, dueDate: { gte: startOfToday, lte: endOfToday } } }),
    prisma.task.count({ where: { ...open, dueDate: { lt: startOfToday } } }),
    prisma.task.count({ where: { ...open, dueDate: { gte: startOfToday, lte: endOfWeek } } }),
    prisma.task.count({ where: open }),
  ]);
  return { today, overdue, week, open: openCount };
}
