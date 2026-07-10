"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { requirePermissionMutation, requireStaffMutation, isAdmin, can, type SessionUser } from "./access";
import { logAction } from "./crm-audit-log";
import { notifyRoles, notifyMaybe } from "./crm-notifications";
import {
  AUDIT_EDITABLE_STATUSES, AUDIT_CATEGORY_VALUES, AUDIT_SEVERITY_VALUES,
  DOC_TYPE_VALUES, DOC_VISIBILITY_VALUES, DIGITAL_IMPORTANCE_STATEMENT,
} from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions Audits. Workflow : DRAFT → IN_PROGRESS → TO_VALIDATE
   (soumission) → VALIDATED (admin) / IN_PROGRESS+motif (refus) → SENT (envoi).
   Sécurité au niveau ligne (auteur ou prospect attribué, sinon admin), édition
   verrouillée hors des statuts éditables, journalisation + notifications.
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

type AuditRow = { id: string; authorId: string | null; status: string; organizationId: string; prospectId: string | null };

/** Charge un audit si l'utilisateur y a accès (auteur, prospect attribué, ou admin). */
async function loadAccessibleAudit(me: SessionUser, id: string): Promise<AuditRow | null> {
  const a = await prisma.audit.findUnique({
    where: { id },
    select: { id: true, authorId: true, status: true, organizationId: true, prospectId: true },
  });
  if (!a) return null;
  if (isAdmin(me)) return a;
  if (a.authorId === me.id) return a;
  if (a.prospectId) {
    const p = await prisma.prospect.findFirst({ where: { id: a.prospectId, assignedToId: me.id }, select: { id: true } });
    if (p) return a;
  }
  return null;
}

function isEditable(status: string): boolean {
  return AUDIT_EDITABLE_STATUSES.includes(status as never);
}

function revalidateAudit(id?: string, prospectId?: string | null) {
  revalidatePath("/admin/audits");
  revalidatePath("/admin/commercial");
  if (id) revalidatePath(`/admin/audits/${id}`);
  if (prospectId) revalidatePath(`/admin/prospects/${prospectId}`);
}

async function nextAuditReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AUD-${year}-`;
  const count = await prisma.audit.count({ where: { reference: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

/* ─── Création ──────────────────────────────────────────────────────────────── */

export async function createAudit(input: { prospectId?: unknown; organizationId?: unknown; title?: unknown }): Promise<Result<{ auditId: string }>> {
  let me: SessionUser;
  try { me = await requirePermissionMutation("audit:create"); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({
    prospectId: z.string().trim().min(1).optional(),
    organizationId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(3, "Titre trop court").max(160),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez indiquer un titre d'audit.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;

  try {
    let organizationId = d.organizationId ?? null;
    let prospectId = d.prospectId ?? null;

    if (prospectId) {
      const prospect = await prisma.prospect.findUnique({ where: { id: prospectId }, select: { id: true, organizationId: true, assignedToId: true, status: true } });
      if (!prospect) return { ok: false, error: "Prospect introuvable." };
      if (!isAdmin(me) && prospect.assignedToId !== me.id) return { ok: false, error: "Ce prospect ne vous est pas attribué." };
      organizationId = prospect.organizationId;
    } else if (organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
      if (!org) return { ok: false, error: "Organisation introuvable." };
    } else {
      return { ok: false, error: "Un prospect ou une organisation est requis." };
    }

    const audit = await prisma.audit.create({
      data: {
        organizationId: organizationId!, prospectId,
        reference: await nextAuditReference(), title: d.title, status: "DRAFT",
        authorId: me.id, digitalImportanceStatement: DIGITAL_IMPORTANCE_STATEMENT, auditDate: new Date(),
      },
      select: { id: true },
    });

    // Le prospect passe en « audit en cours » s'il était à analyser.
    if (prospectId) {
      await prisma.prospect.updateMany({ where: { id: prospectId, status: "TO_ANALYZE" }, data: { status: "AUDIT_IN_PROGRESS" } });
    }
    await logAction({ actor: me, action: "audit.create", entity: "Audit", entityId: audit.id, metadata: { organizationId, prospectId } });
    revalidateAudit(audit.id, prospectId);
    return { ok: true, auditId: audit.id };
  } catch (e) {
    console.error("[crm] createAudit:", e);
    return { ok: false, error: "Impossible de créer l'audit." };
  }
}

/* ─── Mise à jour du contenu ────────────────────────────────────────────────── */

export async function updateAudit(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "audit:update_draft")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({
    id: z.string().min(1),
    title: z.string().trim().min(3).max(160).optional(),
    auditType: z.string().trim().max(80).optional(),
    summary: z.string().trim().max(5000).optional(),
    methodology: z.string().trim().max(5000).optional(),
    digitalImportanceStatement: z.string().trim().max(4000).optional(),
    overallSeverity: z.enum(AUDIT_SEVERITY_VALUES).nullable().optional(),
    auditDate: z.string().trim().optional(),
    internalNotes: z.string().trim().max(5000).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const audit = await loadAccessibleAudit(me, d.id);
  if (!audit) return { ok: false, error: "Audit introuvable." };
  if (!isEditable(audit.status)) return { ok: false, error: "Cet audit est verrouillé (soumis ou validé)." };

  const date = d.auditDate ? new Date(d.auditDate) : null;
  try {
    await prisma.audit.update({
      where: { id: d.id },
      data: {
        title: d.title ?? undefined,
        auditType: d.auditType ?? undefined,
        summary: d.summary ?? undefined,
        methodology: d.methodology ?? undefined,
        digitalImportanceStatement: d.digitalImportanceStatement ?? undefined,
        overallSeverity: d.overallSeverity === undefined ? undefined : (d.overallSeverity as never),
        auditDate: d.auditDate === undefined ? undefined : (date && !isNaN(date.getTime()) ? date : null),
        internalNotes: d.internalNotes ?? undefined,
        // Toute édition en DRAFT fait passer en IN_PROGRESS.
        status: audit.status === "DRAFT" ? "IN_PROGRESS" : undefined,
      },
    });
    await logAction({ actor: me, action: "audit.update", entity: "Audit", entityId: d.id });
    revalidateAudit(d.id, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateAudit:", e);
    return { ok: false, error: "Impossible de mettre à jour l'audit." };
  }
}

/* ─── Constats (findings) ───────────────────────────────────────────────────── */

const findingSchema = z.object({
  auditId: z.string().min(1),
  title: z.string().trim().min(2, "Titre requis").max(200),
  category: z.enum(AUDIT_CATEGORY_VALUES),
  severity: z.enum(AUDIT_SEVERITY_VALUES),
  description: z.string().trim().max(4000).optional(),
  businessImpact: z.string().trim().max(1000).optional(),
  userImpact: z.string().trim().max(1000).optional(),
  securityImpact: z.string().trim().max(1000).optional(),
  evidenceText: z.string().trim().max(2000).optional(),
  evidenceUrl: z.string().trim().max(500).optional(),
  affectedPageUrl: z.string().trim().max(500).optional(),
  recommendation: z.string().trim().max(4000).optional(),
  isPublic: z.coerce.boolean().optional(),
});

async function assertEditableAudit(me: SessionUser, auditId: string): Promise<AuditRow | { error: string }> {
  if (!can(me, "audit:update_draft")) return { error: "Permission insuffisante." };
  const audit = await loadAccessibleAudit(me, auditId);
  if (!audit) return { error: "Audit introuvable." };
  if (!isEditable(audit.status)) return { error: "Cet audit est verrouillé." };
  return audit;
}

export async function addFinding(input: unknown): Promise<Result<{ findingId: string }>> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = findingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez renseigner le constat.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const audit = await assertEditableAudit(me, d.auditId);
  if ("error" in audit) return { ok: false, error: audit.error };
  try {
    const last = await prisma.auditFinding.findFirst({ where: { auditId: d.auditId }, orderBy: { priorityOrder: "desc" }, select: { priorityOrder: true } });
    const finding = await prisma.auditFinding.create({
      data: {
        auditId: d.auditId, title: d.title, category: d.category as never, severity: d.severity as never,
        description: d.description || null, businessImpact: d.businessImpact || null, userImpact: d.userImpact || null,
        securityImpact: d.securityImpact || null, evidenceText: d.evidenceText || null, evidenceUrl: d.evidenceUrl || null,
        affectedPageUrl: d.affectedPageUrl || null, recommendation: d.recommendation || null,
        isPublic: d.isPublic ?? true, priorityOrder: (last?.priorityOrder ?? -1) + 1,
      },
      select: { id: true },
    });
    await logAction({ actor: me, action: "audit.finding.add", entity: "AuditFinding", entityId: finding.id, metadata: { auditId: d.auditId } });
    revalidateAudit(d.auditId, audit.prospectId);
    return { ok: true, findingId: finding.id };
  } catch (e) {
    console.error("[crm] addFinding:", e);
    return { ok: false, error: "Impossible d'ajouter le constat." };
  }
}

export async function updateFinding(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = findingSchema.extend({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const audit = await assertEditableAudit(me, d.auditId);
  if ("error" in audit) return { ok: false, error: audit.error };
  const existing = await prisma.auditFinding.findFirst({ where: { id: d.id, auditId: d.auditId }, select: { id: true } });
  if (!existing) return { ok: false, error: "Constat introuvable." };
  try {
    await prisma.auditFinding.update({
      where: { id: d.id },
      data: {
        title: d.title, category: d.category as never, severity: d.severity as never,
        description: d.description || null, businessImpact: d.businessImpact || null, userImpact: d.userImpact || null,
        securityImpact: d.securityImpact || null, evidenceText: d.evidenceText || null, evidenceUrl: d.evidenceUrl || null,
        affectedPageUrl: d.affectedPageUrl || null, recommendation: d.recommendation || null, isPublic: d.isPublic ?? true,
      },
    });
    await logAction({ actor: me, action: "audit.finding.update", entity: "AuditFinding", entityId: d.id });
    revalidateAudit(d.auditId, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateFinding:", e);
    return { ok: false, error: "Impossible de mettre à jour le constat." };
  }
}

export async function deleteFinding(input: { id?: unknown; auditId?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1), auditId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const audit = await assertEditableAudit(me, parsed.data.auditId);
  if ("error" in audit) return { ok: false, error: audit.error };
  try {
    await prisma.auditFinding.deleteMany({ where: { id: parsed.data.id, auditId: parsed.data.auditId } });
    await logAction({ actor: me, action: "audit.finding.delete", entity: "AuditFinding", entityId: parsed.data.id });
    revalidateAudit(parsed.data.auditId, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] deleteFinding:", e);
    return { ok: false, error: "Impossible de supprimer le constat." };
  }
}

export async function reorderFindings(input: { auditId?: unknown; orderedIds?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ auditId: z.string().min(1), orderedIds: z.array(z.string().min(1)).max(200) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const audit = await assertEditableAudit(me, parsed.data.auditId);
  if ("error" in audit) return { ok: false, error: audit.error };
  try {
    await prisma.$transaction(
      parsed.data.orderedIds.map((id, i) =>
        prisma.auditFinding.updateMany({ where: { id, auditId: parsed.data.auditId }, data: { priorityOrder: i } }),
      ),
    );
    revalidateAudit(parsed.data.auditId, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] reorderFindings:", e);
    return { ok: false, error: "Impossible de réordonner les constats." };
  }
}

/* ─── Soumission / validation / envoi ───────────────────────────────────────── */

export async function submitAudit(input: { id?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "audit:submit")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const audit = await loadAccessibleAudit(me, parsed.data.id);
  if (!audit) return { ok: false, error: "Audit introuvable." };
  if (!isEditable(audit.status)) return { ok: false, error: "Cet audit ne peut pas être soumis dans son état actuel." };

  const full = await prisma.audit.findUnique({ where: { id: parsed.data.id }, select: { title: true, summary: true, reference: true, _count: { select: { findings: true } } } });
  if (!full?.summary || full._count.findings === 0) {
    return { ok: false, error: "Ajoutez un résumé et au moins un constat avant de soumettre." };
  }
  try {
    await prisma.audit.update({ where: { id: parsed.data.id }, data: { status: "TO_VALIDATE" } });
    await logAction({ actor: me, action: "audit.submit", entity: "Audit", entityId: parsed.data.id });
    await notifyRoles(["ADMIN", "SUPER_ADMIN"], {
      type: "AUDIT_SUBMITTED", title: "Audit à valider",
      message: `L'audit ${full.reference} est soumis à validation.`, link: `/admin/audits/${parsed.data.id}`,
    });
    revalidateAudit(parsed.data.id, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] submitAudit:", e);
    return { ok: false, error: "Impossible de soumettre l'audit." };
  }
}

export async function reviewAudit(input: { id?: unknown; decision?: unknown; note?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "audit:validate")) return { ok: false, error: "Seule l'administration peut valider un audit." };
  const parsed = z.object({
    id: z.string().min(1),
    decision: z.enum(["validate", "reject"]),
    note: z.string().trim().max(2000).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const { id, decision, note } = parsed.data;
  if (decision === "reject" && !note) return { ok: false, error: "Un motif est requis pour refuser l'audit.", fieldErrors: { note: "Motif requis." } };

  const audit = await prisma.audit.findUnique({ where: { id }, select: { id: true, status: true, authorId: true, reference: true, prospectId: true } });
  if (!audit) return { ok: false, error: "Audit introuvable." };
  if (audit.status !== "TO_VALIDATE" && audit.status !== "INTERNAL_REVIEW") return { ok: false, error: "Cet audit n'est pas en attente de validation." };

  try {
    if (decision === "validate") {
      await prisma.$transaction(async (tx) => {
        await tx.audit.update({ where: { id }, data: { status: "VALIDATED", validatedById: me.id, validatedAt: new Date(), reviewNote: null } });
        // Le prospect devient « prêt à contacter ».
        if (audit.prospectId) {
          await tx.prospect.updateMany({
            where: { id: audit.prospectId, status: { in: ["AUDIT_IN_PROGRESS", "AUDIT_COMPLETED", "TO_ANALYZE"] } },
            data: { status: "READY_TO_CONTACT" },
          });
        }
      });
      await logAction({ actor: me, action: "audit.validate", entity: "Audit", entityId: id });
      await notifyMaybe(audit.authorId, { type: "AUDIT_VALIDATED", title: "Audit validé", message: `Votre audit ${audit.reference} a été validé.`, link: `/admin/audits/${id}` });
    } else {
      await prisma.audit.update({ where: { id }, data: { status: "IN_PROGRESS", reviewNote: note } });
      await logAction({ actor: me, action: "audit.reject", entity: "Audit", entityId: id, metadata: { note } });
      await notifyMaybe(audit.authorId, { type: "AUDIT_REJECTED", title: "Audit à revoir", message: `Votre audit ${audit.reference} nécessite des corrections.`, link: `/admin/audits/${id}` });
    }
    revalidateAudit(id, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] reviewAudit:", e);
    return { ok: false, error: "Impossible de traiter la validation." };
  }
}

export async function sendAudit(input: { id?: unknown; recipientContactId?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "audit:send")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({ id: z.string().min(1), recipientContactId: z.string().min(1).nullable().optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const audit = await loadAccessibleAudit(me, parsed.data.id);
  if (!audit) return { ok: false, error: "Audit introuvable." };
  if (audit.status !== "VALIDATED" && audit.status !== "READY_TO_SEND") return { ok: false, error: "L'audit doit être validé avant d'être envoyé." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.audit.update({
        where: { id: parsed.data.id },
        data: { status: "SENT", sentById: me.id, sentAt: new Date(), recipientContactId: parsed.data.recipientContactId ?? null },
      });
      await tx.activity.create({
        data: {
          organizationId: audit.organizationId, prospectId: audit.prospectId, contactId: parsed.data.recipientContactId ?? null,
          type: "AUDIT_SENT", subject: "Audit envoyé au prospect", createdById: me.id, visibility: "INTERNAL",
        },
      });
      if (audit.prospectId) await tx.prospect.update({ where: { id: audit.prospectId }, data: { lastActivityAt: new Date() } });
    });
    await logAction({ actor: me, action: "audit.send", entity: "Audit", entityId: parsed.data.id, metadata: { recipientContactId: parsed.data.recipientContactId } });
    revalidateAudit(parsed.data.id, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] sendAudit:", e);
    return { ok: false, error: "Impossible de marquer l'audit comme envoyé." };
  }
}

export async function archiveAudit(input: { id?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const audit = await loadAccessibleAudit(me, parsed.data.id);
  if (!audit) return { ok: false, error: "Audit introuvable." };
  try {
    await prisma.audit.update({ where: { id: parsed.data.id }, data: { archivedAt: new Date(), status: "ARCHIVED" } });
    await logAction({ actor: me, action: "audit.archive", entity: "Audit", entityId: parsed.data.id });
    revalidateAudit(parsed.data.id, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] archiveAudit:", e);
    return { ok: false, error: "Impossible d'archiver l'audit." };
  }
}

/* ─── Documents ─────────────────────────────────────────────────────────────── */

export async function addAuditDocument(input: unknown): Promise<Result<{ documentId: string }>> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "audit:upload_document")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({
    auditId: z.string().min(1),
    url: z.string().url().max(1000),
    fileName: z.string().trim().min(1).max(200),
    mimeType: z.string().trim().max(120).optional(),
    size: z.coerce.number().int().nonnegative().optional(),
    documentType: z.enum(DOC_TYPE_VALUES),
    visibility: z.enum(DOC_VISIBILITY_VALUES),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Document invalide." };
  const d = parsed.data;
  const audit = await loadAccessibleAudit(me, d.auditId);
  if (!audit) return { ok: false, error: "Audit introuvable." };
  if (audit.status === "ARCHIVED") return { ok: false, error: "Audit archivé." };
  try {
    const sameName = await prisma.auditDocument.count({ where: { auditId: d.auditId, fileName: d.fileName } });
    const doc = await prisma.auditDocument.create({
      data: {
        auditId: d.auditId, documentType: d.documentType as never, fileName: d.fileName, fileUrl: d.url,
        mimeType: d.mimeType || null, size: d.size ?? null, version: sameName + 1,
        visibility: d.visibility as never, uploadedById: me.id,
      },
      select: { id: true },
    });
    await logAction({ actor: me, action: "audit.document.add", entity: "AuditDocument", entityId: doc.id, metadata: { auditId: d.auditId, visibility: d.visibility } });
    revalidateAudit(d.auditId, audit.prospectId);
    return { ok: true, documentId: doc.id };
  } catch (e) {
    console.error("[crm] addAuditDocument:", e);
    return { ok: false, error: "Impossible d'enregistrer le document." };
  }
}

export async function deleteAuditDocument(input: { id?: unknown; auditId?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1), auditId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const audit = await loadAccessibleAudit(me, parsed.data.auditId);
  if (!audit) return { ok: false, error: "Audit introuvable." };
  try {
    await prisma.auditDocument.deleteMany({ where: { id: parsed.data.id, auditId: parsed.data.auditId } });
    await logAction({ actor: me, action: "audit.document.delete", entity: "AuditDocument", entityId: parsed.data.id });
    revalidateAudit(parsed.data.auditId, audit.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] deleteAuditDocument:", e);
    return { ok: false, error: "Impossible de supprimer le document." };
  }
}
