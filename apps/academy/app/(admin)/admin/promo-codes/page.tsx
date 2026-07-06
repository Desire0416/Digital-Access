import type { Metadata } from "next";
import { getAdminPromoCodes } from "@/lib/admin-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { PromoManager } from "./PromoManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Codes promo",
  robots: { index: false, follow: false },
};

export default async function AdminPromoCodesPage() {
  const codes = await getAdminPromoCodes();

  return (
    <div>
      <AdminPageHeader
        title="Codes promo"
        description="Créez et pilotez les codes de réduction Access Academy : pourcentage ou montant fixe, plafond d'utilisations et date d'expiration. Un code déjà utilisé lors d'un paiement ne peut plus être supprimé — désactivez-le à la place."
      >
        {/* Le bouton « Nouveau code » est rendu côté client (dialogue). La page
            reste un Server Component qui ne fait que récupérer les données. */}
        <PromoManager codes={codes} slot="header" />
      </AdminPageHeader>

      <PromoManager codes={codes} slot="list" />
    </div>
  );
}
