import { NextResponse } from "next/server";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";
import { getCommunityAccess, getPresence } from "@/lib/community-queries";

export const dynamic = "force-dynamic";

/**
 * Polling du chat de cours. Renvoie les nouveaux messages depuis `after`
 * (timestamp ISO du dernier message connu) + la liste de présence. Chaque appel
 * fait aussi office de « heartbeat » : il met à jour `lastActiveAt` pour que
 * l'appelant soit compté comme présent. (En attendant un vrai push type Ably.)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await currentUser();
  const access = await getCommunityAccess(user?.id ?? null, slug);

  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!access.canView) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const course = await prisma.course.findUnique({
    where: { id: access.courseId },
    select: { instructorId: true },
  });
  const instructorId = course?.instructorId ?? null;

  // Heartbeat de présence.
  if (user?.id) {
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  }

  const afterParam = new URL(req.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : null;

  const room = await prisma.chatRoom.findUnique({ where: { courseId: access.courseId } });

  let messages: {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string; avatar: string | null; isInstructor: boolean };
  }[] = [];

  if (room) {
    const rows = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: room.id,
        ...(after && !Number.isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: after ? 100 : 50,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    messages = rows.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      author: {
        id: m.user.id,
        name: m.user.name,
        avatar: m.user.avatar,
        isInstructor: m.user.id === instructorId,
      },
    }));
  }

  const presence = await getPresence(access.courseId, instructorId);

  return NextResponse.json(
    { messages, presence },
    { headers: { "Cache-Control": "no-store" } },
  );
}
