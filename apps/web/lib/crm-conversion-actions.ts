"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { requirePermissionMutation, isAdmin, type SessionUser } from "./access";
import { logAction } from "./crm-audit-log";
import { notifyRoles, notifyMaybe } from "./crm-notifications";

/* ══════════════════════════════════════════════════════════════════════════
   Conversion Opportunité → Projet. Le commercial DEMANDE la conversion (aucune
   création directe) ; l'admin valide (crée le projet en transférant contact,
   audit, devis, besoin…) ou refuse avec motif. Aucune double saisie.
   ══════════════════════════════════════════════════════════════════════════ */

export type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const PROJECT_TYPES = ["SITE_VITRINE", "SITE_INSTITUTIONNEL", "ELEARNING", "REFONTE", "MAINTENANCE", "OTHER"] as const;
const REQUESTABLE_STAGES = ["VERBAL_AGREEMENT", "DEPOSIT_PENDING", "WON"];

function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || "projet";
}
async function uniqueProjectSlug(base: string): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 2;
  while ((await prisma.project.count({ where: { slug } })) > 0) slug = `${root}-${n++}`;
  return slug;
}

function revalidateConversion(dealId: string, projectId?: string) {
  revalidatePath("/admin/opportunites");
  revalidatePath(`/admin/opportunites/${dealId}`);
  revalidatePath("/admin/conversions");
  revalidatePath("/admin/commercial");
  if (projectId) {
    revalidatePath("/admin/projets");
    revalidatePath("/mes-projets");
  }
}

/** Éléments manquants empêchant la demande de conversion. */
function missingForConversion(deal: {
  stage: string; primaryContactId: string | null; estimatedAmount: number | null;
  recommendedOffer: string | null; hasAcceptedQuote: boolean;
}): string[] {
  const missing: string[] = [];
  if (!REQUESTABLE_STAGES.includes(deal.stage)) missing.push("l'opportunité doit être en accord verbal, acompte attendu ou gagnée");
  if (!deal.primaryContactId) missing.push("un contact principal");
  if (deal.estimatedAmount == null && !deal.hasAcceptedQuote) missing.push("un montant ou un devis accepté");
  if (!deal.recommendedOffer) missing.push("une offre identifiée");
  return missing;
}

/* ─── Demande de conversion (commercial) ────────────────────────────────────── */

export async function requestConversion(input: { dealId?: unknown }): Promise<Result> {
  let me: SessionUser;
  try { me = await requirePermissionMutation("conversion:request"); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({ dealId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const deal = await prisma.deal.findUnique({
    where: { id: parsed.data.dealId },
    select: {
      id: true, assignedToId: true, stage: true, conversionStatus: true, primaryContactId: true,
      estimatedAmount: true, recommendedOffer: true, title: true, prospectId: true,
      quotes: { where: { status: "ACCEPTED" }, select: { id: true }, take: 1 },
    },
  });
  if (!deal) return { ok: false, error: "Opportunité introuvable." };
  if (!isAdmin(me) && deal.assignedToId !== me.id) return { ok: false, error: "Cette opportunité ne vous est pas attribuée." };
  if (deal.conversionStatus === "PENDING") return { ok: false, error: "Une demande de conversion est déjà en attente." };
  if (deal.conversionStatus === "VALIDATED") return { ok: false, error: "Cette opportunité est déjà convertie." };

  const missing = missingForConversion({ ...deal, hasAcceptedQuote: deal.quotes.length > 0 });
  if (missing.length) return { ok: false, error: `Complétez d'abord : ${missing.join(", ")}.` };

  try {
    await prisma.deal.update({
      where: { id: deal.id },
      data: { conversionStatus: "PENDING", conversionRequestedAt: new Date(), conversionRequestedById: me.id, conversionNote: null },
    });
    await logAction({ actor: me, action: "conversion.request", entity: "Deal", entityId: deal.id });
    await notifyRoles(["ADMIN", "SUPER_ADMIN"], {
      type: "CONVERSION_REQUESTED", title: "Conversion en projet demandée",
      message: `Une opportunité (${deal.title}) attend votre validation de conversion.`,
      link: `/admin/opportunites/${deal.id}`,
    });
    revalidateConversion(deal.id);
    return { ok: true };
  } catch (e) {
    console.error("[crm] requestConversion:", e);
    return { ok: false, error: "Impossible d'envoyer la demande." };
  }
}

/* ─── Validation / refus (admin) ────────────────────────────────────────────── */

export async function reviewConversion(input: {
  dealId?: unknown; decision?: unknown; note?: unknown; projectManagerId?: unknown; projectType?: unknown; budget?: unknown;
}): Promise<Result<{ projectId?: string }>> {
  let me: SessionUser;
  try { me = await requirePermissionMutation("conversion:validate"); } catch { return { ok: false, error: "Accès refusé." }; }
  const parsed = z.object({
    dealId: z.string().min(1),
    decision: z.enum(["validate", "reject"]),
    note: z.string().trim().max(2000).optional(),
    projectManagerId: z.string().trim().min(1).optional(),
    projectType: z.enum(PROJECT_TYPES).optional(),
    budget: z.coerce.number().int().nonnegative().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const { dealId, decision, note, projectManagerId, projectType, budget } = parsed.data;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true, title: true, description: true, stage: true, conversionStatus: true, estimatedAmount: true,
      recommendedOffer: true, identifiedNeed: true, assignedToId: true, conversionRequestedById: true,
      organizationId: true, prospectId: true, primaryContactId: true,
      organization: { select: { id: true, name: true, email: true } },
      primaryContact: { select: { id: true, fullName: true, email: true } },
      project: { select: { id: true } },
      quotes: { where: { status: "ACCEPTED" }, orderBy: { acceptedAt: "desc" }, take: 1, select: { id: true, total: true } },
    },
  });
  if (!deal) return { ok: false, error: "Opportunité introuvable." };
  if (deal.conversionStatus !== "PENDING") return { ok: false, error: "Aucune demande de conversion en attente." };

  /* ── Refus ── */
  if (decision === "reject") {
    if (!note) return { ok: false, error: "Un motif de refus est requis." };
    try {
      await prisma.deal.update({ where: { id: dealId }, data: { conversionStatus: "REJECTED", conversionNote: note } });
      await logAction({ actor: me, action: "conversion.reject", entity: "Deal", entityId: dealId, metadata: { note } });
      await notifyMaybe(deal.conversionRequestedById ?? deal.assignedToId, {
        type: "CONVERSION_REJECTED", title: "Conversion refusée",
        message: `La conversion de « ${deal.title} » a été refusée.`, link: `/admin/opportunites/${dealId}`,
      });
      revalidateConversion(dealId);
      return { ok: true };
    } catch (e) {
      console.error("[crm] reviewConversion reject:", e);
      return { ok: false, error: "Impossible de refuser la conversion." };
    }
  }

  /* ── Validation → création du projet ── */
  if (deal.project) return { ok: false, error: "Cette opportunité est déjà convertie en projet." };
  const email = deal.primaryContact?.email || deal.organization.email;
  if (!email) return { ok: false, error: "Renseignez un email (contact principal ou organisation) avant de convertir." };
  const clientName = deal.primaryContact?.fullName || deal.organization.name;

  try {
    // Audit le plus récent validé/envoyé de l'organisation, pour transfert.
    const audit = await prisma.audit.findFirst({
      where: { organizationId: deal.organizationId, status: { in: ["VALIDATED", "SENT"] } },
      orderBy: { validatedAt: "desc" }, select: { id: true },
    });
    const acceptedQuote = deal.quotes[0] ?? null;
    const finalBudget = budget ?? acceptedQuote?.total ?? deal.estimatedAmount ?? null;
    const description = deal.description || deal.identifiedNeed || deal.recommendedOffer || deal.title;

    const projectId = await prisma.$transaction(async (tx) => {
      // Client : réutilise ou crée un compte CLIENT (inactif, sans mot de passe).
      let client = await tx.user.findUnique({ where: { email }, select: { id: true, roles: true } });
      if (!client) {
        client = await tx.user.create({ data: { name: clientName, email, roles: ["CLIENT"], isActive: false }, select: { id: true, roles: true } });
      } else if (!client.roles.includes("CLIENT")) {
        client = await tx.user.update({ where: { id: client.id }, data: { roles: { set: [...client.roles, "CLIENT"] } }, select: { id: true, roles: true } });
      }

      const project = await tx.project.create({
        data: {
          clientId: client.id,
          organizationId: deal.organizationId,
          dealId: deal.id,
          auditId: audit?.id ?? null,
          quoteId: acceptedQuote?.id ?? null,
          primaryContactId: deal.primaryContactId,
          commercialOwnerId: deal.assignedToId,
          projectManagerId: projectManagerId ?? null,
          title: deal.title,
          slug: await uniqueProjectSlug(deal.title),
          type: (projectType ?? "OTHER") as never,
          description,
          budget: finalBudget,
          status: "PENDING",
          sourceType: "DEAL",
          sourceId: deal.id,
          commercialSummary: deal.recommendedOffer,
          initialNeed: deal.identifiedNeed,
          validatedScope: description,
        },
        select: { id: true },
      });

      await tx.deal.update({
        where: { id: deal.id },
        data: { conversionStatus: "VALIDATED", conversionValidatedAt: new Date(), conversionValidatedById: me.id, stage: deal.stage === "WON" ? undefined : "WON", wonAt: new Date() },
      });
      await tx.organization.update({ where: { id: deal.organizationId }, data: { lifecycleStage: "CLIENT" } });

      // Historique conservé : journalise la conversion comme activité.
      await tx.activity.create({
        data: { organizationId: deal.organizationId, dealId: deal.id, projectId: project.id, type: "STATUS_CHANGE", subject: "Opportunité convertie en projet", createdById: me.id, visibility: "INTERNAL" },
      });
      return project.id;
    });

    await logAction({ actor: me, action: "conversion.validate", entity: "Deal", entityId: dealId, newValue: { projectId } });
    await notifyMaybe(deal.assignedToId, { type: "CONVERSION_VALIDATED", title: "Conversion validée", message: `« ${deal.title} » est devenue un projet.`, link: `/admin/projets/${projectId}` });
    await notifyMaybe(projectManagerId ?? null, { type: "PROJECT_ASSIGNED", title: "Nouveau projet attribué", message: `Le projet « ${deal.title} » vous a été confié.`, link: `/admin/projets/${projectId}` });
    revalidateConversion(dealId, projectId);
    return { ok: true, projectId };
  } catch (e) {
    console.error("[crm] reviewConversion validate:", e);
    return { ok: false, error: "Impossible de créer le projet." };
  }
}
