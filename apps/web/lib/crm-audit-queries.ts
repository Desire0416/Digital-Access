import { prisma } from "@da/db/client";
import { staffScope, type AccessScope } from "./access";
import { AUDIT_EDITABLE_STATUSES } from "./crm-types";
import type { AuditDetail, AuditListRow } from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Data layer Audits (LECTURE). Sécurité au niveau ligne : un commercial voit
   uniquement les audits qu'il a rédigés OU rattachés à un prospect qui lui est
   attribué ; un admin voit tout. Dates sérialisées en ISO.
   ══════════════════════════════════════════════════════════════════════════ */

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** Fragment `where` de restriction : audits de l'utilisateur (auteur ou prospect attribué). */
function auditScopeWhere(scope: AccessScope) {
  if (scope.scopeAll) return {};
  return {
    OR: [{ authorId: scope.user.id }, { prospect: { assignedToId: scope.user.id } }],
  };
}

export interface CrmAuditFilters {
  status?: string;
  severity?: string;
  search?: string;
}

export async function getAudits(filters: CrmAuditFilters = {}): Promise<AuditListRow[]> {
  const scope = await staffScope();
  const where: Record<string, unknown> = { archivedAt: null, ...auditScopeWhere(scope) };
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.overallSeverity = filters.severity;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { reference: { contains: filters.search, mode: "insensitive" } },
      { organization: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
    // Si un scope OR existait déjà, le combiner via AND pour ne pas l'écraser.
    if (!scope.scopeAll) {
      where.AND = [{ OR: [{ authorId: scope.user.id }, { prospect: { assignedToId: scope.user.id } }] }];
      delete (where as Record<string, unknown>).OR;
      (where.AND as Record<string, unknown>[]).push({
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { reference: { contains: filters.search, mode: "insensitive" } },
          { organization: { name: { contains: filters.search, mode: "insensitive" } } },
        ],
      });
    }
  }

  const rows = await prisma.audit.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, reference: true, title: true, status: true, overallSeverity: true,
      auditDate: true, updatedAt: true,
      organization: { select: { name: true } },
      prospect: { select: { id: true } },
      author: { select: { name: true } },
      _count: { select: { findings: true } },
    },
  });

  return rows.map((a) => ({
    id: a.id, reference: a.reference, title: a.title, status: a.status as never,
    overallSeverity: (a.overallSeverity as never) ?? null, findingCount: a._count.findings,
    organizationName: a.organization.name, prospectId: a.prospect?.id ?? null,
    authorName: a.author?.name ?? null, auditDate: iso(a.auditDate), updatedAt: iso(a.updatedAt)!,
  }));
}

/** File de validation (admin) : audits soumis à validation. */
export async function getAuditReviewQueue(): Promise<AuditListRow[]> {
  return getAudits({ status: "TO_VALIDATE" });
}

export async function getAudit(id: string): Promise<AuditDetail | null> {
  const scope = await staffScope();
  const a = await prisma.audit.findFirst({
    where: { id, ...auditScopeWhere(scope) },
    select: {
      id: true, reference: true, title: true, auditType: true, version: true, status: true,
      overallSeverity: true, summary: true, methodology: true, digitalImportanceStatement: true,
      auditDate: true, lastVerifiedAt: true, reviewNote: true, internalNotes: true,
      validatedAt: true, sentAt: true, createdAt: true,
      organization: {
        select: {
          id: true, name: true,
          contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], select: { id: true, fullName: true } },
        },
      },
      prospect: { select: { id: true } },
      author: { select: { id: true, name: true } },
      validatedBy: { select: { name: true } },
      sentBy: { select: { name: true } },
      recipientContact: { select: { id: true, fullName: true } },
      findings: {
        orderBy: [{ priorityOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true, title: true, category: true, description: true, severity: true,
          businessImpact: true, userImpact: true, securityImpact: true, evidenceText: true,
          evidenceUrl: true, affectedPageUrl: true, recommendation: true, priorityOrder: true, isPublic: true,
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, documentType: true, fileName: true, fileUrl: true, mimeType: true,
          size: true, version: true, visibility: true, createdAt: true,
          uploadedBy: { select: { name: true } },
        },
      },
    },
  });
  if (!a) return null;

  return {
    id: a.id, reference: a.reference, title: a.title, auditType: a.auditType, version: a.version,
    status: a.status as never, overallSeverity: (a.overallSeverity as never) ?? null,
    summary: a.summary, methodology: a.methodology, digitalImportanceStatement: a.digitalImportanceStatement,
    auditDate: iso(a.auditDate), lastVerifiedAt: iso(a.lastVerifiedAt), reviewNote: a.reviewNote,
    internalNotes: a.internalNotes, validatedAt: iso(a.validatedAt), sentAt: iso(a.sentAt),
    createdAt: iso(a.createdAt)!,
    editable: AUDIT_EDITABLE_STATUSES.includes(a.status as never),
    organization: { id: a.organization.id, name: a.organization.name },
    prospectId: a.prospect?.id ?? null,
    author: a.author,
    validatedByName: a.validatedBy?.name ?? null,
    sentByName: a.sentBy?.name ?? null,
    recipientContact: a.recipientContact,
    contacts: a.organization.contacts.map((c) => ({ id: c.id, fullName: c.fullName })),
    findings: a.findings.map((f) => ({
      id: f.id, title: f.title, category: f.category as never, description: f.description,
      severity: f.severity as never, businessImpact: f.businessImpact, userImpact: f.userImpact,
      securityImpact: f.securityImpact, evidenceText: f.evidenceText, evidenceUrl: f.evidenceUrl,
      affectedPageUrl: f.affectedPageUrl, recommendation: f.recommendation,
      priorityOrder: f.priorityOrder, isPublic: f.isPublic,
    })),
    documents: a.documents.map((d) => ({
      id: d.id, documentType: d.documentType as never, fileName: d.fileName, fileUrl: d.fileUrl,
      mimeType: d.mimeType, size: d.size, version: d.version, visibility: d.visibility as never,
      uploadedByName: d.uploadedBy?.name ?? null, createdAt: iso(d.createdAt)!,
    })),
  };
}
