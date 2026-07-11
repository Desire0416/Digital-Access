import type { NextRequest } from "next/server";
import { getCatalogueForDiagnostic } from "@/lib/diagnostic/catalogue";
import { recommendFormations, DiagnosticError } from "@/lib/diagnostic/ai";
import type { DiagQuestion, DiagAnswer } from "@/lib/diagnostic/types";
import { clientIp, rateLimited, jsonError } from "@/lib/diagnostic/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_Q = 12;

function sanitizeQuestions(raw: unknown): DiagQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_Q).map((q, i) => {
    const o = (q ?? {}) as Record<string, unknown>;
    const options = (Array.isArray(o.options) ? o.options : [])
      .slice(0, 12)
      .map((x) => String(x).slice(0, 120));
    return {
      id: typeof o.id === "string" ? o.id.slice(0, 20) : `q${i + 1}`,
      question: String(o.question ?? "").slice(0, 300),
      dimension: String(o.dimension ?? "").slice(0, 40),
      options,
    };
  });
}

function sanitizeAnswers(raw: unknown): DiagAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_Q).map((a) => {
    const o = (a ?? {}) as Record<string, unknown>;
    return { id: String(o.id ?? "").slice(0, 20), choice: Math.max(0, Math.min(20, Number(o.choice) || 0)) };
  });
}

/** POST { questions, answers, goal? } → formations recommandées du catalogue. */
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY)
    return jsonError("Le diagnostic IA n'est pas configuré sur le serveur.", 503);
  if (rateLimited(clientIp(req)))
    return jsonError("Trop de tentatives. Patientez quelques secondes.", 429);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Requête invalide.", 400);
  }
  const questions = sanitizeQuestions(body.questions);
  const answers = sanitizeAnswers(body.answers);
  if (questions.length < 3 || answers.length < 3) return jsonError("Diagnostic incomplet.", 400);
  const goal = typeof body.goal === "string" ? body.goal.slice(0, 300) : undefined;

  const { formations } = await getCatalogueForDiagnostic();
  if (formations.length === 0) return jsonError("Catalogue indisponible.", 503);

  try {
    const result = await recommendFormations(formations, questions, answers, goal);
    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    const err = e as DiagnosticError;
    const status = err.code === "AI_KEY_MISSING" ? 503 : 502;
    return jsonError(err.message || "La recommandation a échoué.", status);
  }
}
