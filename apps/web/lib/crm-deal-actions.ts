"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { requirePermissionMutation, requireStaffMutation, isAdmin, can, type SessionUser } from "./access";
import { logAction } from "./crm-audit-log";
import { notifyRoles, notifyMaybe } from "./crm-notifications";
import { STAFF_ROLES } from "./permissions";
import { DEAL_STAGE_VALUES, ACTIVITY_TYPE_VALUES, DEAL_STAGE_LABEL } from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions Opportunités (Deal). Pipeline TO_QUALIFY → … → WON/LOST.
   Sécurité au niveau ligne (assigné ou admin). Chaque changement d'étape crée
   une activité STATUS_CHANGE ; un motif est requis en cas de perte.
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

type DealRow = { id: string; assignedToId: string | null; stage: string; organizationId: string; prospectId: string | null };

async function loadOwnedDeal(me: SessionUser, id: string): Promise<DealRow | null> {
  const d = await prisma.deal.findUnique({
    where: { id },
    select: { id: true, assignedToId: true, stage: true, organizationId: true, prospectId: true },
  });
  if (!d) return null;
  if (isAdmin(me) || d.assignedToId === me.id) return d;
  return null;
}

async function isStaffUser(id: string): Promise<boolean> {
  const u = await prisma.user.findFirst({ where: { id, roles: { hasSome: STAFF_ROLES as never }, deletedAt: null }, select: { id: true } });
  return Boolean(u);
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function revalidateDeal(id?: string, prospectId?: string | null) {
  revalidatePath("/admin/opportunites");
  revalidatePath("/admin/commercial");
  if (id) revalidatePath(`/admin/opportunites/${id}`);
  if (prospectId) revalidatePath(`/admin/prospects/${prospectId}`);
}

/* ─── Création ──────────────────────────────────────────────────────────────── */

export async function createDeal(input: unknown): Promise<Result<{ dealId: string }>> {
  let me: SessionUser;
  try { me = await requirePermissionMutation("deal:create"); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({
    prospectId: z.string().trim().min(1).optional(),
    organizationId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(3, "Titre trop court").max(160),
    estimatedAmount: z.coerce.number().int().nonnegative().optional(),
    recommendedOffer: z.string().trim().max(200).optional(),
    identifiedNeed: z.string().trim().max(1000).optional(),
    primaryContactId: z.string().trim().min(1).optional(),
    assignedToId: z.string().trim().min(1).optional(),
    expectedCloseDate: z.string().trim().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez indiquer un titre.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;

  try {
    let organizationId = d.organizationId ?? null;
    let prospectId = d.prospectId ?? null;
    if (prospectId) {
      const p = await prisma.prospect.findUnique({ where: { id: prospectId }, select: { id: true, organizationId: true, assignedToId: true } });
      if (!p) return { ok: false, error: "Prospect introuvable." };
      if (!isAdmin(me) && p.assignedToId !== me.id) return { ok: false, error: "Ce prospect ne vous est pas attribué." };
      organizationId = p.organizationId;
    } else if (organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
      if (!org) return { ok: false, error: "Organisation introuvable." };
    } else {
      return { ok: false, error: "Un prospect ou une organisation est requis." };
    }

    const canAssign = can(me, "prospect:assign") || isAdmin(me);
    const assignedToId = canAssign && d.assignedToId ? d.assignedToId : me.id;

    const deal = await prisma.$transaction(async (tx) => {
      const created = await tx.deal.create({
        data: {
          organizationId: organizationId!, prospectId, title: d.title, stage: "TO_QUALIFY",
          estimatedAmount: d.estimatedAmount ?? null, recommendedOffer: d.recommendedOffer || null,
          identifiedNeed: d.identifiedNeed || null, primaryContactId: d.primaryContactId || null,
          assignedToId, expectedCloseDate: parseDate(d.expectedCloseDate),
        },
        select: { id: true },
      });
      // Le prospect devient « converti » et l'organisation passe en OPPORTUNITY.
      if (prospectId) {
        await tx.prospect.updateMany({ where: { id: prospectId, status: { not: "CONVERTED_TO_OPPORTUNITY" } }, data: { status: "CONVERTED_TO_OPPORTUNITY", lastActivityAt: new Date() } });
        await tx.organization.update({ where: { id: organizationId! }, data: { lifecycleStage: "OPPORTUNITY" } });
      }
      return created;
    });

    await logAction({ actor: me, action: "deal.create", entity: "Deal", entityId: deal.id, metadata: { prospectId } });
    if (assignedToId !== me.id) {
      await notifyMaybe(assignedToId, { type: "DEAL_ASSIGNED", title: "Nouvelle opportunité", message: d.title, link: `/admin/opportunites/${deal.id}` });
    }
    revalidateDeal(deal.id, prospectId);
    return { ok: true, dealId: deal.id };
  } catch (e) {
    console.error("[crm] createDeal:", e);
    return { ok: false, error: "Impossible de créer l'opportunité." };
  }
}

/* ─── Mise à jour ───────────────────────────────────────────────────────────── */

export async function updateDeal(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "deal:update_assigned") && !can(me, "deal:update_all")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({
    id: z.string().min(1),
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().max(4000).optional(),
    estimatedAmount: z.coerce.number().int().nonnegative().nullable().optional(),
    probability: z.coerce.number().int().min(0).max(100).nullable().optional(),
    expectedCloseDate: z.string().trim().optional(),
    recommendedOffer: z.string().trim().max(200).optional(),
    identifiedNeed: z.string().trim().max(2000).optional(),
    competitors: z.string().trim().max(500).optional(),
    primaryContactId: z.string().trim().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const deal = await loadOwnedDeal(me, d.id);
  if (!deal) return { ok: false, error: "Opportunité introuvable." };

  try {
    await prisma.deal.update({
      where: { id: d.id },
      data: {
        title: d.title ?? undefined,
        description: d.description ?? undefined,
        estimatedAmount: d.estimatedAmount === undefined ? undefined : d.estimatedAmount,
        probability: d.probability === undefined ? undefined : d.probability,
        expectedCloseDate: d.expectedCloseDate === undefined ? undefined : parseDate(d.expectedCloseDate),
        recommendedOffer: d.recommendedOffer ?? undefined,
        identifiedNeed: d.identifiedNeed ?? undefined,
        competitors: d.competitors === undefined ? undefined : d.competitors.split(",").map((s) => s.trim()).filter(Boolean),
        primaryContactId: d.primaryContactId === undefined ? undefined : (d.primaryContactId || null),
      },
    });
    await logAction({ actor: me, action: "deal.update", entity: "Deal", entityId: d.id });
    revalidateDeal(d.id, deal.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateDeal:", e);
    return { ok: false, error: "Impossible de mettre à jour l'opportunité." };
  }
}

/* ─── Changement d'étape (kanban) ───────────────────────────────────────────── */

export async function updateDealStage(input: { id?: unknown; stage?: unknown; lossReason?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "deal:update_assigned") && !can(me, "deal:update_all")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({ id: z.string().min(1), stage: z.enum(DEAL_STAGE_VALUES), lossReason: z.string().trim().max(500).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Étape invalide." };
  const { id, stage, lossReason } = parsed.data;
  const deal = await loadOwnedDeal(me, id);
  if (!deal) return { ok: false, error: "Opportunité introuvable." };
  if (deal.stage === stage) return { ok: true };
  if (stage === "LOST" && !lossReason) return { ok: false, error: "Un motif de perte est requis.", fieldErrors: { lossReason: "Motif requis." } };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.deal.update({
        where: { id },
        data: {
          stage,
          wonAt: stage === "WON" ? new Date() : deal.stage === "WON" ? null : undefined,
          lostAt: stage === "LOST" ? new Date() : deal.stage === "LOST" ? null : undefined,
          lossReason: stage === "LOST" ? (lossReason ?? null) : undefined,
        },
      });
      await tx.activity.create({
        data: {
          organizationId: deal.organizationId, dealId: id, type: "STATUS_CHANGE",
          subject: `Étape : ${DEAL_STAGE_LABEL[stage]}`, notes: stage === "LOST" ? lossReason ?? null : null,
          createdById: me.id, visibility: "INTERNAL",
        },
      });
    });
    await logAction({ actor: me, action: "deal.stage", entity: "Deal", entityId: id, oldValue: { stage: deal.stage }, newValue: { stage } });
    if (stage === "WON" || stage === "LOST") {
      await notifyRoles(["ADMIN", "SUPER_ADMIN"], {
        type: stage === "WON" ? "DEAL_WON" : "DEAL_LOST",
        title: stage === "WON" ? "Opportunité gagnée" : "Opportunité perdue",
        message: `Une opportunité est passée en « ${DEAL_STAGE_LABEL[stage]} ».`,
        link: `/admin/opportunites/${id}`,
      });
    }
    revalidateDeal(id, deal.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateDealStage:", e);
    return { ok: false, error: "Impossible de changer l'étape." };
  }
}

/* ─── Attribution / archivage / activité ────────────────────────────────────── */

export async function assignDeal(input: { id?: unknown; assigneeId?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "prospect:assign")) return { ok: false, error: "Seule l'administration peut réattribuer une opportunité." };
  const parsed = z.object({ id: z.string().min(1), assigneeId: z.string().min(1).nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const deal = await prisma.deal.findUnique({ where: { id: parsed.data.id }, select: { id: true, prospectId: true } });
  if (!deal) return { ok: false, error: "Opportunité introuvable." };
  if (parsed.data.assigneeId && !(await isStaffUser(parsed.data.assigneeId))) return { ok: false, error: "Responsable invalide." };
  try {
    await prisma.deal.update({ where: { id: parsed.data.id }, data: { assignedToId: parsed.data.assigneeId } });
    await logAction({ actor: me, action: "deal.assign", entity: "Deal", entityId: parsed.data.id, newValue: { assignedToId: parsed.data.assigneeId } });
    await notifyMaybe(parsed.data.assigneeId, { type: "DEAL_ASSIGNED", title: "Opportunité attribuée", message: "Une opportunité vous a été attribuée.", link: `/admin/opportunites/${parsed.data.id}` });
    revalidateDeal(parsed.data.id, deal.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] assignDeal:", e);
    return { ok: false, error: "Impossible de réattribuer l'opportunité." };
  }
}

export async function archiveDeal(input: { id?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const deal = await loadOwnedDeal(me, parsed.data.id);
  if (!deal) return { ok: false, error: "Opportunité introuvable." };
  try {
    await prisma.deal.update({ where: { id: parsed.data.id }, data: { archivedAt: new Date() } });
    await logAction({ actor: me, action: "deal.archive", entity: "Deal", entityId: parsed.data.id });
    revalidateDeal(parsed.data.id, deal.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] archiveDeal:", e);
    return { ok: false, error: "Impossible d'archiver l'opportunité." };
  }
}

export async function logDealActivity(input: { dealId?: unknown; type?: unknown; subject?: unknown; notes?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "activity:create")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({
    dealId: z.string().min(1), type: z.enum(ACTIVITY_TYPE_VALUES),
    subject: z.string().trim().max(200).optional(), notes: z.string().trim().max(3000).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez renseigner l'activité.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const deal = await loadOwnedDeal(me, d.dealId);
  if (!deal) return { ok: false, error: "Opportunité introuvable." };
  try {
    await prisma.activity.create({
      data: {
        organizationId: deal.organizationId, dealId: d.dealId, type: d.type as never,
        subject: d.subject || null, notes: d.notes || null, createdById: me.id, visibility: "INTERNAL",
      },
    });
    await logAction({ actor: me, action: "activity.create", entity: "Activity", entityId: d.dealId, metadata: { type: d.type, on: "deal" } });
    revalidateDeal(d.dealId, deal.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] logDealActivity:", e);
    return { ok: false, error: "Impossible d'enregistrer l'activité." };
  }
}
