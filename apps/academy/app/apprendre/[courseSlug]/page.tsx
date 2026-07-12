import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/guards";
import { getPlayerCourse } from "@/lib/learn-queries";

/* ══════════════════════════════════════════════════════════════════════════
   /apprendre/[courseSlug] — point d'entrée du lecteur. Aiguille l'apprenant
   vers sa leçon de reprise (§17.2) : la première leçon non terminée, sinon
   (tout est fait) la toute première leçon de la formation.
   ══════════════════════════════════════════════════════════════════════════ */

export default async function PlayerEntryPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const user = await currentUser();
  const course = await getPlayerCourse(courseSlug, user?.id ?? null);
  if (!course) notFound();

  // Reprise : prochaine leçon non terminée, sinon première leçon disponible.
  const firstLessonId = course.modules.flatMap((m) => m.lessons)[0]?.id ?? null;
  const target = course.nextLessonId ?? firstLessonId;

  // Formation sans aucune leçon publiée : retour à la fiche.
  if (!target) redirect(`/formations/${courseSlug}`);

  redirect(`/apprendre/${courseSlug}/${target}`);
}
