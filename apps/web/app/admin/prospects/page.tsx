import type { Metadata } from "next";
import { currentUser } from "@da/auth/guards";
import { getProspects, getAssignableCommercials, type CrmProspectFilters } from "@/lib/crm-queries";
import { can, isAdmin } from "@/lib/permissions";
import { ProspectsBoard } from "./ProspectsBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prospects" };

type SP = Promise<{
  status?: string; sector?: string; priority?: string; assignee?: string;
  city?: string; source?: string; maturity?: string; q?: string; view?: string;
}>;

export default async function ProspectsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: CrmProspectFilters = {
    status: sp.status, sector: sp.sector, priority: sp.priority, assignee: sp.assignee,
    city: sp.city, source: sp.source, maturity: sp.maturity, search: sp.q,
  };
  const [user, prospects, assignable] = await Promise.all([
    currentUser(),
    getProspects(filters),
    getAssignableCommercials(),
  ]);

  // Options de secteur (distinctes) dérivées des prospects accessibles.
  const sectors = Array.from(new Set(prospects.map((p) => p.sector).filter(Boolean) as string[])).sort();

  return (
    <ProspectsBoard
      prospects={prospects}
      assignable={assignable}
      sectors={sectors}
      canAssign={can(user, "prospect:assign")}
      scopeAll={isAdmin(user)}
      filters={{
        status: sp.status ?? "", sector: sp.sector ?? "", priority: sp.priority ?? "",
        assignee: sp.assignee ?? "", city: sp.city ?? "", source: sp.source ?? "",
        maturity: sp.maturity ?? "", q: sp.q ?? "", view: sp.view === "kanban" ? "kanban" : "table",
      }}
    />
  );
}
