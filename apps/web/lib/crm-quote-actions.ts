"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { requireStaffMutation, isAdmin, can, type SessionUser } from "./access";
import { logAction } from "./crm-audit-log";
import { notifyRoles } from "./crm-notifications";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions Devis (Quote). Rattachés à une opportunité. Montants recalculés
   côté serveur. Accès : admin, ou responsable de l'opportunité liée.
   ══════════════════════════════════════════════════════════════════════════ */

export type Result<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const lineItemSchema = z.object({
  label: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().nonnegative().max(100000),
  unitPrice: z.coerce.number().int().nonnegative().max(1_000_000_000),
});

type DealAccess = { id: string; assignedToId: string | null; organizationId: string; primaryContactId: string | null; prospectId: string | null };

async function loadDealForQuote(me: SessionUser, dealId: string): Promise<DealAccess | null> {
  const d = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, assignedToId: true, organizationId: true, primaryContactId: true, prospectId: true },
  });
  if (!d) return null;
  if (isAdmin(me) || d.assignedToId === me.id) return d;
  return null;
}

async function loadQuoteDeal(me: SessionUser, quoteId: string) {
  const q = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true, dealId: true, deal: { select: { id: true, assignedToId: true, prospectId: true } } },
  });
  if (!q) return null;
  if (!isAdmin(me) && q.deal?.assignedToId !== me.id) return null;
  return q;
}

function computeTotals(items: z.infer<typeof lineItemSchema>[], taxRate: number) {
  const amount = items.reduce((s, it) => s + Math.round(it.quantity * it.unitPrice), 0);
  const tax = Math.round((amount * taxRate) / 100);
  return { amount, tax, total: amount + tax };
}

async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DEVIS-${year}-`;
  const count = await prisma.quote.count({ where: { number: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function revalidateQuote(id: string, dealId: string | null | undefined) {
  revalidatePath(`/admin/devis/${id}`);
  if (dealId) revalidatePath(`/admin/opportunites/${dealId}`);
}

/* ─── Création / mise à jour ────────────────────────────────────────────────── */

const quoteSchema = z.object({
  dealId: z.string().min(1),
  title: z.string().trim().min(2, "Titre requis").max(160),
  items: z.array(lineItemSchema).min(1, "Au moins une ligne").max(60),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().trim().max(3000).optional(),
  expiresAt: z.string().trim().optional(),
});

export async function createQuote(input: unknown): Promise<Result<{ quoteId: string }>> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "quote:prepare")) return { ok: false, error: "Permission insuffisante." };
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez le devis (titre et lignes).", fieldErrors: { items: parsed.error.issues[0]?.message ?? "Invalide" } };
  const d = parsed.data;
  const deal = await loadDealForQuote(me, d.dealId);
  if (!deal) return { ok: false, error: "Opportunité introuvable." };

  const { amount, tax, total } = computeTotals(d.items, d.taxRate ?? 0);
  try {
    const quote = await prisma.quote.create({
      data: {
        organizationId: deal.organizationId, dealId: deal.id, contactId: deal.primaryContactId,
        number: await nextQuoteNumber(), title: d.title, items: d.items as never,
        amount, tax, total, status: "DRAFT", notes: d.notes || null, createdById: me.id,
        expiresAt: parseDate(d.expiresAt),
      },
      select: { id: true },
    });
    await logAction({ actor: me, action: "quote.create", entity: "Quote", entityId: quote.id, metadata: { dealId: deal.id } });
    revalidateQuote(quote.id, deal.id);
    return { ok: true, quoteId: quote.id };
  } catch (e) {
    console.error("[crm] createQuote:", e);
    return { ok: false, error: "Impossible de créer le devis." };
  }
}

export async function updateQuote(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "quote:prepare")) return { ok: false, error: "Permission insuffisante." };
  const parsed = quoteSchema.extend({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez le devis.", fieldErrors: { items: parsed.error.issues[0]?.message ?? "Invalide" } };
  const d = parsed.data;
  const q = await loadQuoteDeal(me, d.id);
  if (!q) return { ok: false, error: "Devis introuvable." };
  if (q.status !== "DRAFT") return { ok: false, error: "Un devis envoyé ne peut plus être modifié." };
  const { amount, tax, total } = computeTotals(d.items, d.taxRate ?? 0);
  try {
    await prisma.quote.update({
      where: { id: d.id },
      data: { title: d.title, items: d.items as never, amount, tax, total, notes: d.notes || null, expiresAt: parseDate(d.expiresAt) },
    });
    await logAction({ actor: me, action: "quote.update", entity: "Quote", entityId: d.id });
    revalidateQuote(d.id, q.dealId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateQuote:", e);
    return { ok: false, error: "Impossible de mettre à jour le devis." };
  }
}

/* ─── Envoi / statut / suppression ──────────────────────────────────────────── */

export async function sendQuote(input: { id?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "quote:send") && !can(me, "quote:prepare")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const q = await loadQuoteDeal(me, parsed.data.id);
  if (!q) return { ok: false, error: "Devis introuvable." };
  if (q.status !== "DRAFT") return { ok: false, error: "Ce devis a déjà été envoyé." };
  try {
    const full = await prisma.quote.findUnique({ where: { id: parsed.data.id }, select: { organizationId: true, number: true } });
    await prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id: parsed.data.id }, data: { status: "SENT", sentAt: new Date() } });
      if (q.dealId) {
        await tx.deal.update({ where: { id: q.dealId }, data: { stage: "QUOTE_SENT" } });
        await tx.activity.create({
          data: { organizationId: full!.organizationId, dealId: q.dealId, type: "QUOTE_SENT", subject: `Devis ${full!.number} envoyé`, createdById: me.id, visibility: "INTERNAL" },
        });
      }
    });
    await logAction({ actor: me, action: "quote.send", entity: "Quote", entityId: parsed.data.id });
    await notifyRoles(["ADMIN", "SUPER_ADMIN"], { type: "QUOTE_SENT", title: "Devis envoyé", message: `Le devis ${full!.number} a été envoyé.`, link: q.dealId ? `/admin/opportunites/${q.dealId}` : "/admin/opportunites" });
    revalidateQuote(parsed.data.id, q.dealId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] sendQuote:", e);
    return { ok: false, error: "Impossible d'envoyer le devis." };
  }
}

export async function setQuoteStatus(input: { id?: unknown; status?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "quote:prepare")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({ id: z.string().min(1), status: z.enum(["ACCEPTED", "REJECTED", "EXPIRED"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  const q = await loadQuoteDeal(me, parsed.data.id);
  if (!q) return { ok: false, error: "Devis introuvable." };
  const { status } = parsed.data;
  try {
    await prisma.quote.update({
      where: { id: parsed.data.id },
      data: {
        status,
        acceptedAt: status === "ACCEPTED" ? new Date() : null,
        rejectedAt: status === "REJECTED" ? new Date() : null,
      },
    });
    // Un devis accepté fait avancer l'opportunité vers l'accord verbal.
    if (status === "ACCEPTED" && q.dealId) {
      await prisma.deal.updateMany({ where: { id: q.dealId, stage: { notIn: ["WON", "LOST"] } }, data: { stage: "VERBAL_AGREEMENT" } });
    }
    await logAction({ actor: me, action: "quote.status", entity: "Quote", entityId: parsed.data.id, newValue: { status } });
    revalidateQuote(parsed.data.id, q.dealId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] setQuoteStatus:", e);
    return { ok: false, error: "Impossible de mettre à jour le devis." };
  }
}

export async function deleteQuote(input: { id?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "quote:prepare")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const q = await loadQuoteDeal(me, parsed.data.id);
  if (!q) return { ok: false, error: "Devis introuvable." };
  try {
    await prisma.quote.delete({ where: { id: parsed.data.id } });
    await logAction({ actor: me, action: "quote.delete", entity: "Quote", entityId: parsed.data.id });
    revalidateQuote(parsed.data.id, q.dealId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] deleteQuote:", e);
    return { ok: false, error: "Impossible de supprimer le devis." };
  }
}
