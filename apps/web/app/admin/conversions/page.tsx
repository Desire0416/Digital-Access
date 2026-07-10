import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Rocket, ArrowRight, Building2, UserRound, CalendarClock } from "lucide-react";
import { formatFCFA, formatDate } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { getConversionQueue } from "@/lib/crm-deal-queries";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conversions à valider" };

export default async function ConversionsPage() {
  const user = await currentUser();
  if (!can(user, "conversion:validate")) redirect("/admin");

  const queue = await getConversionQueue();

  return (
    <div>
      <AdminPageHeader
        title="Conversions à valider"
        description="Opportunités abouties en attente de transformation en projet."
      />

      {queue.length === 0 ? (
        <EmptyState
          icon={<Rocket size={22} />}
          title="Aucune demande en attente"
          description="Les demandes de conversion des commerciaux apparaîtront ici pour validation."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {queue.map((c) => (
            <Link
              key={c.dealId}
              href={`/admin/opportunites/${c.dealId}`}
              className="group flex flex-col gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-display font-bold text-navy">{c.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1"><Building2 size={13} /> {c.organizationName}</span>
                  {c.assignedToName && <span className="inline-flex items-center gap-1"><UserRound size={13} /> {c.assignedToName}</span>}
                  {c.requestedAt && <span className="inline-flex items-center gap-1"><CalendarClock size={13} /> Demandé le {formatDate(c.requestedAt)}</span>}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display text-lg font-extrabold text-navy">
                  {c.estimatedAmount != null ? formatFCFA(c.estimatedAmount) : "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3 py-2 text-sm font-semibold text-white shadow-brand">
                  Examiner <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
