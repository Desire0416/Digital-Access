import type { Metadata } from "next";
import Link from "next/link";
import { FolderTree, Layers, Sparkles } from "lucide-react";
import { getAdminCategories } from "@/lib/admin-queries";
import { AdminPageHeader, StatCard } from "@/components/admin/ui";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catégories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  const total = categories.length;
  const classified = categories.reduce((sum, c) => sum + c.courseCount, 0);
  const empty = categories.filter((c) => c.courseCount === 0).length;

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

      {/* ── KPI cliquables ────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/courses"
          className="rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40 hover:-translate-y-0.5"
          aria-label="Voir tous les cours du catalogue"
        >
          <StatCard
            icon={<FolderTree size={18} />}
            label="Total catégories"
            value={total}
            tone="violet"
            hint="Voir le catalogue"
          />
        </Link>

        <Link
          href="/admin/courses"
          className="rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40 hover:-translate-y-0.5"
          aria-label="Voir les cours classés"
        >
          <StatCard
            icon={<Layers size={18} />}
            label="Cours classés"
            value={classified}
            tone="blue"
            hint="Répartis dans les catégories"
          />
        </Link>

        <Link
          href="/admin/courses"
          className="rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40 hover:-translate-y-0.5"
          aria-label="Catégories sans cours rattaché"
        >
          <StatCard
            icon={<Sparkles size={18} />}
            label="Catégories vides"
            value={empty}
            tone={empty > 0 ? "amber" : "green"}
            hint={empty > 0 ? "À alimenter" : "Toutes utilisées"}
          />
        </Link>
      </div>

      <CategoryManager categories={categories} slot="grid" />
    </div>
  );
}
