import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { currentUser } from "@da/auth/guards";
import { getMyEnrollments } from "@/lib/learn-queries";
import { DashboardHeading, CourseProgressCard, EmptyState } from "@/components/learner-ui";

export const dynamic = "force-dynamic";

export default async function MesCoursPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard/mes-cours");
  const courses = await getMyEnrollments(user.id);

  const inProgress = courses.filter((c) => c.status !== "COMPLETED");
  const done = courses.filter((c) => c.status === "COMPLETED");

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Apprentissage"
        title="Mes cours"
        description="Tous les parcours auxquels vous êtes inscrit, avec votre progression."
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="Aucun parcours pour l'instant"
          message="Inscrivez-vous à un parcours métier pour commencer à apprendre et suivre vos progrès ici."
          action={{ href: "/career-paths", label: "Explorer les parcours" }}
        />
      ) : (
        <>
          {inProgress.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-navy">En cours</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map((c) => <CourseProgressCard key={c.enrollmentId} card={c} />)}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-navy">Terminés</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {done.map((c) => <CourseProgressCard key={c.enrollmentId} card={c} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
