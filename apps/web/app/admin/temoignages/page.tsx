import Link from "next/link";
import { Plus, Quote, Star } from "lucide-react";
import { buttonClasses, StaggerGroup, StaggerItem } from "@da/ui";
import { AdminPageHeader, EmptyState, StatCard } from "@/components/admin/ui";
import { getAdminTestimonials } from "@/lib/admin-queries";
import { TestimonialCard } from "./TestimonialCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Témoignages" };

export default async function TestimonialsPage() {
  const items = await getAdminTestimonials();

  const featuredCount = items.filter((t) => t.featured).length;
  const avgRating =
    items.length > 0
      ? (items.reduce((s, t) => s + t.rating, 0) / items.length).toFixed(1)
      : "—";

  return (
    <>
      <AdminPageHeader
        title="Témoignages"
        description="Gérez les avis clients affichés sur le site vitrine. Les témoignages « à la une » apparaissent sur la page d’accueil."
      >
        <Link
          href="/admin/temoignages/nouveau"
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          <Plus className="h-4 w-4" />
          Nouveau témoignage
        </Link>
      </AdminPageHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={<Quote className="h-6 w-6" />}
          title="Aucun témoignage pour l’instant"
          description="Recueillez la voix de vos clients : ajoutez votre premier témoignage et mettez-le en avant sur la page d’accueil."
        >
          <Link
            href="/admin/temoignages/nouveau"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            <Plus className="h-4 w-4" />
            Ajouter un témoignage
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Quote className="h-5 w-5" />}
              label="Témoignages"
              value={items.length}
              tone="violet"
            />
            <StatCard
              icon={<Star className="h-5 w-5" />}
              label="À la une (accueil)"
              value={featuredCount}
              tone="amber"
            />
            <StatCard
              icon={<Star className="h-5 w-5" />}
              label="Note moyenne"
              value={`${avgRating}/5`}
              tone="green"
            />
          </div>

          <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <StaggerItem key={item.id} className="h-full">
                <TestimonialCard item={item} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </>
      )}
    </>
  );
}
