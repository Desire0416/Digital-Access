import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleCheck, Hourglass, LibraryBig } from "lucide-react";
import { Container, GradientText, Badge } from "@da/ui";
import { currentUser, hasRole } from "@da/auth/guards";
import { getAdminCourses } from "@/lib/studio-queries";
import { CourseReviewCard, PublishedCourseCard } from "./CourseReviewCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Validation des cours",
  robots: { index: false, follow: false },
};

export default async function AdminCoursesPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/admin/courses");
  if (!hasRole(user, "ADMIN", "SUPER_ADMIN")) redirect("/dashboard");

  const { review, published } = await getAdminCourses();

  return (
    <section className="relative isolate overflow-hidden pb-20 pt-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand-violet/10 blur-[110px]" />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-cyan/10 blur-[110px]" />
      </div>

      <Container size="lg">
        <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
          <span className="h-px w-7 bg-gradient-da" />
          Administration Academy
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Validation des <GradientText>cours</GradientText>
        </h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Vérifiez chaque cours soumis par un instructeur avant sa mise en ligne.
          L&apos;approbation publie immédiatement le cours au catalogue et notifie
          son auteur ; le renvoi le repasse en brouillon avec votre motif.
        </p>

        {/* En attente de validation */}
        <div className="mt-10">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-navy">
            <Hourglass size={18} className="text-warning" />
            En attente de validation
            <Badge variant={review.length > 0 ? "warning" : "default"}>
              {review.length}
            </Badge>
          </h2>

          {review.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 p-10 text-center">
              <CircleCheck size={32} className="mx-auto text-success" />
              <p className="mt-3 font-medium text-navy">
                Aucun cours en attente de validation
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Les cours soumis par les instructeurs apparaîtront ici — vous
                serez également notifié dès qu&apos;un nouveau cours est prêt à
                être relu.
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
          <div className="mt-14">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-navy">
              <LibraryBig size={18} className="text-brand-blue-royal" />
              Cours publiés
              <Badge variant="success">{published.length}</Badge>
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Les cours actuellement en ligne au catalogue. Vous pouvez en
              dépublier un si nécessaire.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {published.map((course) => (
                <PublishedCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
