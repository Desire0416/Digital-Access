"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { requirePermissionMutation, requireStaffMutation, isAdmin, can, type SessionUser } from "./access";
import { findDuplicateOrganizations } from "./crm-queries";
import type { DuplicateMatch } from "./crm-types";
import { logAction } from "./crm-audit-log";
import { notifyMaybe } from "./crm-notifications";
import {
  PROSPECT_STATUS_VALUES, PRIORITY_VALUES, ORG_TYPE_VALUES, ACTIVITY_TYPE_VALUES,
  PROSPECT_STATUS_LABEL,
} from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions CRM commercial (MUTATIONS). Chaque action :
   1. re-vérifie la permission sur le VRAI utilisateur (jamais l'impersonation) ;
   2. valide l'entrée avec Zod (jamais confiance au client) ;
   3. applique la sécurité au niveau ligne (un commercial n'agit que sur SES
      dossiers ; un admin sur tout) ;
   4. journalise (AuditLog) et notifie (best-effort) ;
   5. renvoie un Result discriminé et revalide les chemins impactés.
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

function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || "org";
}

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 2;
  while (await prisma.organization.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const optional = () => z.string().trim().max(2000).optional().or(z.literal(""));

/** Charge un prospect si l'utilisateur y a accès en écriture (propriétaire ou admin). */
async function loadOwnedProspect(user: SessionUser, id: string) {
  const p = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, assignedToId: true, organizationId: true, status: true },
  });
  if (!p) return null;
  if (!isAdmin(user) && p.assignedToId !== user.id) return null;
  return p;
}

/** Vérifie l'accès en écriture à une organisation (admin ou possède un prospect dedans). */
async function canWriteOrg(user: SessionUser, organizationId: string): Promise<boolean> {
  if (isAdmin(user)) return true;
  const owned = await prisma.prospect.findFirst({
    where: { organizationId, assignedToId: user.id },
    select: { id: true },
  });
  return Boolean(owned);
}

function revalidateProspect(id?: string) {
  revalidatePath("/admin/prospects");
  revalidatePath("/admin/commercial");
  if (id) revalidatePath(`/admin/prospects/${id}`);
}

/* ─── Création d'un prospect (+ organisation si nouvelle) ────────────────────── */

const createProspectSchema = z.object({
  organizationId: z.string().trim().min(1).optional(),
  orgName: z.string().trim().max(120).optional(),
  orgType: z.enum(ORG_TYPE_VALUES).optional(),
  sector: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  website: z.string().trim().max(200).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  source: z.string().trim().max(80).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  assignedToId: z.string().trim().min(1).optional(),
  recommendedOffer: z.string().trim().max(200).optional(),
  mainObservedNeed: z.string().trim().max(500).optional(),
  digitalMaturity: z.string().trim().max(40).optional(),
  estimatedPotential: z.coerce.number().int().nonnegative().optional(),
});

export async function createProspect(input: unknown): Promise<Result<{ prospectId: string; organizationId: string }>> {
  let me: SessionUser;
  try {
    me = await requirePermissionMutation("prospect:create");
  } catch {
    return { ok: false, error: "Accès refusé." };
  }
  const parsed = createProspectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;

  try {
    // Organisation : réutilise l'existante ou en crée une nouvelle.
    let organizationId = d.organizationId ?? null;
    if (organizationId) {
      const exists = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
      if (!exists) return { ok: false, error: "Organisation introuvable." };
    } else {
      const name = str(d.orgName, 120);
      if (name.length < 2) return { ok: false, error: "Le nom de l'organisation est requis.", fieldErrors: { orgName: "Nom requis." } };
      const org = await prisma.organization.create({
        data: {
          name, slug: await uniqueOrgSlug(name),
          organizationType: (d.orgType ?? "COMPANY") as never,
          sector: d.sector || null, city: d.city || null, website: d.website || null,
          email: d.email || null, phone: d.phone || null, whatsapp: d.whatsapp || null,
          source: d.source || null, lifecycleStage: "PROSPECT",
          ownerId: me.id, createdById: me.id,
        },
        select: { id: true },
      });
      organizationId = org.id;
    }

    // Attribution : un admin/gestionnaire peut cibler quelqu'un ; sinon soi-même.
    const canAssign = can(me, "prospect:assign") || isAdmin(me);
    const assignedToId = canAssign && d.assignedToId ? d.assignedToId : me.id;

    const prospect = await prisma.prospect.create({
      data: {
        organizationId,
        status: "TO_ANALYZE",
        source: d.source || null,
        priority: (d.priority as never) ?? null,
        assignedToId,
        recommendedOffer: d.recommendedOffer || null,
        mainObservedNeed: d.mainObservedNeed || null,
        digitalMaturity: d.digitalMaturity || null,
        estimatedPotential: d.estimatedPotential ?? null,
        createdById: me.id,
        lastActivityAt: new Date(),
      },
      select: { id: true },
    });

    await logAction({ actor: me, action: "prospect.create", entity: "Prospect", entityId: prospect.id, newValue: { organizationId, assignedToId } });
    if (assignedToId !== me.id) {
      await notifyMaybe(assignedToId, {
        type: "PROSPECT_ASSIGNED",
        title: "Nouveau prospect attribué",
        message: "Un prospect vous a été attribué.",
        link: `/admin/prospects/${prospect.id}`,
      });
    }
    revalidateProspect();
    return { ok: true, prospectId: prospect.id, organizationId };
  } catch (e) {
    console.error("[crm] createProspect:", e);
    return { ok: false, error: "Impossible de créer le prospect." };
  }
}

/* ─── Mise à jour d'un prospect ─────────────────────────────────────────────── */

const updateProspectSchema = z.object({
  id: z.string().min(1),
  priority: z.enum(PRIORITY_VALUES).nullable().optional(),
  source: z.string().trim().max(80).optional(),
  digitalMaturity: z.string().trim().max(40).optional(),
  estimatedPotential: z.coerce.number().int().nonnegative().nullable().optional(),
  recommendedOffer: z.string().trim().max(200).optional(),
  mainObservedNeed: z.string().trim().max(1000).optional(),
  contactStatus: z.string().trim().max(120).optional(),
  nextAction: z.string().trim().max(300).optional(),
  nextActionDate: z.string().trim().optional(),
});

export async function updateProspect(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = updateProspectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const owned = await loadOwnedProspect(me, d.id);
  if (!owned) return { ok: false, error: "Prospect introuvable." };
  if (!can(me, "prospect:update_assigned") && !can(me, "prospect:update_all")) return { ok: false, error: "Permission insuffisante." };

  const nextDate = d.nextActionDate ? new Date(d.nextActionDate) : null;
  try {
    await prisma.prospect.update({
      where: { id: d.id },
      data: {
        priority: (d.priority as never) ?? (d.priority === null ? null : undefined),
        source: d.source ?? undefined,
        digitalMaturity: d.digitalMaturity ?? undefined,
        estimatedPotential: d.estimatedPotential === undefined ? undefined : d.estimatedPotential,
        recommendedOffer: d.recommendedOffer ?? undefined,
        mainObservedNeed: d.mainObservedNeed ?? undefined,
        contactStatus: d.contactStatus ?? undefined,
        nextAction: d.nextAction ?? undefined,
        nextActionDate: d.nextActionDate === undefined ? undefined : (nextDate && !isNaN(nextDate.getTime()) ? nextDate : null),
      },
    });
    await logAction({ actor: me, action: "prospect.update", entity: "Prospect", entityId: d.id });
    revalidateProspect(d.id);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateProspect:", e);
    return { ok: false, error: "Impossible de mettre à jour le prospect." };
  }
}

/* ─── Changement de statut (+ activité + cycle de vie org) ───────────────────── */

export async function updateProspectStatus(input: { id?: unknown; status?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1), status: z.enum(PROSPECT_STATUS_VALUES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  const { id, status } = parsed.data;
  const owned = await loadOwnedProspect(me, id);
  if (!owned) return { ok: false, error: "Prospect introuvable." };
  if (!can(me, "prospect:update_assigned") && !can(me, "prospect:update_all")) return { ok: false, error: "Permission insuffisante." };
  if (owned.status === status) return { ok: true };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.prospect.update({ where: { id }, data: { status, lastActivityAt: new Date() } });
      await tx.activity.create({
        data: {
          organizationId: owned.organizationId, prospectId: id, type: "STATUS_CHANGE",
          subject: `Statut : ${PROSPECT_STATUS_LABEL[status]}`, createdById: me.id, visibility: "INTERNAL",
        },
      });
      // Reflet du cycle de vie de l'organisation.
      if (status === "CONVERTED_TO_OPPORTUNITY") {
        await tx.organization.update({ where: { id: owned.organizationId }, data: { lifecycleStage: "OPPORTUNITY" } });
      } else if (status === "ARCHIVED") {
        // pas de changement de cycle de vie automatique
      }
    });
    await logAction({ actor: me, action: "prospect.status", entity: "Prospect", entityId: id, oldValue: { status: owned.status }, newValue: { status } });
    revalidateProspect(id);
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateProspectStatus:", e);
    return { ok: false, error: "Impossible de changer le statut." };
  }
}

/* ─── Attribution ───────────────────────────────────────────────────────────── */

export async function assignProspect(input: { id?: unknown; assigneeId?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "prospect:assign")) return { ok: false, error: "Seule l'administration peut réattribuer un prospect." };
  const parsed = z.object({ id: z.string().min(1), assigneeId: z.string().min(1).nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const { id, assigneeId } = parsed.data;

  const prospect = await prisma.prospect.findUnique({ where: { id }, select: { id: true, assignedToId: true } });
  if (!prospect) return { ok: false, error: "Prospect introuvable." };
  if (assigneeId) {
    const target = await prisma.user.findFirst({
      where: { id: assigneeId, roles: { hasSome: ["COMMERCIAL", "ADMIN", "SUPER_ADMIN"] as never }, deletedAt: null },
      select: { id: true },
    });
    if (!target) return { ok: false, error: "Responsable invalide." };
  }

  try {
    await prisma.prospect.update({ where: { id }, data: { assignedToId: assigneeId } });
    await logAction({ actor: me, action: "prospect.assign", entity: "Prospect", entityId: id, oldValue: { assignedToId: prospect.assignedToId }, newValue: { assignedToId: assigneeId } });
    await notifyMaybe(assigneeId, {
      type: "PROSPECT_ASSIGNED", title: "Prospect attribué",
      message: "Un prospect vous a été attribué.", link: `/admin/prospects/${id}`,
    });
    revalidateProspect(id);
    return { ok: true };
  } catch (e) {
    console.error("[crm] assignProspect:", e);
    return { ok: false, error: "Impossible de réattribuer le prospect." };
  }
}

/* ─── Archivage (soft) ──────────────────────────────────────────────────────── */

export async function archiveProspect(input: { id?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const owned = await loadOwnedProspect(me, parsed.data.id);
  if (!owned) return { ok: false, error: "Prospect introuvable." };
  if (!can(me, "prospect:archive") && !isAdmin(me)) return { ok: false, error: "Permission insuffisante." };
  try {
    await prisma.prospect.update({ where: { id: parsed.data.id }, data: { archivedAt: new Date(), status: "ARCHIVED" } });
    await logAction({ actor: me, action: "prospect.archive", entity: "Prospect", entityId: parsed.data.id });
    revalidateProspect(parsed.data.id);
    return { ok: true };
  } catch (e) {
    console.error("[crm] archiveProspect:", e);
    return { ok: false, error: "Impossible d'archiver le prospect." };
  }
}

/* ─── Mise à jour d'une organisation ─────────────────────────────────────────── */

const orgSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160).optional(),
  organizationType: z.enum(ORG_TYPE_VALUES),
  sector: z.string().trim().max(120).optional(),
  subSector: z.string().trim().max(120).optional(),
  description: optional(),
  website: z.string().trim().max(200).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  linkedinUrl: z.string().trim().max(200).optional(),
  facebookUrl: z.string().trim().max(200).optional(),
  instagramUrl: z.string().trim().max(200).optional(),
  googleBusinessUrl: z.string().trim().max(300).optional(),
});

export async function updateOrganization(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  if (!(await canWriteOrg(me, d.id))) return { ok: false, error: "Organisation introuvable." };
  try {
    await prisma.organization.update({
      where: { id: d.id },
      data: {
        name: d.name, legalName: d.legalName || null, organizationType: d.organizationType as never,
        sector: d.sector || null, subSector: d.subSector || null, description: d.description || null,
        website: d.website || null, email: d.email || null, phone: d.phone || null, whatsapp: d.whatsapp || null,
        address: d.address || null, city: d.city || null, country: d.country || null,
        linkedinUrl: d.linkedinUrl || null, facebookUrl: d.facebookUrl || null,
        instagramUrl: d.instagramUrl || null, googleBusinessUrl: d.googleBusinessUrl || null,
      },
    });
    await logAction({ actor: me, action: "organization.update", entity: "Organization", entityId: d.id });
    revalidateProspect();
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateOrganization:", e);
    return { ok: false, error: "Impossible de mettre à jour l'organisation." };
  }
}

/* ─── Contacts ──────────────────────────────────────────────────────────────── */

const contactSchema = z.object({
  organizationId: z.string().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  linkedinUrl: z.string().trim().max(200).optional(),
  isPrimary: z.coerce.boolean().optional(),
  isDecisionMaker: z.coerce.boolean().optional(),
  influenceLevel: z.string().trim().max(40).optional(),
  preferredChannel: z.string().trim().max(40).optional(),
  notes: optional(),
});

export async function createContact(input: unknown): Promise<Result<{ contactId: string }>> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "contact:manage")) return { ok: false, error: "Permission insuffisante." };
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  if (!(await canWriteOrg(me, d.organizationId))) return { ok: false, error: "Organisation introuvable." };
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  try {
    const contact = await prisma.$transaction(async (tx) => {
      if (d.isPrimary) await tx.contact.updateMany({ where: { organizationId: d.organizationId }, data: { isPrimary: false } });
      return tx.contact.create({
        data: {
          organizationId: d.organizationId, firstName: d.firstName, lastName: d.lastName || null, fullName,
          jobTitle: d.jobTitle || null, department: d.department || null, email: d.email || null,
          phone: d.phone || null, whatsapp: d.whatsapp || null, linkedinUrl: d.linkedinUrl || null,
          isPrimary: Boolean(d.isPrimary), isDecisionMaker: Boolean(d.isDecisionMaker),
          influenceLevel: d.influenceLevel || null, preferredChannel: d.preferredChannel || null, notes: d.notes || null,
        },
        select: { id: true },
      });
    });
    await logAction({ actor: me, action: "contact.create", entity: "Contact", entityId: contact.id, metadata: { organizationId: d.organizationId } });
    revalidateProspect();
    return { ok: true, contactId: contact.id };
  } catch (e) {
    console.error("[crm] createContact:", e);
    return { ok: false, error: "Impossible de créer le contact." };
  }
}

export async function updateContact(input: unknown): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "contact:manage")) return { ok: false, error: "Permission insuffisante." };
  const parsed = contactSchema.extend({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const existing = await prisma.contact.findFirst({ where: { id: d.id, organizationId: d.organizationId, deletedAt: null }, select: { id: true } });
  if (!existing || !(await canWriteOrg(me, d.organizationId))) return { ok: false, error: "Contact introuvable." };
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  try {
    await prisma.$transaction(async (tx) => {
      if (d.isPrimary) await tx.contact.updateMany({ where: { organizationId: d.organizationId, id: { not: d.id } }, data: { isPrimary: false } });
      await tx.contact.update({
        where: { id: d.id },
        data: {
          firstName: d.firstName, lastName: d.lastName || null, fullName, jobTitle: d.jobTitle || null,
          department: d.department || null, email: d.email || null, phone: d.phone || null, whatsapp: d.whatsapp || null,
          linkedinUrl: d.linkedinUrl || null, isPrimary: Boolean(d.isPrimary), isDecisionMaker: Boolean(d.isDecisionMaker),
          influenceLevel: d.influenceLevel || null, preferredChannel: d.preferredChannel || null, notes: d.notes || null,
        },
      });
    });
    await logAction({ actor: me, action: "contact.update", entity: "Contact", entityId: d.id });
    revalidateProspect();
    return { ok: true };
  } catch (e) {
    console.error("[crm] updateContact:", e);
    return { ok: false, error: "Impossible de mettre à jour le contact." };
  }
}

export async function deleteContact(input: { id?: unknown; organizationId?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "contact:manage")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({ id: z.string().min(1), organizationId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  // Le contact DOIT appartenir à l'organisation sur laquelle l'appelant a le droit
  // d'écrire (empêche un IDOR : supprimer par id un contact d'une autre org).
  const existing = await prisma.contact.findFirst({
    where: { id: parsed.data.id, organizationId: parsed.data.organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!existing || !(await canWriteOrg(me, parsed.data.organizationId))) return { ok: false, error: "Contact introuvable." };
  try {
    // Écriture bornée à l'organisation (defense in depth).
    await prisma.contact.updateMany({ where: { id: parsed.data.id, organizationId: parsed.data.organizationId }, data: { deletedAt: new Date() } });
    await logAction({ actor: me, action: "contact.delete", entity: "Contact", entityId: parsed.data.id });
    revalidateProspect();
    return { ok: true };
  } catch (e) {
    console.error("[crm] deleteContact:", e);
    return { ok: false, error: "Impossible de supprimer le contact." };
  }
}

/* ─── Ajout rapide d'une activité (timeline) ────────────────────────────────── */

export async function logProspectActivity(input: {
  prospectId?: unknown; type?: unknown; subject?: unknown; notes?: unknown;
}): Promise<Result> {
  let me: SessionUser;
  try { me = await requireStaffMutation(); } catch { return { ok: false, error: "Accès refusé." }; }
  if (!can(me, "activity:create")) return { ok: false, error: "Permission insuffisante." };
  const parsed = z.object({
    prospectId: z.string().min(1),
    type: z.enum(ACTIVITY_TYPE_VALUES),
    subject: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(3000).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Veuillez renseigner l'activité.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const owned = await loadOwnedProspect(me, d.prospectId);
  if (!owned) return { ok: false, error: "Prospect introuvable." };
  try {
    await prisma.$transaction([
      prisma.activity.create({
        data: {
          organizationId: owned.organizationId, prospectId: d.prospectId, type: d.type as never,
          subject: d.subject || null, notes: d.notes || null, createdById: me.id, visibility: "INTERNAL",
        },
      }),
      prisma.prospect.update({ where: { id: d.prospectId }, data: { lastActivityAt: new Date() } }),
    ]);
    await logAction({ actor: me, action: "activity.create", entity: "Activity", entityId: d.prospectId, metadata: { type: d.type } });
    revalidateProspect(d.prospectId);
    return { ok: true };
  } catch (e) {
    console.error("[crm] logProspectActivity:", e);
    return { ok: false, error: "Impossible d'enregistrer l'activité." };
  }
}

/* ─── Détection de doublons (appelée par le formulaire de création) ─────────── */

export async function checkDuplicates(input: {
  name?: string; website?: string; email?: string; phone?: string; whatsapp?: string;
}): Promise<DuplicateMatch[]> {
  try {
    await requireStaffMutation();
  } catch {
    return [];
  }
  try {
    return await findDuplicateOrganizations(input);
  } catch (e) {
    console.error("[crm] checkDuplicates:", e);
    return [];
  }
}
