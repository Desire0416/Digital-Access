import type { NextRequest } from "next/server";
import { getDiagnosticContext } from "@/lib/diagnostic/context";
import { generateDiagnostic, DiagnosticError } from "@/lib/diagnostic/ai";
import { clientIp, rateLimited, jsonError } from "@/lib/diagnostic/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { slug } → questions du test de positionnement (sans indication de bonne réponse). */
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY)
    return jsonError("Le test de positionnement IA n'est pas configuré sur le serveur.", 503);
  if (rateLimited(clientIp(req)))
    return jsonError("Trop de tentatives. Patientez quelques secondes.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Requête invalide.", 400);
  }
  const slug = (body as { slug?: unknown })?.slug;
  if (typeof slug !== "string" || !/^[a-z0-9-]{2,80}$/.test(slug))
    return jsonError("Formation invalide.", 400);

  const context = await getDiagnosticContext(slug);
  if (!context) return jsonError("Formation introuvable.", 404);

  try {
    const questions = await generateDiagnostic(context);
    return new Response(
      JSON.stringify({ formationTitle: context.title, level: context.level, questions }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const err = e as DiagnosticError;
    const status = err.code === "AI_KEY_MISSING" ? 503 : 502;
    return jsonError(err.message || "Le test de positionnement a échoué.", status);
  }
}
