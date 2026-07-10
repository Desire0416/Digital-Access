import type { Metadata } from "next";
import { currentUser } from "@da/auth/guards";
import { getDeals, getDealPipelineStats, type CrmDealFilters } from "@/lib/crm-deal-queries";
import { getAssignableCommercials } from "@/lib/crm-queries";
import { can } from "@/lib/permissions";
import { DealsBoard } from "./DealsBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Opportunités" };

type SP = Promise<{ stage?: string; assignee?: string; q?: string; view?: string }>;

export default async function OpportunitesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: CrmDealFilters = { stage: sp.stage, assignee: sp.assignee, search: sp.q };
  const [user, deals, stats, assignable] = await Promise.all([
    currentUser(),
    getDeals(filters),
    getDealPipelineStats(),
    getAssignableCommercials(),
  ]);

  return (
    <DealsBoard
      deals={deals}
      stats={stats}
      assignable={assignable}
      canAssign={can(user, "prospect:assign")}
      filters={{
        stage: sp.stage ?? "", assignee: sp.assignee ?? "", q: sp.q ?? "",
        view: sp.view === "table" ? "table" : "kanban",
      }}
    />
  );
}
