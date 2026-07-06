"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions — Notifications. Sécurité au niveau ligne : chaque mutation
   filtre par l'utilisateur courant (updateMany/deleteMany where userId).
   ══════════════════════════════════════════════════════════════════════════ */

export type NotifResult = { ok: true } | { ok: false; error: string };

export async function markNotificationRead(id: string): Promise<NotifResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée." };
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<NotifResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée." };
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true };
}

export async function deleteNotification(id: string): Promise<NotifResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée." };
  await prisma.notification.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/notifications");
  return { ok: true };
}

const TYPES = [
  "COURSE_ENROLLED",
  "PROGRESS_MILESTONE",
  "CERTIFICATE_ISSUED",
  "PAYMENT_CONFIRMED",
  "FORUM_REPLY",
  "CHAT_MENTION",
  "STREAK_REMINDER",
  "SYSTEM",
] as const;

const prefsSchema = z.object({
  inApp: z.record(z.enum(TYPES), z.boolean()).optional(),
  email: z.record(z.enum(TYPES), z.boolean()).optional(),
});

export async function updateNotificationPrefs(input: unknown): Promise<NotifResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée." };
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Préférences invalides." };
  await prisma.user.update({
    where: { id: user.id },
    data: { notificationPrefs: parsed.data as never },
  });
  revalidatePath("/notifications");
  return { ok: true };
}
