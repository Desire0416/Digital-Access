import "server-only";
import { prisma } from "@da/db/client";

/* Notifications — lecture (sécurité au niveau ligne : toujours filtrer par userId). */

export async function getNotifications(userId: string, limit = 40) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      read: true,
      link: true,
      createdAt: true,
    },
  });
}

export type NotificationItem = Awaited<ReturnType<typeof getNotifications>>[number];

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export type NotificationPrefs = {
  inApp?: Record<string, boolean>;
  email?: Record<string, boolean>;
} | null;

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  });
  return (u?.notificationPrefs as NotificationPrefs) ?? null;
}
