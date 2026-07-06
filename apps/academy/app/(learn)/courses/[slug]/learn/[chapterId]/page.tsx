import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser, hasRole } from "@da/auth/guards";
import { getPlayerData } from "@/lib/queries";
import { getCommunityAccess, getChapterComments } from "@/lib/community-queries";
import { PlayerShell } from "@/components/PlayerShell";
import { ChapterComments } from "./ChapterComments";
import { prisma } from "@da/db/client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}): Promise<Metadata> {
  const { chapterId } = await params;
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { title: true, module: { select: { course: { select: { title: true } } } } },
  });
  return {
    title: chapter
      ? `${chapter.title} — ${chapter.module.course.title}`
      : "Player de cours",
    robots: { index: false, follow: false },
  };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}) {
  const { slug, chapterId } = await params;

  const user = await currentUser();
  if (!user) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/courses/${slug}/learn/${chapterId}`)}`);
  }

  const isAdmin = hasRole(user, "ADMIN", "SUPER_ADMIN");
  const data = await getPlayerData(user.id, slug, isAdmin);
  if (!data) notFound();

  const chapter = data.flatChapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  // Chapitre verrouillé (ni inscrit, ni aperçu, ni instructeur/admin) → fiche cours.
  if (chapter.locked) {
    redirect(`/courses/${slug}`);
  }

  const [streak, access] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { streak: true } }),
    getCommunityAccess(user.id, slug),
  ]);
  const comments = access?.canView
    ? await getChapterComments(chapterId, access.instructorId)
    : [];

  return (
    <PlayerShell
      data={data}
      chapterId={chapterId}
      userStreak={streak?.streak ?? 0}
      commentsSlot={
        access ? (
          <ChapterComments
            slug={slug}
            chapterId={chapterId}
            comments={comments}
            canView={access.canView}
            canPost={access.canPost}
            isPrivileged={access.isPrivileged}
            currentUserId={user.id}
          />
        ) : null
      }
    />
  );
}
