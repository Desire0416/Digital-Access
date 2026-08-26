import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/* ══════════════════════════════════════════════════════════════════════════
   Relance marketing assistée par l'IA (§ réengagement).
   Génère un email MARKETING personnalisé pour un inscrit inactif : ton chaleureux
   et engageant, invitation à revenir sur la plateforme, et RECOMMANDATIONS de
   formations choisies selon le profil et les centres d'intérêt de la personne.
   Sortie structurée forcée (tool use). server-only.
   ══════════════════════════════════════════════════════════════════════════ */

export class ReengagementError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const MODEL = process.env.REENGAGEMENT_MODEL || process.env.DIAGNOSTIC_MODEL || "claude-haiku-4-5";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ReengagementError("AI_KEY_MISSING", "ANTHROPIC_API_KEY manquante.");
  return new Anthropic({ apiKey });
}

function frError(e: unknown): ReengagementError {
  const err = e as { status?: number; message?: string };
  const msg = String(err?.message ?? "");
  if (e instanceof ReengagementError) return e;
  let fr = "La génération du message a échoué. Réessayez dans un instant.";
  if (err?.status === 401 || /authentication|invalid x-api-key|invalid api key/i.test(msg))
    fr = "Clé API Anthropic invalide. Vérifiez ANTHROPIC_API_KEY.";
  else if (/credit balance is too low|insufficient|billing|quota/i.test(msg))
    fr = "Crédit Anthropic insuffisant. Ajoutez des crédits, puis réessayez.";
  else if (err?.status === 429 || /rate.?limit|overloaded/i.test(msg))
    fr = "Service IA momentanément saturé. Réessayez dans quelques instants.";
  else if (err?.status === 404 || /model/i.test(msg))
    fr = "Modèle IA introuvable. Vérifiez REENGAGEMENT_MODEL.";
  return new ReengagementError("AI_FAILED", fr);
}

export interface ReengagementUserContext {
  firstName?: string | null;
  name: string;
  objective?: string | null;
  experienceLevel?: string | null;
  country?: string | null;
  neverConnected: boolean;
  daysSinceSignup: number;
  daysSinceActive?: number | null;
  enrolledCourseTitles: string[];
  favoriteCourseTitles: string[];
}

export interface CandidateCourse {
  slug: string;
  title: string;
  subtitle?: string | null;
  school?: string | null;
  level: string;
  priceLabel: string;
}

export interface ReengagementDraft {
  subject: string;
  preheader: string;
  greeting: string;
  intro: string;
  body: string[];
  recommendations: { slug: string; title: string; pitch: string }[];
  ctaLabel: string;
  signoff: string;
}

const TOOL = {
  name: "rediger_relance",
  description: "Rédige l'email marketing de relance personnalisé.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["subject", "preheader", "greeting", "intro", "body", "recommendations", "ctaLabel", "signoff"],
    properties: {
      subject: { type: "string", description: "Objet de l'email, accrocheur, personnalisé, < 70 caractères. Pas de « Re: » ni d'emoji spam." },
      preheader: { type: "string", description: "Texte d'aperçu (preheader) court qui complète l'objet, < 100 caractères." },
      greeting: { type: "string", description: "Salutation personnalisée, ex. « Bonjour Awa, ». Vouvoiement." },
      intro: { type: "string", description: "1-2 phrases chaleureuses qui rappellent la plateforme et invitent à revenir, sans culpabiliser." },
      body: { type: "array", items: { type: "string" }, maxItems: 3, description: "1 à 2 paragraphes courts qui donnent envie de reprendre, en lien avec l'objectif ou les centres d'intérêt de la personne." },
      recommendations: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        description: "1 à 3 formations recommandées PARMI CELLES FOURNIES (utilise le slug exact). Choisis les plus pertinentes pour le profil.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["slug", "title", "pitch"],
          properties: {
            slug: { type: "string", description: "Le slug EXACT de la formation choisie dans la liste fournie." },
            title: { type: "string", description: "Le titre de la formation." },
            pitch: { type: "string", description: "1 phrase qui explique pourquoi CETTE formation est faite pour la personne (bénéfice concret)." },
          },
        },
      },
      ctaLabel: { type: "string", description: "Libellé du bouton d'action principal, ex. « Reprendre ma formation » ou « Découvrir le catalogue »." },
      signoff: { type: "string", description: "Formule de clôture, ex. « À très vite sur Access Academy, L'équipe Access Academy »." },
    },
  },
};

const SYSTEM = `Tu es le responsable marketing d'Access Academy, une académie numérique en Côte d'Ivoire (formations professionnelles courtes, en français).
Tu rédiges un email de RELANCE (réengagement) destiné à une personne qui s'est inscrite mais qui n'est pas revenue ou ne s'est jamais connectée.
Objectif : lui donner sincèrement envie de revenir et de commencer/continuer une formation, PAS de la culpabiliser.
Règles :
- Français, vouvoiement, ton chaleureux, humain, positif et professionnel (marketing de qualité, jamais racoleur).
- Personnalise avec le prénom et surtout les CENTRES D'INTÉRÊT / l'objectif de la personne quand ils sont connus.
- Recommande 1 à 3 formations UNIQUEMENT parmi la liste fournie, en utilisant leur slug EXACT, choisies pour leur pertinence avec le profil. Ne JAMAIS inventer de formation ou de slug.
- Reste honnête : pas de fausse urgence, pas de promesse de diplôme d'État (les certificats sont internes), pas de chiffres inventés.
- Concis : un email qui se lit en 20 secondes. Phrases courtes.
- N'inclus PAS de lien en dur ni de bouton dans le texte : la mise en page (boutons, cartes de formation) est ajoutée automatiquement.`;

function ctxBlock(u: ReengagementUserContext, courses: CandidateCourse[]): string {
  const lines = [
    `PERSONNE À RELANCER :`,
    `- Prénom : ${u.firstName || "(inconnu)"}`,
    `- Nom d'affichage : ${u.name}`,
    `- Objectif déclaré : ${u.objective || "(non renseigné)"}`,
    `- Niveau déclaré : ${u.experienceLevel || "(non renseigné)"}`,
    `- Pays : ${u.country || "(non renseigné)"}`,
    u.neverConnected
      ? `- Statut : ne s'est JAMAIS connectée depuis son inscription (il y a ${u.daysSinceSignup} jours).`
      : `- Statut : inscrite il y a ${u.daysSinceSignup} jours, sans activité depuis ${u.daysSinceActive ?? "?"} jours.`,
    `- Formations déjà commencées : ${u.enrolledCourseTitles.length ? u.enrolledCourseTitles.join(" ; ") : "aucune"}`,
    `- Formations mises en favori : ${u.favoriteCourseTitles.length ? u.favoriteCourseTitles.join(" ; ") : "aucune"}`,
    ``,
    `FORMATIONS DISPONIBLES (choisis les recommandations UNIQUEMENT ici, slug exact) :`,
    ...courses.map(
      (c) => `- [${c.slug}] ${c.title}${c.subtitle ? ` — ${c.subtitle}` : ""} (niveau ${c.level}, ${c.school || "Access Academy"}, ${c.priceLabel})`,
    ),
  ];
  return lines.join("\n");
}

export async function generateReengagementEmail(
  user: ReengagementUserContext,
  candidateCourses: CandidateCourse[],
): Promise<ReengagementDraft> {
  if (candidateCourses.length === 0) {
    throw new ReengagementError("NO_COURSES", "Aucune formation publiée à recommander.");
  }
  let resp: Anthropic.Message;
  try {
    resp = await client().messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      tools: [{ ...TOOL, input_schema: TOOL.input_schema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "rediger_relance" },
      messages: [{ role: "user", content: `${ctxBlock(user, candidateCourses)}\n\nRédige l'email de relance.` }],
    });
  } catch (e) {
    throw frError(e);
  }

  const tool = resp.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
  if (!tool) throw new ReengagementError("AI_NO_OUTPUT", "Aucun message généré.");
  const r = (tool.input ?? {}) as Record<string, unknown>;

  const bySlug = new Map(candidateCourses.map((c) => [c.slug, c]));
  const recos = (Array.isArray(r.recommendations) ? r.recommendations : [])
    .map((x) => {
      const o = (x ?? {}) as { slug?: unknown; title?: unknown; pitch?: unknown };
      const slug = String(o.slug ?? "").trim();
      const course = bySlug.get(slug);
      if (!course) return null; // ignore toute reco hors catalogue
      return { slug, title: course.title, pitch: String(o.pitch ?? "").trim().slice(0, 240) };
    })
    .filter(Boolean)
    .slice(0, 3) as { slug: string; title: string; pitch: string }[];

  const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 3) : []);

  return {
    subject: str(r.subject, 140) || "Votre place vous attend sur Access Academy",
    preheader: str(r.preheader, 160),
    greeting: str(r.greeting, 120) || `Bonjour ${user.firstName || user.name},`,
    intro: str(r.intro, 500),
    body: arr(r.body),
    recommendations: recos,
    ctaLabel: str(r.ctaLabel, 60) || "Découvrir le catalogue",
    signoff: str(r.signoff, 200) || "À très vite,\nL'équipe Access Academy",
  };
}
