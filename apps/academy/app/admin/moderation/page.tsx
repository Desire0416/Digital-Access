import type { Metadata } from "next";
import { ShieldAlert, Clock } from "lucide-react";
import type { ReportStatus } from "@da/academy-db/client";
import { listReportsAdmin } from "@/lib/moderation-queries";
import { AdminPageHeader, AdminCard, AdminEmpty } from "@/components/admin/ui";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

/* ══════════════════════════════════════════════════════════════════════════
   File de modération communautaire (cahier §25.3). Server Component : lit les
   signalements (PENDING d'abord), délègue les actions au client
   <ModerationQueue>. Gardé en amont par app/admin/layout.tsx ; chaque query
   revérifie le rôle admin en base (défense en profondeur).
   ══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = { title: "Modération — Administration" };

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "ACTIONED", label: "Traités" },
  { value: "DISMISSED", label: "Classés sans suite" },
];

const VALID_STATUSES = new Set<ReportStatus>(["PENDING", "ACTIONED", "DISMISSED"]);

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const statusParam = one(sp.status) as ReportStatus | undefined;
  const status = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : undefined;

  const reports = await listReportsAdmin({ status });
  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Communauté"
        title="Modération"
        description="Examinez les contenus signalés par la communauté (discussions, réponses, commentaires). « Rejeter le signalement » le classe sans suite ; « Supprimer le contenu » retire définitivement la cible et notifie l'auteur du signalement."
        actions={
          pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-[#b45309]">
              <Clock size={13} />
              {pendingCount} en attente
            </span>
          ) : undefined
        }
      />

      {/* Filtres de statut */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          const href = `/admin/moderation${f.value ? `?status=${f.value}` : ""}`;
          return (
            <a
              key={f.value || "all"}
              href={href}
              aria-current={active ? "true" : undefined}
              className={
                active
                  ? "shrink-0 rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white"
                  : "shrink-0 rounded-full border border-navy/10 px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-navy"
              }
            >
              {f.label}
            </a>
          );
        })}
      </div>

      {reports.length === 0 ? (
        <AdminCard>
          <AdminEmpty
            icon={<ShieldAlert size={34} className="text-text-muted opacity-50" />}
            title="Aucun signalement"
            description={
              status
                ? "Aucun signalement pour ce filtre."
                : "Les contenus signalés par la communauté apparaîtront ici pour examen."
            }
          />
        </AdminCard>
      ) : (
        <ModerationQueue reports={reports} />
      )}
    </div>
  );
}
