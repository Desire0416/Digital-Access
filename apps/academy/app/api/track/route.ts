import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@da/academy-db/client";
import { currentUser } from "@/lib/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Compteur de visites — enregistre une vue de page (§ analytics back-office).
   Appelé par le composant client <VisitTracker> à chaque navigation. On ne
   stocke que : chemin, session anonyme (cookie da_sid), userId éventuel,
   referrer et type d'appareil. Aucune donnée personnelle supplémentaire.
   Les chemins d'administration ne sont pas comptés (fréquentation du site).
   ══════════════════════════════════════════════════════════════════════════ */

const IGNORED_PREFIXES = ["/admin", "/api", "/_next", "/connexion", "/inscription", "/auth"];

function isMobile(ua: string): boolean {
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 300) : "";
  if (!path.startsWith("/")) return NextResponse.json({ ok: false }, { status: 400 });
  if (IGNORED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return new NextResponse(null, { status: 204 });
  }

  const sid = (await cookies()).get("da_sid")?.value;
  if (!sid) return new NextResponse(null, { status: 204 }); // pas de session → on ignore silencieusement

  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const referrerRaw = typeof body.referrer === "string" ? body.referrer : "";
  // On ne conserve que le domaine du referrer externe (pas les chemins internes).
  let referrer: string | null = null;
  try {
    if (referrerRaw) {
      const u = new URL(referrerRaw);
      const host = h.get("host") ?? "";
      referrer = u.host === host ? null : u.host.slice(0, 200);
    }
  } catch {
    referrer = null;
  }

  const user = await currentUser().catch(() => null);

  try {
    await prisma.pageView.create({
      data: {
        path,
        sessionId: sid.slice(0, 64),
        userId: user?.id ?? null,
        referrer,
        device: isMobile(ua) ? "mobile" : "desktop",
      },
    });
  } catch {
    // Le suivi ne doit jamais casser la navigation.
  }
  return new NextResponse(null, { status: 204 });
}
