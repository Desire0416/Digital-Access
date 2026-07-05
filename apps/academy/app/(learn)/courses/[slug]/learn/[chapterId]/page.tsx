import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser, hasRole } from "@da/auth/guards";
import { getPlayerData } from "@/lib/queries";
import { PlayerShell } from "@/components/PlayerShell";
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

  const streak = await prisma.user.findUnique({
    where: { id: user.id },
    select: { streak: true },
  });

  return (
    <PlayerShell data={data} chapterId={chapterId} userStreak={streak?.streak ?? 0} />
  );
}
