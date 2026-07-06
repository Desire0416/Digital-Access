import type { Metadata } from "next";
import { CircleCheck, Hourglass, LibraryBig } from "lucide-react";
import { Badge } from "@da/ui";
import { getAdminCourses } from "@/lib/studio-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { CourseReviewCard, PublishedCourseCard } from "./CourseReviewCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Validation des cours",
  robots: { index: false, follow: false },
};

export default async function AdminCoursesPage() {
  const { review, published } = await getAdminCourses();

  return (
    <div>
      <AdminPageHeader
        title="Validation des cours"
        description="Vérifiez chaque cours soumis par un instructeur avant sa mise en ligne. L'approbation publie immédiatement le cours au catalogue et notifie son auteur ; le renvoi le repasse en brouillon avec votre motif."
      />

      {/* En attente de validation */}
      <div>
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-navy">
          <Hourglass size={18} className="text-warning" />
          En attente de validation
          <Badge variant={review.length > 0 ? "warning" : "default"}>{review.length}</Badge>
        </h2>

        {review.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-navy/15 bg-surface-primary/60 p-10 text-center">
            <CircleCheck size={32} className="mx-auto text-success" />
            <p className="mt-3 font-medium text-navy">Aucun cours en attente de validation</p>
            <p className="mt-1 text-sm text-text-secondary">
              Les cours soumis par les instructeurs apparaîtront ici — vous serez également
              notifié dès qu&apos;un nouveau cours est prêt à être relu.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5">
            {review.map((course) => (
              <CourseReviewCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* Cours publiés — historique */}
      {published.length > 0 && (
        <div className="mt-12">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-navy">
            <LibraryBig size={18} className="text-brand-blue-royal" />
            Cours publiés
            <Badge variant="success">{published.length}</Badge>
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Les cours actuellement en ligne au catalogue. Vous pouvez en dépublier un si
            nécessaire.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {published.map((course) => (
              <PublishedCourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
