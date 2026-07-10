"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";

/* Marquage des notifications de l'utilisateur courant (filtre userId === lui). */

export type Result = { ok: true } | { ok: false; error: string };

export async function markNotificationRead(input: { id?: unknown }): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée." };
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  try {
    await prisma.notification.updateMany({ where: { id: parsed.data.id, userId: user.id }, data: { read: true } });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    console.error("[crm] markNotificationRead:", e);
    return { ok: false, error: "Impossible de mettre à jour la notification." };
  }
}

export async function markAllNotificationsRead(): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée." };
  try {
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    console.error("[crm] markAllNotificationsRead:", e);
    return { ok: false, error: "Impossible de mettre à jour les notifications." };
  }
}
