import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { Role } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   « Agir en tant que » (impersonation + prévisualisation de rôle) — cahier §12.
   Un SUPER_ADMIN peut agir en tant qu'un utilisateur précis, ou prévisualiser
   l'interface d'un rôle. L'état est porté par un cookie SIGNÉ (HMAC AUTH_SECRET)
   qui ne fait QUE désigner la cible : il n'accorde AUCUN droit par lui-même.
   Il n'est honoré (dans currentUser()) que si la VRAIE session est SUPER_ADMIN.
   ══════════════════════════════════════════════════════════════════════════ */

export const ACT_AS_COOKIE = "da_actas";
/** Durée de vie d'une session « agir en tant que » (sécurité : expire seule). */
export const ACT_AS_MAX_AGE = 60 * 60 * 4; // 4 h

export type ActAsPayload =
  | { k: "user"; by: string; sub: string }
  | { k: "role"; by: string; role: Role };

function secret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "da-dev-secret";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Signe un payload : `<base64url(json)>.<hmac>`. */
export function signActAs(payload: ActAsPayload): string {
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const mac = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
  return `${body}.${mac}`;
}

/** Vérifie la signature (comparaison à temps constant) et renvoie le payload. */
export function verifyActAs(token: string | undefined): ActAsPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    if (parsed?.k === "user" && typeof parsed.by === "string" && typeof parsed.sub === "string") return parsed as ActAsPayload;
    if (parsed?.k === "role" && typeof parsed.by === "string" && typeof parsed.role === "string") return parsed as ActAsPayload;
    return null;
  } catch {
    return null;
  }
}

/** Lit et vérifie le cookie « agir en tant que » de la requête courante. */
export async function readActAs(): Promise<ActAsPayload | null> {
  const c = (await cookies()).get(ACT_AS_COOKIE)?.value;
  return verifyActAs(c);
}
