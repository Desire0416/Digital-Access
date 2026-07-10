import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { getAudit } from "@/lib/crm-audit-queries";
import { can } from "@/lib/permissions";
import { AuditEditor } from "./AuditEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);
  return { title: audit ? `${audit.reference} — ${audit.title}` : "Audit introuvable" };
}

export default async function AuditEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, audit] = await Promise.all([currentUser(), getAudit(id)]);
  if (!audit) notFound();

  return (
    <AuditEditor
      audit={audit}
      canValidate={can(user, "audit:validate")}
      canSend={can(user, "audit:send")}
      canSubmit={can(user, "audit:submit")}
      canEditDocs={can(user, "audit:upload_document")}
    />
  );
}
