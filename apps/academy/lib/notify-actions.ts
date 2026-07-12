"use server";

import { z } from "zod";
import { prisma } from "@da/academy-db/client";
import { currentUser } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Actions notifications (côté client) — chaque action revérifie l'utilisateur
   et n'agit QUE sur ses propres notifications (sécurité niveau ligne).
   ══════════════════════════════════════════════════════════════════════════ */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const parsed = z.string().min(1).safeParse(notificationId);
  if (!parsed.success) return { ok: false, error: "Notification invalide." };
  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  await prisma.notification.updateMany({
    where: { id: parsed.data, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
