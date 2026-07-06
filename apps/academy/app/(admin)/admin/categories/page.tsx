import type { Metadata } from "next";
import { getAdminCategories } from "@/lib/admin-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catégories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <AdminPageHeader
        title="Catégories"
        description="Organisez le catalogue Academy. Chaque catégorie porte une couleur d'accent et une icône qui la distinguent dans les filtres et les cartes de cours. Une catégorie ne peut être supprimée que si aucun cours n'y est rattaché."
      >
        {/* Le bouton « Nouvelle catégorie » et toute la grille interactive sont
            rendus côté client — la page reste un Server Component qui ne fait
            que récupérer les données et déléguer. */}
        <CategoryManager categories={categories} slot="header" />
      </AdminPageHeader>

      <CategoryManager categories={categories} slot="grid" />
    </div>
  );
}
