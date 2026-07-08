import { Ticket, CheckCircle2, Repeat } from "lucide-react";
import { getAdminCoupons } from "@/lib/admin-queries";
import { AdminPageHeader, StatCard } from "@/components/admin/ui";
import { CouponsManager } from "@/components/admin/CouponsManager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();

  const total = coupons.length;
  const activeCount = coupons.filter((c) => c.active).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.currentUses, 0);

  return (
    <>
      <AdminPageHeader
        title="Coupons & bourses"
        description="Créez des codes de réduction et des bourses pour rendre les formations plus accessibles. Suivez leur utilisation et désactivez-les à tout moment."
      >
        <span className="rounded-full bg-navy/[0.06] px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {total} coupon{total > 1 ? "s" : ""}
        </span>
      </AdminPageHeader>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Ticket size={18} />} label="Coupons créés" value={total} tone="violet" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Coupons actifs" value={activeCount} tone="green" />
        <StatCard icon={<Repeat size={18} />} label="Utilisations totales" value={totalUses} tone="cyan" />
      </div>

      <CouponsManager coupons={coupons} />
    </>
  );
}
