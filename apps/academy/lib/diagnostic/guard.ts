import type { NextRequest } from "next/server";

/* Garde-fous partagés des routes de diagnostic IA (best-effort en mémoire). */

const RL_MAX = 15; // requêtes
const RL_WINDOW_MS = 60_000; // par minute et par IP
const rl = new Map<string, { count: number; reset: number }>();

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimited(ip: string): boolean {
  const now = Date.now();
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
