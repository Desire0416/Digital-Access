import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";
import type { NotificationItem } from "./crm-types";

/* Notifications internes de l'utilisateur courant (inbox personnel). */

export async function getMyNotifications(limit = 15): Promise<NotificationItem[]> {
  const user = await currentUser();
  if (!user) return [];
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, type: true, title: true, message: true, link: true, read: true, createdAt: true },
  });
  return rows.map((n) => ({
    id: n.id, type: n.type as string, title: n.title, message: n.message,
    link: n.link, read: n.read, createdAt: n.createdAt.toISOString(),
  }));
}

export async function getUnreadCount(): Promise<number> {
  const user = await currentUser();
  if (!user) return 0;
  return prisma.notification.count({ where: { userId: user.id, read: false } });
}
