import { NextResponse } from "next/server";
import { currentUser } from "@da/auth/guards";
import { getNotifications, getUnreadCount } from "@/lib/notification-queries";

export const dynamic = "force-dynamic";

/**
 * Flux de notifications de l'utilisateur courant (pour la cloche d'en-tête).
 * Renvoie les 20 dernières notifications + le nombre de non-lues.
 * Si non connecté → liste vide (statut 200) pour ne jamais casser le rendu.
 * Les Date sont sérialisées en ISO automatiquement par JSON.stringify.
 */
export async function GET() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { notifications: [], unread: 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const [notifications, unread] = await Promise.all([
    getNotifications(user.id, 20),
    getUnreadCount(user.id),
  ]);

  return NextResponse.json(
    { notifications, unread },
    { headers: { "Cache-Control": "no-store" } },
  );
}
