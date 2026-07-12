import type { Metadata } from "next";
import { getCoupons } from "@/lib/coupons";
import { AdminPageHeader } from "@/components/admin/ui";
import { CouponManager } from "./CouponManager";

export const metadata: Metadata = { title: "Coupons — Administration" };

/* Server Component : charge les coupons puis délègue l'interactivité (création,
   activation, suppression) au CouponManager côté client. Page gardée par
   app/admin/layout.tsx (requireRole admin). */

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Commercial"
        title="Coupons de réduction"
        description="Créez des codes promotionnels (pourcentage ou montant fixe), plafonnez leurs usages et suivez leur consommation. La remise est toujours revérifiée côté serveur au moment du paiement."
      />
      <CouponManager coupons={coupons} />
    </div>
  );
}
