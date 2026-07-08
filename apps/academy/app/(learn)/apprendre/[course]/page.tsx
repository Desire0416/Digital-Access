import { notFound, redirect } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { getCourseForPlayer } from "@/lib/learn-queries";

export const dynamic = "force-dynamic";

/** Entrée du player sans leçon précise → reprend là où l'apprenant s'est arrêté. */
export default async function CoursePlayerIndex({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course } = await params;
  const user = await currentUser();
  const data = await getCourseForPlayer(course, user?.id);
  if (!data) notFound();

  const target = data.resumeLessonId ?? data.firstLessonId;
  if (!target) notFound();
  redirect(`/apprendre/${course}/${target}`);
}
