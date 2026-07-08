import { notFound, redirect } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { getCourseForPlayer, getPlayerLesson } from "@/lib/learn-queries";
import { PlayerShell } from "@/components/PlayerShell";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ course: string; lessonId: string }>;
}) {
  const { course, lessonId } = await params;
  const user = await currentUser();

  const lesson = await getPlayerLesson(lessonId, user?.id);
  if (!lesson) notFound();
  // URL canonique : la leçon fait foi (évite une sidebar d'un autre parcours).
  if (lesson.course.slug !== course) redirect(`/apprendre/${lesson.course.slug}/${lessonId}`);

  const courseData = await getCourseForPlayer(lesson.course.slug, user?.id);
  if (!courseData) notFound();

  return <PlayerShell course={courseData} lesson={lesson} isAuthed={Boolean(user)} />;
}
