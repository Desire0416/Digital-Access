import { NextResponse, type NextRequest } from "next/server";

/* Expose le chemin courant aux Server Components (les layouts n'y ont pas
   accès nativement). Utilisé par la coquille /espace pour laisser passer les
   pages de compte partagées (paramètres) tout en cloisonnant le reste. */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/espace/:path*"],
};
