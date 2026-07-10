import type { Metadata } from "next";
import { currentUser } from "@da/auth/guards";
import { getAudits, getAuditReviewQueue, type CrmAuditFilters } from "@/lib/crm-audit-queries";
import { can, isAdmin } from "@/lib/permissions";
import { AuditsBoard } from "./AuditsBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audits" };

type SP = Promise<{ status?: string; severity?: string; q?: string }>;

export default async function AuditsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: CrmAuditFilters = { status: sp.status, severity: sp.severity, search: sp.q };
  const user = await currentUser();
  const admin = isAdmin(user);
  const [audits, reviewQueue] = await Promise.all([
    getAudits(filters),
    admin ? getAuditReviewQueue() : Promise.resolve([]),
  ]);

  return (
    <AuditsBoard
      audits={audits}
      reviewQueue={reviewQueue}
      canValidate={can(user, "audit:validate")}
      filters={{ status: sp.status ?? "", severity: sp.severity ?? "", q: sp.q ?? "" }}
    />
  );
}
