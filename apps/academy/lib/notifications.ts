import "server-only";
import { prisma } from "@da/db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Helper de création de notifications in-app + respect des préférences.
   notificationPrefs (User, Json) = { inApp?: Record<type,bool>, email?: Record<type,bool> }
   Absent / non défini pour un type = activé par défaut.
   ══════════════════════════════════════════════════════════════════════════ */

export type NotifType =
  | "COURSE_ENROLLED"
  | "PROGRESS_MILESTONE"
  | "CERTIFICATE_ISSUED"
  | "PAYMENT_CONFIRMED"
  | "FORUM_REPLY"
  | "CHAT_MENTION"
  | "STREAK_REMINDER"
  | "SYSTEM";

type Prefs = { inApp?: Record<string, boolean>; email?: Record<string, boolean> } | null;

export function inAppEnabled(prefs: unknown, type: string): boolean {
  return (prefs as Prefs)?.inApp?.[type] !== false;
}

export function emailEnabled(prefs: unknown, type: string): boolean {
  return (prefs as Prefs)?.email?.[type] !== false;
}

/** Crée une notification (best-effort, ne lève jamais). Respecte les préférences in-app. */
export async function createNotification(input: {
  userId: string;
  type: NotifType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { notificationPrefs: true },
    });
    if (!inAppEnabled(user?.notificationPrefs, input.type)) return;

    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        data: (input.data as never) ?? undefined,
      },
    });
  } catch (e) {
    console.error("[academy] createNotification:", e);
  }
}
