import type { NextRequest } from "next/server";
import { getDiagnosticContext } from "@/lib/diagnostic/context";
import { evaluateDiagnostic, DiagnosticError } from "@/lib/diagnostic/ai";
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
      .slice(0, 6)
      .map((x) => String(x).slice(0, 200));
    return {
      id: typeof o.id === "string" ? o.id.slice(0, 20) : `q${i + 1}`,
      question: String(o.question ?? "").slice(0, 400),
      dimension: String(o.dimension ?? "").slice(0, 40),
      options,
    };
  });
}

function sanitizeAnswers(raw: unknown): DiagAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_Q).map((a) => {
    const o = (a ?? {}) as Record<string, unknown>;
    return { id: String(o.id ?? "").slice(0, 20), choice: Math.max(0, Math.min(9, Number(o.choice) || 0)) };
  });
}

/** POST { slug, questions, answers, goal? } → résultat du test de positionnement. */
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY)
    return jsonError("Le test de positionnement IA n'est pas configuré sur le serveur.", 503);
  if (rateLimited(clientIp(req)))
    return jsonError("Trop de tentatives. Patientez quelques secondes.", 429);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Requête invalide.", 400);
  }
  const slug = body?.slug;
  if (typeof slug !== "string" || !/^[a-z0-9-]{2,80}$/.test(slug))
    return jsonError("Formation invalide.", 400);

  const questions = sanitizeQuestions(body.questions);
  const answers = sanitizeAnswers(body.answers);
  if (questions.length < 3 || answers.length < 3)
    return jsonError("Test incomplet.", 400);
  const goal = typeof body.goal === "string" ? body.goal.slice(0, 300) : undefined;

  const context = await getDiagnosticContext(slug);
  if (!context) return jsonError("Formation introuvable.", 404);

  try {
    const result = await evaluateDiagnostic(context, questions, answers, goal);
    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    const err = e as DiagnosticError;
    const status = err.code === "AI_KEY_MISSING" ? 503 : 502;
    return jsonError(err.message || "L'évaluation a échoué.", status);
  }
}
