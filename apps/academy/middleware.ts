import { NextResponse, type NextRequest } from "next/server";

/* ══════════════════════════════════════════════════════════════════════════
   Middleware Academy :
   1. Expose le chemin courant (`x-pathname`) aux Server Components — la coquille
      /espace s'en sert pour laisser passer les pages de compte partagées.
   2. Pose un cookie de session `da_sid` (visiteur unique approximatif) utilisé
      par le compteur de visites (/api/track). Aucune donnée personnelle.
   ══════════════════════════════════════════════════════════════════════════ */

const SID_COOKIE = "da_sid";
const SID_MAX_AGE = 60 * 60 * 24 * 180; // 180 jours

export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  const res = NextResponse.next({ request: { headers } });

  if (!req.cookies.get(SID_COOKIE)?.value) {
    res.cookies.set(SID_COOKIE, crypto.randomUUID(), {
      maxAge: SID_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return res;
}

export const config = {
  // Toutes les pages sauf les assets statiques, les fichiers Next et les routes API.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
