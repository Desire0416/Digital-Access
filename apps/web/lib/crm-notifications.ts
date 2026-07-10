import "server-only";
import { prisma } from "@da/db/client";
import type { NotificationType } from "@da/db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Notifications internes du CRM (in-app). Best-effort : ne lèvent jamais et
   ne bloquent jamais l'action métier. Respectent les préférences in-app de
   l'utilisateur (User.notificationPrefs.inApp[type] === false = désactivé).
   ══════════════════════════════════════════════════════════════════════════ */

type Prefs = { inApp?: Record<string, boolean>; email?: Record<string, boolean> } | null;

function inAppEnabled(prefs: unknown, type: string): boolean {
  return (prefs as Prefs)?.inApp?.[type] !== false;
}

/** Crée une notification pour un utilisateur (respecte ses préférences). */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
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
    console.error("[crm] createNotification:", e);
  }
}

/** Notifie tous les utilisateurs (actifs, non supprimés) portant l'un des rôles. */
export async function notifyRoles(
  roles: string[],
  input: { type: NotificationType; title: string; message: string; link?: string; data?: Record<string, unknown> },
): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { roles: { hasSome: roles as never }, deletedAt: null },
      select: { id: true },
    });
    await Promise.all(users.map((u) => createNotification({ userId: u.id, ...input })));
  } catch (e) {
    console.error("[crm] notifyRoles:", e);
  }
}

/** Notifie un utilisateur précis s'il est défini (ex. le responsable assigné). */
export async function notifyMaybe(
  userId: string | null | undefined,
  input: { type: NotificationType; title: string; message: string; link?: string; data?: Record<string, unknown> },
): Promise<void> {
  if (!userId) return;
  await createNotification({ userId, ...input });
}
