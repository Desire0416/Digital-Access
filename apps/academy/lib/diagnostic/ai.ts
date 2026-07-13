import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosticContext, DiagQuestion, DiagAnswer, DiagResult, DiagLevel, DiagVerdict } from "./types";
import { LEVEL_LABEL } from "./types";

/* ══════════════════════════════════════════════════════════════════════════
   Test de positionnement d'une formation, piloté par l'IA (cahier §22.2).
   1) generateDiagnostic → 8 questions à choix unique adaptées au domaine de la
      formation (options ordonnées débutant → avancé, pour révéler le niveau).
   2) evaluateDiagnostic → estime le niveau du candidat et rend un VERDICT
      d'orientation (accès direct / préparation / réorientation / dispense),
      en se référant aux modules réels. Sortie structurée forcée (tool use).
   server-only. Modèle rapide par défaut (interactif) ; surchargeable par env.
   ══════════════════════════════════════════════════════════════════════════ */

export class DiagnosticError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const MODEL = process.env.DIAGNOSTIC_MODEL || "claude-haiku-4-5";
const QUESTION_COUNT = 8;

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new DiagnosticError("AI_KEY_MISSING", "ANTHROPIC_API_KEY manquante.");
  return new Anthropic({ apiKey });
}

function frError(e: unknown): DiagnosticError {
  const err = e as { status?: number; message?: string };
  const msg = String(err?.message ?? "");
  if (e instanceof DiagnosticError) return e;
  let fr = "Le test de positionnement a échoué. Réessayez dans un instant.";
  if (err?.status === 401 || /authentication|invalid x-api-key|invalid api key/i.test(msg))
    fr = "Clé API Anthropic invalide. Vérifiez ANTHROPIC_API_KEY.";
  else if (/credit balance is too low|insufficient|billing|quota/i.test(msg))
    fr = "Crédit Anthropic insuffisant. Ajoutez des crédits, puis réessayez.";
  else if (err?.status === 429 || /rate.?limit|overloaded/i.test(msg))
    fr = "Service IA momentanément saturé. Réessayez dans quelques instants.";
  else if (err?.status === 404 || /model/i.test(msg))
    fr = "Modèle IA introuvable. Vérifiez DIAGNOSTIC_MODEL.";
  return new DiagnosticError("AI_FAILED", fr);
}

const contextBlock = (c: DiagnosticContext) => `FORMATION CIBLE :
- Titre : ${c.title}
- Niveau de la formation : ${c.level}
- Résumé : ${c.subtitle}
- Objectifs : ${c.objectives.slice(0, 8).join(" ; ") || "—"}
- Compétences visées : ${c.skills.slice(0, 10).join(", ") || "—"}
- Outils : ${c.tools.join(", ") || "—"}
- Prérequis : ${c.prerequisites.join(" ; ") || "—"}
- Modules (dans l'ordre) : ${c.moduleTitles.map((t, i) => `${i + 1}. ${t}`).join(" | ") || "—"}`;

/* ── 1) Génération des questions ────────────────────────────────────────── */

const GEN_TOOL = {
  name: "proposer_positionnement",
  description: "Propose les questions du test de positionnement.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["questions"],
    properties: {
      questions: {
        type: "array",
        minItems: QUESTION_COUNT,
        maxItems: QUESTION_COUNT,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "dimension", "options"],
          properties: {
            question: { type: "string" },
            dimension: {
              type: "string",
              description: "Ex. Expérience, Concepts, Pratique, Outils, Autonomie.",
            },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              description: "4 options ORDONNÉES du plus débutant au plus avancé.",
              items: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const GEN_SYSTEM = `Tu es concepteur pédagogique d'Access Academy (Côte d'Ivoire). Tu crées un TEST DE POSITIONNEMENT court, à passer AVANT de démarrer une formation, pour estimer le niveau du candidat.
Règles :
- Exactement ${QUESTION_COUNT} questions à choix unique, en français, ton accessible et bienveillant (vouvoiement).
- Strictement dans le DOMAINE de la formation ciblée (compétences + outils fournis).
- Varie les dimensions : expérience vécue, familiarité avec les concepts clés, aisance pratique, outillage, autonomie ; inclus 2 à 3 vraies questions de connaissance allant des fondamentaux aux notions avancées du domaine.
- Pour CHAQUE question, propose 4 options ORDONNÉES du niveau le plus faible (débutant) au plus fort (avancé), de sorte que le choix révèle le niveau. Évite les options « piège » ambiguës.
- Concis, concret, sans jargon inutile. NE donne PAS d'indication de bonne réponse.`;

export async function generateDiagnostic(context: DiagnosticContext): Promise<DiagQuestion[]> {
  let resp: Anthropic.Message;
  try {
    resp = await client().messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: GEN_SYSTEM,
      tools: [{ ...GEN_TOOL, input_schema: GEN_TOOL.input_schema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "proposer_positionnement" },
      messages: [{ role: "user", content: `${contextBlock(context)}\n\nGénère le test de positionnement.` }],
    });
  } catch (e) {
    throw frError(e);
  }
  const tool = resp.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
  if (!tool) throw new DiagnosticError("AI_NO_OUTPUT", "Aucune question générée.");
  const raw = (tool.input as { questions?: unknown }).questions;
  if (!Array.isArray(raw) || raw.length === 0)
    throw new DiagnosticError("AI_NO_OUTPUT", "Test vide.");

  return raw.slice(0, QUESTION_COUNT).map((q, i) => {
    const o = (q ?? {}) as { question?: unknown; dimension?: unknown; options?: unknown };
    const options = (Array.isArray(o.options) ? o.options : [])
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 4);
    return {
      id: `q${i + 1}`,
      question: String(o.question ?? "").trim().slice(0, 400) || `Question ${i + 1}`,
      dimension: String(o.dimension ?? "Niveau").trim().slice(0, 40),
      options: options.length >= 2 ? options : ["Pas du tout", "Un peu", "Bien", "Très bien"],
    };
  });
}

/* ── 2) Évaluation ──────────────────────────────────────────────────────── */

const EVAL_TOOL = {
  name: "rendre_positionnement",
  description: "Rend le niveau recommandé, le verdict d'orientation et les conseils.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["recommendedLevel", "verdict", "score", "confidence", "summary", "strengths", "gaps", "recommendation", "startingPoint"],
    properties: {
      recommendedLevel: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
      verdict: {
        type: "string",
        enum: ["DIRECT_ACCESS", "PREPARATORY", "ORIENTATION", "DISPENSATION"],
        description:
          "DIRECT_ACCESS : le candidat peut démarrer la formation normalement. PREPARATORY : il lui manque des bases — conseiller une préparation avant. ORIENTATION : la formation ne correspond pas à son profil/objectif, réorienter. DISPENSATION : il maîtrise déjà — l'orienter vers les modules avancés / le projet ou une formation supérieure.",
      },
      score: { type: "integer", minimum: 0, maximum: 100, description: "Maîtrise estimée du domaine, 0-100." },
      confidence: { type: "string", enum: ["élevée", "moyenne", "à confirmer"] },
      summary: { type: "string", description: "2-3 phrases personnalisées, vouvoiement." },
      strengths: { type: "array", items: { type: "string" }, maxItems: 4 },
      gaps: { type: "array", items: { type: "string" }, maxItems: 4 },
      recommendation: { type: "string", description: "Comment aborder CETTE formation selon le verdict (réfère-toi aux modules réels)." },
      startingPoint: { type: "string", description: "Où démarrer, ex. « Commencez au Module 1 » ou « Démarrez au Module 4 »." },
    },
  },
};

const EVAL_SYSTEM = `Tu es conseiller pédagogique d'Access Academy. À partir des réponses au test de positionnement et du contenu de la formation, estime le niveau du candidat et rends un VERDICT d'orientation.
Règles :
- recommendedLevel ∈ {BEGINNER, INTERMEDIATE, ADVANCED} : le niveau du CANDIDAT dans le domaine.
- verdict ∈ {DIRECT_ACCESS, PREPARATORY, ORIENTATION, DISPENSATION} :
  · DIRECT_ACCESS si le candidat a le niveau pour suivre la formation normalement.
  · PREPARATORY s'il lui manque des bases : conseille une remise à niveau / des ressources avant de commencer.
  · ORIENTATION si la formation ne semble pas adaptée à son profil ou son objectif : suggère une meilleure direction.
  · DISPENSATION s'il maîtrise déjà l'essentiel : oriente vers les modules avancés, le projet certifiant, ou une formation de niveau supérieur — sans le décourager.
- La formation a son propre niveau (fourni) et une liste ordonnée de modules (fournie). Dans "recommendation" et "startingPoint", réfère-toi aux MODULES RÉELS (ex. « démarrez au Module 4 »).
- Ton bienveillant, personnalisé, vouvoiement, français, concret. Pas de blabla.`;

export async function evaluateDiagnostic(
  context: DiagnosticContext,
  questions: DiagQuestion[],
  answers: DiagAnswer[],
  goal?: string,
): Promise<DiagResult> {
  const byId = new Map(answers.map((a) => [a.id, a.choice]));
  const qa = questions
    .map((q, i) => {
      const choice = byId.get(q.id);
      const chosen =
        typeof choice === "number" && q.options[choice] !== undefined
          ? q.options[choice]
          : "(sans réponse)";
      return `Q${i + 1} [${q.dimension}] ${q.question}\n   Réponse choisie : « ${chosen} »   (options du + faible au + fort : ${q.options.join(" < ")})`;
    })
    .join("\n");

  const goalLine = goal ? `\n\nOBJECTIF DÉCLARÉ DU CANDIDAT : « ${goal.slice(0, 300)} »` : "";

  let resp: Anthropic.Message;
  try {
    resp = await client().messages.create({
      model: MODEL,
      max_tokens: 1400,
      system: EVAL_SYSTEM,
      tools: [{ ...EVAL_TOOL, input_schema: EVAL_TOOL.input_schema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "rendre_positionnement" },
      messages: [
        {
          role: "user",
          content: `${contextBlock(context)}${goalLine}\n\nRÉPONSES AU TEST :\n${qa}\n\nÉvalue et rends ton verdict.`,
        },
      ],
    });
  } catch (e) {
    throw frError(e);
  }
  const tool = resp.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
  if (!tool) throw new DiagnosticError("AI_NO_OUTPUT", "Aucun résultat produit.");
  const r = (tool.input ?? {}) as Record<string, unknown>;

  const level = (["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(String(r.recommendedLevel))
    ? r.recommendedLevel
    : "BEGINNER") as DiagLevel;
  const verdict = (["DIRECT_ACCESS", "PREPARATORY", "ORIENTATION", "DISPENSATION"].includes(String(r.verdict))
    ? r.verdict
    : "DIRECT_ACCESS") as DiagVerdict;
  const strArr = (v: unknown): string[] =>
    (Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 4);
  const num = Math.max(0, Math.min(100, Math.round(Number(r.score) || 0)));

  return {
    recommendedLevel: level,
    levelLabel: LEVEL_LABEL[level],
    verdict,
    score: num,
    confidence: ["élevée", "moyenne", "à confirmer"].includes(String(r.confidence))
      ? String(r.confidence)
      : "moyenne",
    summary: String(r.summary ?? "").trim().slice(0, 700),
    strengths: strArr(r.strengths),
    gaps: strArr(r.gaps),
    recommendation: String(r.recommendation ?? "").trim().slice(0, 900),
    startingPoint: String(r.startingPoint ?? "").trim().slice(0, 300),
  };
}
