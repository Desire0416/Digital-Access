import type { NextRequest } from "next/server";

/* Garde-fous partagés des routes de test de positionnement (best-effort en mémoire). */

const RL_MAX = 15; // requêtes par minute et par IP
const GLOBAL_MAX = 120; // requêtes IA par minute et par instance (garde-fou global)
const RL_WINDOW_MS = 60_000;
const rl = new Map<string, { count: number; reset: number }>();
let globalCount = 0;
let globalReset = 0;

export function clientIp(req: NextRequest): string {
  // IMPORTANT : ne JAMAIS faire confiance au 1er maillon de x-forwarded-for — il
  // est falsifiable par le client (le proxy AJOUTE la vraie IP à droite). On
  // préfère x-real-ip (posé par le proxy) puis le DERNIER maillon de XFF.
  const xff = req.headers.get("x-forwarded-for");
  return (
    req.headers.get("x-real-ip")?.trim() ||
    (xff ? xff.split(",").pop()?.trim() : "") ||
    "unknown"
  );
}

export function rateLimited(ip: string): boolean {
  const now = Date.now();

  // Garde-fou GLOBAL par instance : borne le débit total d'appels IA même si un
  // attaquant fait varier les IP. Défense en profondeur — un store partagé
  // (Redis/Upstash) serait requis pour un plafond réellement distribué en
  // serverless (le Map ci-dessous est par-instance et remis à zéro au cold start).
  if (now > globalReset) {
    globalCount = 0;
    globalReset = now + RL_WINDOW_MS;
  }
  globalCount += 1;
  if (globalCount > GLOBAL_MAX) return true;

  // Limite par IP.
  const e = rl.get(ip);
  if (!e || now > e.reset) {
    rl.set(ip, { count: 1, reset: now + RL_WINDOW_MS });
    return false;
  }
  e.count += 1;
  if (rl.size > 5000) for (const [k, v] of rl) if (now > v.reset) rl.delete(k);
  return e.count > RL_MAX;
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
