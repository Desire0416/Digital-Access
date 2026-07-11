import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ImportError } from "./errors";
import {
  type ImportDraft, type DraftModule, type DraftLesson, type DraftQuestion,
  type DraftLevel, type DraftLessonType, type DraftQuestionType,
  DRAFT_LEVELS, DRAFT_LESSON_TYPES, DRAFT_QUESTION_TYPES,
} from "./types";

/* ══════════════════════════════════════════════════════════════════════════
   Construction d'une formation à partir d'un document pédagogique, en 2 passes :
   1) PLAN : méta du parcours (titre, niveau, objectifs…) + liste ORDONNÉE des
      titres de modules.
   2) Par MODULE (en parallèle, plafonné) : à partir de la tranche de texte du
      module, produire les leçons (markdown fidèle au document) et le quiz —
      en NORMALISANT toute question ouverte en QCU/QCM/Vrai-Faux notables
      (bonne réponse ancrée sur le corrigé du document, distracteurs plausibles).
   Sortie structurée forcée (tool use). server-only.
   ══════════════════════════════════════════════════════════════════════════ */

const MODEL = process.env.IMPORT_MODEL || "claude-sonnet-5";
const MAX_TEXT = 90_000; // caractères envoyés en passe 1
const MAX_MODULE_TEXT = 16_000; // caractères par module en passe 2
const MODULE_CONCURRENCY = 4;
const MAX_MODULES = 24;

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ImportError("AI_KEY_MISSING", "ANTHROPIC_API_KEY manquante.");
  return new Anthropic({ apiKey });
}

function frError(e: unknown): ImportError {
  if (e instanceof ImportError) return e;
  const err = e as { status?: number; message?: string };
  const msg = String(err?.message ?? "");
  let fr = "L'analyse IA a échoué. Réessayez dans un instant.";
  if (err?.status === 401 || /authentication|invalid x-api-key|invalid api key/i.test(msg))
    fr = "Clé API Anthropic invalide. Vérifiez ANTHROPIC_API_KEY.";
  else if (/credit balance is too low|insufficient|billing|quota/i.test(msg))
    fr = "Crédit Anthropic insuffisant. Ajoutez des crédits, puis réessayez.";
  else if (err?.status === 429 || /rate.?limit|overloaded/i.test(msg))
    fr = "Service IA momentanément saturé. Réessayez dans quelques instants.";
  else if (err?.status === 404 || /model/i.test(msg))
    fr = "Modèle IA introuvable. Vérifiez IMPORT_MODEL.";
  return new ImportError("AI_FAILED", fr);
}

function toolUseInput(resp: Anthropic.Message): Record<string, unknown> {
  const tool = resp.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
  if (!tool) throw new ImportError("AI_NO_OUTPUT", "Aucune structure produite par l'IA.");
  return tool.input as Record<string, unknown>;
}

/* ── Petites aides de normalisation ─────────────────────────────────────── */
const str = (v: unknown, max: number): string => String(v ?? "").trim().slice(0, max);
const strArr = (v: unknown, maxItems: number, maxLen: number): string[] =>
  (Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter(Boolean).slice(0, maxItems).map((x) => x.slice(0, maxLen));
const intOrNull = (v: unknown): number | null => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/* ══ PASSE 1 — Plan du parcours ═════════════════════════════════════════════ */

const OUTLINE_TOOL = {
  name: "proposer_plan_formation",
  description: "Propose la fiche du parcours et la liste ordonnée des titres de modules.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["path", "modules"],
    properties: {
      path: {
        type: "object",
        additionalProperties: false,
        required: ["title", "level", "targetJob", "shortDescription", "objectives", "schoolSlug", "schoolName"],
        properties: {
          title: { type: "string", description: "Intitulé de la formation." },
          level: { type: "string", enum: DRAFT_LEVELS },
          targetJob: { type: "string", description: "Métier ou profil visé." },
          shortDescription: { type: "string", description: "Résumé accrocheur en 1-2 phrases." },
          longDescription: { type: "string", description: "Description complète (3-5 phrases)." },
          duration: { type: "string", description: "Durée libellée, ex. « 70 heures »." },
          estimatedHours: { type: ["integer", "null"] },
          prerequisites: { type: "array", items: { type: "string" }, maxItems: 10 },
          objectives: { type: "array", items: { type: "string" }, maxItems: 12 },
          outcomes: { type: "array", items: { type: "string" }, maxItems: 10, description: "Ce que l'apprenant obtient / sait faire." },
          tools: { type: "array", items: { type: "string" }, maxItems: 15 },
          certificateTitle: { type: "string" },
          schoolSlug: { type: "string", description: "Slug d'une école EXISTANTE fournie, la plus proche du domaine ; sinon un slug court proposé." },
          schoolName: { type: "string", description: "Nom de l'école (existante de préférence)." },
        },
      },
      modules: {
        type: "array",
        minItems: 1,
        maxItems: MAX_MODULES,
        description: "Titres des modules DANS L'ORDRE du document, y compris un éventuel module final d'évaluation/projet/certification.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title"],
          properties: { title: { type: "string" } },
        },
      },
    },
  },
};

const OUTLINE_SYSTEM = `Tu es concepteur pédagogique d'Access Academy (Côte d'Ivoire). On te donne le TEXTE d'un document de formation. Produis la FICHE du parcours et la LISTE ORDONNÉE des titres de modules.
Règles :
- Reste FIDÈLE au document : n'invente pas de modules qui n'y sont pas. Reprends les titres tels qu'ils apparaissent (ex. « Module 1 — … »).
- Inclus, à la fin et si présents, les sections d'évaluation (devoir, projet certifiant, examen, certification) regroupées en UN module final (ex. « Évaluation, projet & certification »).
- level = niveau réel de la formation (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT).
- Choisis schoolSlug parmi les écoles EXISTANTES fournies si l'une correspond au domaine ; sinon propose un slug court en kebab-case.
- objectives / outcomes / prerequisites / tools : reprends ceux du document. Français, concis.`;

async function extractOutline(
  text: string,
  schools: { slug: string; name: string }[],
): Promise<{ path: Omit<ImportDraft["path"], "slug" | "price" | "featured" | "publish">; moduleTitles: string[] }> {
  const schoolsBlock = schools.length
    ? `ÉCOLES EXISTANTES (choisis-en une si pertinent) :\n${schools.map((s) => `- slug=${s.slug} | ${s.name}`).join("\n")}`
    : "Aucune école existante fournie.";
  let resp: Anthropic.Message;
  try {
    resp = await client().messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: OUTLINE_SYSTEM,
      tools: [{ ...OUTLINE_TOOL, input_schema: OUTLINE_TOOL.input_schema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "proposer_plan_formation" },
      messages: [
        { role: "user", content: `${schoolsBlock}\n\nDOCUMENT :\n<document>\n${text.slice(0, MAX_TEXT)}\n</document>\n\nProduis la fiche et la liste des modules.` },
      ],
    });
  } catch (e) {
    throw frError(e);
  }
  const out = toolUseInput(resp);
  const p = (out.path ?? {}) as Record<string, unknown>;
  const modules = (Array.isArray(out.modules) ? out.modules : [])
    .map((m) => str((m as Record<string, unknown>)?.title, 200))
    .filter(Boolean)
    .slice(0, MAX_MODULES);
  if (modules.length === 0) throw new ImportError("AI_NO_OUTPUT", "Aucun module identifié.");

  // École : mappe sur une école existante si le slug proposé correspond, sinon garde la proposition.
  const proposedSlug = slugify(str(p.schoolSlug, 60));
  const existing = schools.find((s) => s.slug === proposedSlug);

  return {
    path: {
      title: str(p.title, 160) || "Formation importée",
      level: oneOf<DraftLevel>(p.level, DRAFT_LEVELS, "BEGINNER"),
      targetJob: str(p.targetJob, 160),
      shortDescription: str(p.shortDescription, 400),
      longDescription: str(p.longDescription, 1500),
      duration: str(p.duration, 60),
      estimatedHours: intOrNull(p.estimatedHours),
      prerequisites: strArr(p.prerequisites, 10, 200),
      objectives: strArr(p.objectives, 12, 200),
      outcomes: strArr(p.outcomes, 10, 200),
      tools: strArr(p.tools, 15, 60),
      certificateTitle: str(p.certificateTitle, 160),
      schoolSlug: existing ? existing.slug : proposedSlug || "formations",
      schoolName: existing ? existing.name : str(p.schoolName, 120) || "Formations",
    },
    moduleTitles: modules,
  };
}

/* ══ Segmentation du texte par module (séquentielle, tolérante) ══════════════ */

function locateFrom(hay: string, title: string, from: number): number {
  const words = title.trim().split(/\s+/).slice(0, 8).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return -1;
  try {
    const re = new RegExp(words.join("[\\s\\-—–.]+"), "i");
    const m = re.exec(hay.slice(from));
    return m ? from + m.index : -1;
  } catch {
    return -1;
  }
}

/** Renvoie, pour chaque titre de module, la tranche de texte correspondante. */
function segmentByModules(text: string, titles: string[]): string[] {
  const starts: number[] = [];
  let cursor = 0;
  for (const t of titles) {
    const pos = locateFrom(text, t, cursor);
    if (pos >= 0) {
      starts.push(pos);
      cursor = pos + Math.min(t.length, 30);
    } else {
      starts.push(-1);
    }
  }
  // fin de chaque module = prochain début localisé
  const locatedSorted = starts.filter((p) => p >= 0).sort((a, b) => a - b);
  return starts.map((pos, i) => {
    if (pos < 0) return ""; // module non localisé → passe 2 travaillera à partir du titre seul
    const next = locatedSorted.find((p) => p > pos);
    const end = next ?? text.length;
    return text.slice(pos, end).slice(0, MAX_MODULE_TEXT);
  });
}

/* ══ PASSE 2 — Contenu + quiz d'un module ═══════════════════════════════════ */

const MODULE_TOOL = {
  name: "structurer_module",
  description: "Structure un module : objectifs, leçons (markdown) et quiz noté.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["objectives", "lessons"],
    properties: {
      summary: { type: "string", description: "Résumé du module en 1 phrase." },
      estimatedMinutes: { type: ["integer", "null"] },
      objectives: { type: "array", items: { type: "string" }, maxItems: 8 },
      lessons: {
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "type", "content"],
          properties: {
            title: { type: "string" },
            type: { type: "string", enum: DRAFT_LESSON_TYPES },
            content: { type: "string", description: "Contenu de la leçon en MARKDOWN (titres ##, listes, blocs ```). Fidèle au document." },
          },
        },
      },
      quiz: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["questions"],
        properties: {
          questions: {
            type: "array",
            maxItems: 15,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["question", "type", "options", "correctIndexes"],
              properties: {
                question: { type: "string" },
                type: { type: "string", enum: DRAFT_QUESTION_TYPES },
                options: { type: "array", minItems: 2, maxItems: 6, items: { type: "string" }, description: "Pour TRUE_FALSE : exactement [\"Vrai\", \"Faux\"]." },
                correctIndexes: { type: "array", items: { type: "integer" }, minItems: 1, description: "Indices (0-based) des bonnes options. 1 seul pour SINGLE_CHOICE/TRUE_FALSE." },
                explanation: { type: "string", description: "Courte justification de la bonne réponse." },
              },
            },
          },
        },
      },
    },
  },
};

const MODULE_SYSTEM = `Tu es concepteur pédagogique d'Access Academy. On te donne le TEXTE d'UN module de formation. Structure-le pour une plateforme e-learning.
Règles de contenu :
- Découpe le module en leçons cohérentes (une par sous-thème / section « x.y » du document). Le CONTENU de chaque leçon est du MARKDOWN clair (titres ##, listes à puces, tableaux, et blocs de code balisés en triple accent grave avec le langage, ex. sql, quand il y a du code), FIDÈLE au document — n'invente pas de faits techniques ; réorganise et clarifie seulement. Si le document est bref sur une notion, reste bref plutôt que d'inventer.
- type de leçon : TEXT (cours), EXERCISE (TP / activités / devoir), RESOURCE (annexe / schéma de référence), VIDEO (si explicitement une vidéo).
Règles de QUIZ (crucial) :
- Construis un quiz de validation À PARTIR des questions/corrigés du document.
- La plateforme ne note QUE des questions fermées. Transforme donc CHAQUE question en QCU (SINGLE_CHOICE), QCM (MULTIPLE_CHOICE) ou Vrai/Faux (TRUE_FALSE).
- Si le document donne un « corrigé indicatif » / « réponse » en texte libre : formule une bonne option qui REPREND ce corrigé, puis ajoute 2-3 distracteurs PLAUSIBLES mais faux. La bonne réponse doit correspondre au corrigé du document, jamais à une invention.
- correctIndexes = indices (0-based) des bonnes options. TRUE_FALSE : options = ["Vrai","Faux"], correctIndexes = [0] (Vrai) ou [1] (Faux).
- 3 à 8 questions si possible. Si le module n'a aucune évaluation, renvoie quiz = null.
- Français, vouvoiement, concret.`;

async function structureModule(title: string, moduleText: string): Promise<DraftModule> {
  const body = moduleText.trim().length > 30
    ? `TITRE DU MODULE : ${title}\n\nTEXTE DU MODULE :\n<module>\n${moduleText}\n</module>\n\nStructure ce module.`
    : `TITRE DU MODULE : ${title}\n\n(Le texte détaillé de ce module n'a pas pu être isolé.) Propose une leçon d'introduction fidèle au titre et, si évident, un court quiz. Ne fabrique pas de contenu technique douteux.`;

  let resp: Anthropic.Message;
  try {
    resp = await client().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: MODULE_SYSTEM,
      tools: [{ ...MODULE_TOOL, input_schema: MODULE_TOOL.input_schema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "structurer_module" },
      messages: [{ role: "user", content: body }],
    });
  } catch (e) {
    throw frError(e);
  }
  const out = toolUseInput(resp);

  const lessons: DraftLesson[] = (Array.isArray(out.lessons) ? out.lessons : [])
    .map((l): DraftLesson | null => {
      const o = (l ?? {}) as Record<string, unknown>;
      const content = str(o.content, 12_000);
      const lt = str(o.title, 160);
      if (!content || !lt) return null;
      return { title: lt, type: oneOf<DraftLessonType>(o.type, DRAFT_LESSON_TYPES, "TEXT"), content };
    })
    .filter((x): x is DraftLesson => x !== null)
    .slice(0, 12);

  if (lessons.length === 0) {
    lessons.push({ title: title.slice(0, 160) || "Leçon", type: "TEXT", content: `## ${title}\n\n_Contenu à compléter._` });
  }

  const quiz = normalizeQuiz(out.quiz, title);

  return {
    title: title.slice(0, 200),
    summary: str(out.summary, 300) || undefined,
    objectives: strArr(out.objectives, 8, 200),
    estimatedDuration: intOrNull(out.estimatedMinutes) ?? undefined,
    lessons,
    quiz,
  };
}

/** Normalise le quiz d'un module (types + indices valides) ; renvoie null si vide. */
function normalizeQuiz(raw: unknown, moduleTitle: string): DraftModule["quiz"] {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const questions: DraftQuestion[] = (Array.isArray(q.questions) ? q.questions : [])
    .map((item): DraftQuestion | null => {
      const o = (item ?? {}) as Record<string, unknown>;
      const question = str(o.question, 500);
      if (!question) return null;
      let type = oneOf<DraftQuestionType>(o.type, DRAFT_QUESTION_TYPES, "SINGLE_CHOICE");
      let options = strArr(o.options, 6, 300);
      let correct = (Array.isArray(o.correctIndexes) ? o.correctIndexes : [])
        .map((n) => Math.round(Number(n)))
        .filter((n) => Number.isInteger(n));

      if (type === "TRUE_FALSE") {
        options = ["Vrai", "Faux"];
        const c = correct[0];
        correct = [c === 1 ? 1 : 0];
      } else {
        if (options.length < 2) return null; // question inexploitable
        // indices dans les bornes, uniques
        correct = [...new Set(correct.filter((n) => n >= 0 && n < options.length))];
        if (correct.length === 0) correct = [0];
        if (type === "SINGLE_CHOICE") correct = [correct[0]];
        if (type === "MULTIPLE_CHOICE" && correct.length < 1) correct = [0];
      }
      return {
        question,
        type,
        options,
        correctIndexes: correct,
        explanation: str(o.explanation, 500) || undefined,
      };
    })
    .filter((x): x is DraftQuestion => x !== null)
    .slice(0, 15);

  if (questions.length === 0) return null;
  return {
    title: `Quiz — ${moduleTitle}`.slice(0, 180),
    passingScore: 60,
    questions,
  };
}

/* ══ Orchestration ══════════════════════════════════════════════════════════ */

export interface AnalyzeResult {
  draft: ImportDraft;
  warnings: string[];
  model: string;
}

export async function analyzeDocument(
  text: string,
  schools: { slug: string; name: string }[],
): Promise<AnalyzeResult> {
  if (text.trim().length < 300) throw new ImportError("TOO_SHORT", "Document trop court pour bâtir une formation.");

  const { path, moduleTitles } = await extractOutline(text, schools);
  // On borne le texte scanné à la fenêtre réellement vue par le plan (les titres
  // de modules ne peuvent être localisés qu'à l'intérieur), pour éviter des scans
  // regex sur plusieurs Mo si le document est volumineux.
  const segments = segmentByModules(text.slice(0, MAX_TEXT), moduleTitles);

  const warnings: string[] = [];
  const unlocated = segments.filter((s) => s.trim().length < 30).length;
  if (unlocated > 0) warnings.push(`${unlocated} module(s) n'ont pas pu être isolés du texte ; leur contenu est à compléter.`);

  // Tolérance par module : l'échec de l'analyse d'UN module (IA saturée, réponse
  // malformée…) ne doit pas jeter tout l'import. On substitue un module à
  // compléter + un avertissement, en préservant les modules déjà réussis.
  const modules = await mapLimit(moduleTitles, MODULE_CONCURRENCY, async (title, i) => {
    try {
      return await structureModule(title, segments[i]);
    } catch (e) {
      warnings.push(`Le module « ${title.slice(0, 80)} » n'a pas pu être analysé par l'IA${e instanceof ImportError ? ` (${e.message})` : ""} — complétez-le manuellement.`);
      return {
        title: title.slice(0, 200),
        summary: undefined,
        objectives: [] as string[],
        estimatedDuration: undefined,
        lessons: [{ title: title.slice(0, 160) || "Leçon", type: "TEXT" as const, content: `## ${title}\n\n_Contenu à compléter (l'analyse automatique de ce module a échoué)._` }],
        quiz: null,
      };
    }
  });

  const draft: ImportDraft = {
    path: {
      ...path,
      slug: slugify(path.title),
      price: 0,
      featured: false,
      publish: false, // brouillon par défaut : l'admin publie après revue
    },
    modules,
  };
  return { draft, warnings, model: MODEL };
}

/* ── slug ────────────────────────────────────────────────────────────────── */
export function slugify(s: string): string {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || "formation";
}
