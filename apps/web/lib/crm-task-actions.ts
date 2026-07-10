"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { requireStaffMutation, isAdmin, can, type SessionUser } from "./access";
import { logAction } from "./crm-audit-log";
import { notifyMaybe } from "./crm-notifications";
import { STAFF_ROLES } from "./permissions";
import { TASK_TYPE_VALUES, PRIORITY_VALUES, TASK_STATUS_VALUES } from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions Tâches & relances. Un membre du staff crée/édite ses tâches ;
   ownership sur assignedToId/createdById (admin = tout). Notifie l'assigné.
   ══════════════════════════════════════════════════════════════════════════ */

export type Result<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsOf(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path[0];
    if (typeof k === "string" && !out[k]) out[k] = i.message;
  }
  return out;
}

function revalidateTasks(prospectId?: string | null) {
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/commercial");
  if (prospectId) revalidatePath(`/admin/prospects/${prospectId}`);
}

async function loadOwnedTask(me: SessionUser, id: string) {
  const t = await prisma.task.findUnique({
    where: { id },
    select: { id: true, assignedToId: true, createdById: true, prospectId: true, status: true },
  });
  if (!t) return null;
  if (isAdmin(me) || t.assignedToId === me.id || t.createdById === me.id) return t;
  return null;
}

async function isStaffUser(id: string): Promise<boolean> {
  const u = await prisma.user.findFirst({ where: { id, roles: { hasSome: STAFF_ROLES as never }, deletedAt: null }, select: { id: true } });
  return Boolean(u);
}

const baseTaskSchema = {
  title: z.string().trim().min(2, "Titre requis").max(200),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(TASK_TYPE_VALUES),
  priority: z.enum(PRIORITY_VALUES),
  dueDate: z.string().trim().optional(),
  reminderAt: z.string().trim().optional(),
  assignedToId: z.string().trim().min(1).optional(),
  prospectId: z.string().trim().min(1).optional(),
  dealId: z.string().trim().min(1).optional(),
  leadId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  organizationId: z.string().trim().min(1).optional(),
};

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function createTask(input: unknown): Promise<Result<{ taskId: string }>> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "task:create")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object(baseTaskSchema).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez renseigner la tâche.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;

  try {
    // Rattachement : dérive organizationId depuis le prospect si fourni.
    let organizationId = d.organizationId ?? null;
    if (d.prospectId) {
      const p = await prisma.prospect.findUnique({ where: { id: d.prospectId }, select: { organizationId: true } });
      if (p) organizationId = p.organizationId;
    }
    // Attribution : admin/gestionnaire peut cibler un autre staff ; sinon soi-même.
    let assignedToId = me.id;
    if (d.assignedToId && (isAdmin(me) || can(me, "prospect:assign"))) {
      if (await isStaffUser(d.assignedToId)) assignedToId = d.assignedToId;
    }

    const task = await prisma.task.create({
      data: {
        title: d.title, description: d.description || null, type: d.type as never, priority: d.priority as never,
        status: "TODO", dueDate: parseDate(d.dueDate), reminderAt: parseDate(d.reminderAt),
        assignedToId, createdById: me.id,
        prospectId: d.prospectId || null, dealId: d.dealId || null, leadId: d.leadId || null,
        projectId: d.projectId || null, organizationId,
      },
      select: { id: true },
    });
    await logAction({ actor: me, action: "task.create", entity: "Task", entityId: task.id });
    if (assignedToId !== me.id) {
      await notifyMaybe(assignedToId, { type: "TASK_ASSIGNED", title: "Nouvelle tâche", message: d.title, link: "/admin/tasks" });
    }
    revalidateTasks(d.prospectId);
    return { ok: true, taskId: task.id };
  } catch (e) {
    console.error("[crm] createTask:", e);
    return { ok: false, error: "Impossible de créer la tâche." };
  }
}

export async function updateTask(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "task:update")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({
    id: z.string().min(1),
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(TASK_TYPE_VALUES).optional(),
    priority: z.enum(PRIORITY_VALUES).optional(),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    dueDate: z.string().trim().optional(),
    reminderAt: z.string().trim().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const task = await loadOwnedTask(me, d.id);
  if (!task) return { ok: false, error: "Tâche introuvable." };
  try {
    await prisma.task.update({
      where: { id: d.id },
      data: {
        title: d.title ?? undefined,
        description: d.description ?? undefined,
        type: d.type === undefined ? undefined : (d.type as never),
        priority: d.priority === undefined ? undefined : (d.priority as never),
        status: d.status === undefined ? undefined : (d.status as never),
        completedAt: d.status === "COMPLETED" ? new Date() : d.status ? null : undefined,
        dueDate: d.dueDate === undefined ? undefined : parseDate(d.dueDate),
        reminderAt: d.reminderAt === undefined ? undefined : parseDate(d.reminderAt),
      },
    });
    await logAction({ actor: me, action: "task.update", entity: "Task", entityId: d.id });
    revalidateTasks(task.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateTask:", e);
    return { ok: false, error: "Impossible de mettre à jour la tâche." };
  }
}

export async function completeTask(input: { id?: unknown; done?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1), done: z.coerce.boolean().optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const task = await loadOwnedTask(me, parsed.data.id);
  if (!task) return { ok: false, error: "Tâche introuvable." };
  const done = parsed.data.done ?? true;
  try {
    await prisma.task.update({
      where: { id: parsed.data.id },
      data: done ? { status: "COMPLETED", completedAt: new Date() } : { status: "TODO", completedAt: null },
    });
    await logAction({ actor: me, action: done ? "task.complete" : "task.reopen", entity: "Task", entityId: parsed.data.id });
    revalidateTasks(task.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] completeTask:", e);
    return { ok: false, error: "Impossible de mettre à jour la tâche." };
  }
}

export async function deleteTask(input: { id?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const task = await loadOwnedTask(me, parsed.data.id);
  if (!task) return { ok: false, error: "Tâche introuvable." };
  try {
    await prisma.task.delete({ where: { id: parsed.data.id } });
    await logAction({ actor: me, action: "task.delete", entity: "Task", entityId: parsed.data.id });
    revalidateTasks(task.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] deleteTask:", e);
    return { ok: false, error: "Impossible de supprimer la tâche." };
  }
}
