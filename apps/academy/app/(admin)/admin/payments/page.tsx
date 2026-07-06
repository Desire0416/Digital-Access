import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Hourglass, Wallet, XCircle } from "lucide-react";
import { formatFCFA } from "@da/ui";
import { getAdminPayments } from "@/lib/payment-queries";
import { AdminPageHeader, StatCard, type Tone } from "@/components/admin/ui";
import { PaymentsManager, type PaymentFilterState } from "./PaymentsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paiements",
  robots: { index: false, follow: false },
};

/* KPI cliquable → pose (ou retire) un filtre de statut via l'URL. */
function KpiLink({
  href,
  active,
  icon,
  label,
  value,
  hint,
  tone,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      aria-label={`Filtrer : ${label}`}
      className={`block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40 ${
        active ? "ring-2 ring-brand-violet/50" : ""
      }`}
    >
      <StatCard icon={icon} label={label} value={value} hint={hint} tone={tone} />
    </Link>
  );
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    provider?: string;
  }>;
}) {
  const sp = await searchParams;
  const filters: PaymentFilterState = {
    q: sp.q?.trim() ?? "",
    status: sp.status ?? "",
    type: sp.type ?? "",
    provider: sp.provider ?? "",
  };

  const { items, stats } = await getAdminPayments(filters);

  // Construit un href KPI en préservant recherche / type / fournisseur, et en
  // basculant le filtre de statut (re-cliquer un KPI actif le désactive).
  const kpiHref = (status: string) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.type) params.set("type", filters.type);
    if (filters.provider) params.set("provider", filters.provider);
    if (status && filters.status !== status) params.set("status", status);
    const qs = params.toString();
    return qs ? `/admin/payments?${qs}` : "/admin/payments";
  };

  return (
    <div>
      <AdminPageHeader
        title="Paiements"
        description="Suivez tous les paiements de la plateforme, recherchez, filtrez, puis ouvrez un paiement pour en voir le détail. Pour les preuves Mobile Money, comparez avec vos relevés avant d'approuver : l'approbation ouvre immédiatement l'accès et notifie l'apprenant."
      />

      {/* ── KPI cliquables (filtrent par statut) ─────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiLink
          href={kpiHref("COMPLETED")}
          active={filters.status === "COMPLETED"}
          icon={<Wallet size={18} />}
          label="Total encaissé"
          value={formatFCFA(stats.collected)}
          hint="Confirmés"
          tone="green"
        />
        <KpiLink
          href={kpiHref("PENDING")}
          active={filters.status === "PENDING"}
          icon={<Hourglass size={18} />}
          label="En attente"
          value={stats.pending.toLocaleString("fr-FR")}
          hint={stats.pending > 0 ? "À vérifier" : undefined}
          tone="amber"
        />
        <KpiLink
          href={kpiHref("COMPLETED")}
          active={filters.status === "COMPLETED"}
          icon={<CircleCheck size={18} />}
          label="Confirmés"
          value={stats.completed.toLocaleString("fr-FR")}
          tone="blue"
        />
        <KpiLink
          href={kpiHref("FAILED")}
          active={filters.status === "FAILED"}
          icon={<XCircle size={18} />}
          label="Échoués / remb."
          value={stats.failedOrRefunded.toLocaleString("fr-FR")}
          tone="red"
        />
      </div>

      <PaymentsManager items={items} filters={filters} />
    </div>
  );
}
