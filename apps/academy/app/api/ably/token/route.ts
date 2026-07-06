import { NextRequest } from "next/server";
import { currentUser } from "@da/auth/guards";
import { getCommunityAccess } from "@/lib/community-queries";
import { getAblyRest, chatChannelName } from "@/lib/ably";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Jeton Ably scellé au canal du cours demandé.
 * Vérifie l'accès communautaire (inscrit ou instructeur/admin) AVANT d'accorder
 * subscribe + presence — un utilisateur ne peut écouter que les cours autorisés.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return new Response("Paramètre slug requis.", { status: 400 });

  const user = await currentUser();
  if (!user) return new Response("Non authentifié.", { status: 401 });

  const access = await getCommunityAccess(user.id, slug);
  if (!access?.canView) return new Response("Accès refusé.", { status: 403 });

  const rest = getAblyRest();
  if (!rest) return new Response("Temps réel indisponible.", { status: 503 });

  try {
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId: user.id,
      capability: {
        [chatChannelName(access.courseId)]: ["subscribe", "presence"],
      },
    });
    return Response.json(tokenRequest, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[ably] createTokenRequest:", e);
    return new Response("Erreur d'authentification temps réel.", { status: 500 });
  }
}
