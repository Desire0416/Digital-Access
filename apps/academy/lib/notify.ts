import "server-only";
import { prisma } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Notifications in-app (cahier §26). `createNotification` est volontairement
   silencieux (try/catch) : une notification qui échoue ne doit JAMAIS faire
   échouer l'action métier qui l'a déclenchée.
   Les mutations exposées au client (marquer lu) vivent dans notify-actions.ts.
   ══════════════════════════════════════════════════════════════════════════ */

export type NotificationKind =
  | "SYSTEM"
  | "ENROLLMENT"
  | "PAYMENT"
  | "CERTIFICATE"
  | "PROJECT"
  | "ASSESSMENT"
  | "PATH"
  | "EQUIVALENCE"
  | "COHORT"
  | "EVENT"
  | "ANNOUNCEMENT"
  | "REMINDER"
  | "FORUM"
  | "MENTION"
  | "COMMENT"
  | "MODERATION"
  | "TICKET";

export async function createNotification(input: {
  userId: string;
  type?: NotificationKind;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? "SYSTEM",
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      },
    });
  } catch {
    // Silencieux : la notification est un effet secondaire, jamais bloquant.
  }
}

export async function getMyNotifications(userId: string, opts?: { unreadOnly?: boolean; take?: number }) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...(opts?.unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: opts?.take ?? 20,
      select: { id: true, type: true, title: true, message: true, link: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { notifications, unreadCount };
}
