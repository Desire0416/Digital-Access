"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { requirePermissionMutation, isAdmin, can, type SessionUser } from "./access";
import { logAction } from "./crm-audit-log";
import {
  ORG_TYPE_VALUES, AUDIT_SEVERITY_VALUES, AUDIT_CATEGORY_VALUES,
} from "./crm-types";
import type { Result } from "./crm-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Création d'un prospect à partir d'un fichier importé (analysé par IA).
   L'entrée provient du formulaire de revue (extraction éventuellement corrigée
   par l'utilisateur) : elle est donc INTÉGRALEMENT re-validée ici (jamais de
   confiance au client). Crée en une transaction : Organisation + Prospect +
   Audit (+ constats) + document d'origine rattaché.
   ══════════════════════════════════════════════════════════════════════════ */

function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || "org";
}

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base);
  let slug = root, n = 2;
  while (await prisma.organization.findUnique({ where: { slug }, select: { id: true } })) slug = `${root}-${n++}`;
  return slug;
}

async function uniqueAuditReference(base: string | undefined, orgName: string): Promise<string> {
  const root = (base && base.trim()) || `DA-AUD-${slugify(orgName).toUpperCase().replace(/-/g, "").slice(0, 8) || "ORG"}-${new Date().getUTCFullYear()}`;
  let ref = root, n = 2;
  while (await prisma.audit.findUnique({ where: { reference: ref }, select: { id: true } })) ref = `${root}-${n++}`;
  return ref;
}

/** N'accepte que les URL de stockage Blob (celles renvoyées par notre route d'analyse). */
function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function parseAuditDate(v: string | undefined): Date {
  if (v) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

const optStr = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

const importSchema = z.object({
  organization: z.object({
    name: z.string().trim().min(2, "Nom requis").max(120),
    legalName: optStr(160),
    organizationType: z.enum(ORG_TYPE_VALUES),
    sector: optStr(120),
    website: optStr(200),
    email: optStr(160),
    phone: optStr(40),
    city: optStr(80),
    country: optStr(80),
  }),
  prospect: z.object({
    mainObservedNeed: optStr(1000),
    digitalMaturity: optStr(40),
    recommendedOffer: optStr(200),
    estimatedPotential: z.coerce.number().int().nonnegative().nullable().optional(),
  }),
  audit: z.object({
    reference: optStr(80),
    title: z.string().trim().min(2, "Titre requis").max(200),
    auditType: optStr(120),
    summary: optStr(6000),
    methodology: optStr(3000),
    digitalImportanceStatement: optStr(3000),
    overallSeverity: z.enum(AUDIT_SEVERITY_VALUES),
    auditDate: optStr(30),
    findings: z.array(z.object({
      title: z.string().trim().min(1).max(200),
      category: z.enum(AUDIT_CATEGORY_VALUES),
      severity: z.enum(AUDIT_SEVERITY_VALUES),
      description: optStr(2000),
      businessImpact: optStr(500),
      userImpact: optStr(500),
      recommendation: optStr(1000),
      affectedPageUrl: optStr(300),
      evidenceText: optStr(1000),
    })).max(40).default([]),
  }),
  document: z.object({
    url: z.string().url().max(1000),
    fileName: z.string().trim().max(200),
    mimeType: z.string().trim().max(120),
    size: z.coerce.number().int().nonnegative(),
  }).optional(),
  /** Attribution ciblée (réservée aux rôles pouvant réattribuer). */
  assignedToId: z.string().trim().min(1).optional(),
});

export async function createProspectFromImport(
  input: unknown,
): Promise<Result<{ prospectId: string; organizationId: string; auditId: string }>> {
  let me: SessionUser;
  try {
    me = await requirePermissionMutation("prospect:create");
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = importSchema.safeParse(input);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) { const k = i.path.join("."); if (!fe[k]) fe[k] = i.message; }
    return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: fe };
  }
  const d = parsed.data;

  try {
    const slug = await uniqueOrgSlug(d.organization.name);
    const reference = await uniqueAuditReference(d.audit.reference, d.organization.name);
    const canAssign = can(me, "prospect:assign") || isAdmin(me);
    const assignedToId = canAssign && d.assignedToId ? d.assignedToId : me.id;
    const doc = d.document && isBlobUrl(d.document.url) ? d.document : null;

    const created = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: d.organization.name,
          slug,
          legalName: d.organization.legalName ?? null,
          organizationType: d.organization.organizationType as never,
          sector: d.organization.sector ?? null,
          website: d.organization.website ?? null,
          email: d.organization.email ?? null,
          phone: d.organization.phone ?? null,
          city: d.organization.city ?? null,
          country: d.organization.country ?? "Côte d'Ivoire",
          lifecycleStage: "PROSPECT",
          source: "import-fichier",
          ownerId: me.id,
          createdById: me.id,
        },
        select: { id: true },
      });

      const prospect = await tx.prospect.create({
        data: {
          organizationId: org.id,
          status: "AUDIT_COMPLETED",
          source: "import-fichier",
          assignedToId,
          createdById: me.id,
          digitalMaturity: d.prospect.digitalMaturity ?? null,
          recommendedOffer: d.prospect.recommendedOffer ?? null,
          mainObservedNeed: d.prospect.mainObservedNeed ?? d.audit.summary ?? null,
          estimatedPotential: d.prospect.estimatedPotential ?? null,
          lastActivityAt: new Date(),
        },
        select: { id: true },
      });

      const audit = await tx.audit.create({
        data: {
          organizationId: org.id,
          prospectId: prospect.id,
          reference,
          title: d.audit.title,
          auditType: d.audit.auditType ?? null,
          status: "DRAFT",
          version: 1,
          overallSeverity: d.audit.overallSeverity as never,
          summary: d.audit.summary ?? null,
          methodology: d.audit.methodology ?? null,
          digitalImportanceStatement: d.audit.digitalImportanceStatement ?? null,
          auditDate: parseAuditDate(d.audit.auditDate),
          authorId: me.id,
          findings: {
            create: d.audit.findings.map((f, i) => ({
              title: f.title,
              category: f.category as never,
              severity: f.severity as never,
              description: f.description ?? null,
              businessImpact: f.businessImpact ?? null,
              userImpact: f.userImpact ?? null,
              recommendation: f.recommendation ?? null,
              affectedPageUrl: f.affectedPageUrl ?? null,
              evidenceText: f.evidenceText ?? null,
              priorityOrder: i,
              isPublic: true,
            })),
          },
          ...(doc
            ? {
                documents: {
                  create: {
                    documentType: "CLIENT_REPORT",
                    fileName: doc.fileName,
                    fileUrl: doc.url,
                    mimeType: doc.mimeType,
                    size: doc.size,
                    version: 1,
                    visibility: "INTERNAL_ONLY",
                    uploadedById: me.id,
                  },
                },
              }
            : {}),
        },
        select: { id: true },
      });

      return { organizationId: org.id, prospectId: prospect.id, auditId: audit.id };
    });

    await logAction({
      actor: me,
      action: "prospect.import",
      entity: "Prospect",
      entityId: created.prospectId,
      newValue: { organizationId: created.organizationId, auditId: created.auditId, findings: d.audit.findings.length, source: "import-fichier" },
    });

    revalidatePath("/admin/prospects");
    revalidatePath("/admin/commercial");
    return { ok: true, ...created };
  } catch (e) {
    console.error("[crm] createProspectFromImport:", e);
    return { ok: false, error: "Impossible d'enregistrer le prospect importé." };
  }
}
