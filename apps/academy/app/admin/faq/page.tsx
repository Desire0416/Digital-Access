import type { Metadata } from "next";
import { listFaqAdmin } from "@/lib/support-admin-queries";
import { AdminPageHeader, AdminEmpty } from "@/components/admin/ui";
import { FaqManager } from "@/components/admin/FaqManager";

export const metadata: Metadata = { title: "Centre d'aide — Administration" };

export default async function AdminFaqPage() {
  const items = await listFaqAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Communauté"
        title="Centre d'aide"
        description="Gérez la foire aux questions publiée sur /aide : catégories, ordre d'affichage, visibilité."
      />
      {items.length === 0 ? (
        <div className="space-y-4">
          <AdminEmpty title="Aucune question" description="Ajoutez votre première question à la FAQ publique." />
          <FaqManager items={[]} />
        </div>
      ) : (
        <FaqManager items={items} />
      )}
    </div>
  );
}
