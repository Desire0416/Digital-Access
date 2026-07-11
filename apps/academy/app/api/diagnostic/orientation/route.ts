import type { NextRequest } from "next/server";
import { getCatalogueForDiagnostic, buildOrientationQuestions } from "@/lib/diagnostic/catalogue";
import { clientIp, rateLimited, jsonError } from "@/lib/diagnostic/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST → questions d'orientation (domaine bâti depuis les écoles réelles). */
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY)
    return jsonError("Le diagnostic IA n'est pas configuré sur le serveur.", 503);
  if (rateLimited(clientIp(req)))
    return jsonError("Trop de tentatives. Patientez quelques secondes.", 429);

  const { schools } = await getCatalogueForDiagnostic();
  const questions = buildOrientationQuestions(schools);
  return new Response(JSON.stringify({ questions }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
